import asyncio
import random
from datetime import datetime, timezone
from app.models.schemas import TelemetryData
from app.database.mongodb import db_client
from app.detection.validation import security_layer
from app.detection.ids import ids
from app.ml.anomaly_detector import ai_detector
from app.websocket.manager import ws_manager

class TelemetrySimulator:
    def __init__(self, num_vehicles=10):
        self.num_vehicles = num_vehicles
        self.running = False
        self.vehicle_states = {}
        for i in range(1, num_vehicles + 1):
            vid = f"EV-{i:03d}"
            base_voltage = random.uniform(3.6, 4.1)
            base_temp = random.uniform(25.0, 35.0)
            self.vehicle_states[vid] = {
                "voltage": base_voltage * 96,
                "current": random.uniform(-50.0, 150.0),
                "temperature": base_temp,
                "soc": random.uniform(20.0, 100.0),
                "soh": random.uniform(90.0, 100.0),
                "charge_cycles": random.randint(10, 500),
                "cell_voltages": [base_voltage + random.uniform(-0.02, 0.02) for _ in range(96)],
                "cell_temperatures": [base_temp + random.uniform(-0.5, 0.5) for _ in range(96)]
            }

    async def start(self):
        if not self.running:
            self.running = True
            print(f"Started Telemetry Simulator for {self.num_vehicles} vehicles.")
            asyncio.create_task(self._simulate_loop())

    async def stop(self):
        self.running = False
        print("Stopped Telemetry Simulator.")

    async def _simulate_loop(self):
        while self.running:
            telemetry_batch = []
            for vid, state in self.vehicle_states.items():
                # Random drift for SOC/Current/SOH
                state["current"] = random.uniform(-50.0, 150.0)
                state["soc"] -= random.uniform(0.001, 0.01)
                
                # Update cell physics
                for i in range(96):
                    # Introduce random cell imbalance occasionally
                    if random.random() < 0.01:
                        state["cell_voltages"][i] += random.uniform(-0.05, 0.05)
                        state["cell_temperatures"][i] += random.uniform(0.5, 2.0)
                    else:
                        state["cell_voltages"][i] += random.uniform(-0.005, 0.005)
                        state["cell_temperatures"][i] += random.uniform(-0.1, 0.1)
                    
                    # Boundaries
                    state["cell_voltages"][i] = max(2.5, min(4.3, state["cell_voltages"][i]))
                    state["cell_temperatures"][i] = max(10.0, min(80.0, state["cell_temperatures"][i]))

                # Aggregate pack values from cells
                state["voltage"] = sum(state["cell_voltages"])
                state["temperature"] = sum(state["cell_temperatures"]) / 96.0
                state["soc"] = max(0.0, min(100.0, state["soc"]))
                
                data = TelemetryData(
                    vehicle_id=vid,
                    timestamp=datetime.now(timezone.utc),
                    battery_voltage=round(state["voltage"], 2),
                    battery_current=round(state["current"], 2),
                    battery_temperature=round(state["temperature"], 2),
                    state_of_charge=round(state["soc"], 2),
                    state_of_health=round(state["soh"], 2),
                    charge_cycles=state["charge_cycles"],
                    cell_voltages=[round(v, 3) for v in state["cell_voltages"]],
                    cell_temperatures=[round(t, 2) for t in state["cell_temperatures"]]
                )
                
                telemetry_batch.append(data.model_dump(by_alias=True))
                # Broadcast stripped down version for fast loop to avoid massive payloads
                fast_payload = data.model_dump(mode='json', by_alias=True)
                await ws_manager.broadcast(fast_payload, "telemetry")
                
                alerts = security_layer.validate_telemetry(data.model_dump(by_alias=True))
                if alerts and db_client.alerts is not None:
                    await db_client.alerts.insert_many([a.model_dump(by_alias=True) for a in alerts])
                    for a in alerts:
                        await ws_manager.broadcast(a.model_dump(mode='json', by_alias=True), "alerts")
                
                threats = await ids.detect_bms_threats(data)
                for t in threats:
                    await ws_manager.broadcast(t.model_dump(mode='json', by_alias=True), "threats")
                    
                anomaly = await ai_detector.process_telemetry(data)
                if anomaly:
                    await ws_manager.broadcast(anomaly.model_dump(mode='json', by_alias=True), "anomalies")
                
            if telemetry_batch and db_client.telemetry is not None:
                await db_client.telemetry.insert_many(telemetry_batch)
                
            await asyncio.sleep(1.0)

telemetry_sim = TelemetrySimulator()

