from app.models.schemas import TelemetryData, CANMessage, Alert

class SecurityLayer:
    def __init__(self):
        pass

    def validate_telemetry(self, data: dict) -> list[Alert]:
        alerts = []
        try:
            telemetry = TelemetryData(**data)
            
            if telemetry.battery_voltage < 250 or telemetry.battery_voltage > 450:
                alerts.append(Alert(
                    vehicle_id=telemetry.vehicle_id,
                    alert_type="InvalidVoltageRange",
                    severity="High",
                    description=f"Impossible voltage detected: {telemetry.battery_voltage}V",
                    raw_data=data
                ))
            if telemetry.battery_temperature > 80:
                alerts.append(Alert(
                    vehicle_id=telemetry.vehicle_id,
                    alert_type="CriticalTemperature",
                    severity="Critical",
                    description=f"Battery temperature exceeded safe limits: {telemetry.battery_temperature}Â°C",
                    raw_data=data
                ))
        except Exception as e:
            alerts.append(Alert(
                vehicle_id=data.get("vehicle_id", "UNKNOWN"),
                alert_type="MalformedTelemetry",
                severity="Medium",
                description=f"Telemetry validation failed: {str(e)}",
                raw_data=data
            ))
        return alerts

    def filter_can_packet(self, data: dict) -> list[Alert]:
        alerts = []
        try:
            can_msg = CANMessage(**data)
            
            if can_msg.can_id not in ["0x1A4", "0x2B1", "0x3C2", "0x4D3", "0x5E4"] and can_msg.can_id != "0x999":
                alerts.append(Alert(
                    vehicle_id=can_msg.vehicle_id,
                    alert_type="InvalidCANID",
                    severity="High",
                    description=f"Unrecognized CAN ID detected: {can_msg.can_id}",
                    raw_data=data
                ))
                
            if can_msg.source_ecu == "FAKE_ECU" or can_msg.can_id == "0x999":
                alerts.append(Alert(
                    vehicle_id=can_msg.vehicle_id,
                    alert_type="SuspiciousECU",
                    severity="Critical",
                    description=f"Suspicious ECU identifier detected: {can_msg.source_ecu}",
                    raw_data=data
                ))
        except Exception as e:
            alerts.append(Alert(
                vehicle_id=data.get("vehicle_id", "UNKNOWN"),
                alert_type="MalformedCANPacket",
                severity="Medium",
                description=f"CAN packet validation failed: {str(e)}",
                raw_data=data
            ))
        return alerts

security_layer = SecurityLayer()

