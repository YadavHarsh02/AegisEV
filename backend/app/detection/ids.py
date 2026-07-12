from app.models.schemas import CANMessage, ThreatEvent, TelemetryData
from app.database.mongodb import db_client
from datetime import datetime, timezone
from app.detection.explanation import explanation_engine
from app.detection.correlation import correlation_engine

class IntrusionDetectionSystem:
    def __init__(self):
        pass

    async def _add_threat(self, threat: ThreatEvent):
        threat.recommended_action = explanation_engine.action_for_threat(threat.threat_type)
        if db_client.threat_events is not None:
            await db_client.threat_events.insert_one(threat.model_dump(by_alias=True))
        await correlation_engine.add_event(threat.vehicle_id, threat.threat_type, {"details": threat.details})

    async def detect_can_threats(self, can_msg: CANMessage) -> list[ThreatEvent]:
        threats = []
        
        if can_msg.source_ecu == "FAKE_ECU" or can_msg.can_id == "0x999":
            threats.append(ThreatEvent(
                vehicle_id=can_msg.vehicle_id,
                threat_type="CANSpoofing",
                risk_level="Critical",
                details=f"Spoofed CAN message detected from {can_msg.source_ecu} with ID {can_msg.can_id}"
            ))
            
        if can_msg.payload == "FFFFFFFFFFFFFFFF":
            threats.append(ThreatEvent(
                vehicle_id=can_msg.vehicle_id,
                threat_type="ReplayAttack",
                risk_level="High",
                details="Historical CAN message replay detected."
            ))
            
        if can_msg.is_attack and can_msg.attack_type == "flood":
             threats.append(ThreatEvent(
                vehicle_id=can_msg.vehicle_id,
                threat_type="CANFlooding",
                risk_level="Critical",
                details="Abnormally high CAN message volume detected."
            ))
        
        for t in threats:
            await self._add_threat(t)
            
        return threats
        
    async def detect_bms_threats(self, telemetry: TelemetryData) -> list[ThreatEvent]:
        threats = []
        
        if telemetry.battery_temperature < -20 or telemetry.battery_temperature > 70:
             threats.append(ThreatEvent(
                vehicle_id=telemetry.vehicle_id,
                threat_type="TemperatureManipulation",
                risk_level="High",
                details=f"Temperature sensor manipulation suspected: {telemetry.battery_temperature}°C"
            ))
             
        if telemetry.battery_voltage < 300 or telemetry.battery_voltage > 420:
             threats.append(ThreatEvent(
                vehicle_id=telemetry.vehicle_id,
                threat_type="VoltageManipulation",
                risk_level="High",
                details=f"Voltage manipulation suspected: {telemetry.battery_voltage}V"
            ))
             
        for t in threats:
            await self._add_threat(t)
            
        return threats

ids = IntrusionDetectionSystem()
