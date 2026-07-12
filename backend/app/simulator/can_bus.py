import asyncio
import random
from datetime import datetime, timezone
from app.models.schemas import CANMessage
from app.database.mongodb import db_client
from app.detection.validation import security_layer
from app.detection.ids import ids
from app.websocket.manager import ws_manager

NORMAL_CAN_IDS = ["0x1A4", "0x2B1", "0x3C2", "0x4D3", "0x5E4"]
ECUS = ["BMS", "VCU", "MCU", "ABS", "TCU"]

class CANBusSimulator:
    def __init__(self, num_vehicles=10):
        self.num_vehicles = num_vehicles
        self.running = False
        self.attack_active = False
        self.attack_type = None

    async def start(self):
        if not self.running:
            self.running = True
            print(f"Started CAN Bus Simulator for {self.num_vehicles} vehicles.")
            asyncio.create_task(self._simulate_loop())

    async def stop(self):
        self.running = False
        print("Stopped CAN Bus Simulator.")

    async def trigger_attack(self, attack_type: str, duration: int = 10):
        print(f"Triggering CAN Attack: {attack_type} for {duration} seconds.")
        self.attack_active = True
        self.attack_type = attack_type
        await asyncio.sleep(duration)
        self.attack_active = False
        self.attack_type = None
        print(f"CAN Attack {attack_type} ended.")

    def _generate_payload(self):
        return "".join(random.choices("0123456789ABCDEF", k=16))

    async def _simulate_loop(self):
        while self.running:
            messages = []
            for i in range(1, self.num_vehicles + 1):
                vid = f"EV-{i:03d}"
                num_msgs = 20 if (self.attack_active and self.attack_type == "flood") else random.randint(2, 5)
                
                for _ in range(num_msgs):
                    can_id = random.choice(NORMAL_CAN_IDS)
                    ecu = random.choice(ECUS)
                    payload = self._generate_payload()
                    is_attack = False
                    
                    if self.attack_active:
                        if self.attack_type == "spoofing" and random.random() < 0.1:
                            can_id = "0x999"
                            ecu = "FAKE_ECU"
                            is_attack = True
                        elif self.attack_type == "replay" and random.random() < 0.1:
                            payload = "FFFFFFFFFFFFFFFF"
                            is_attack = True
                        elif self.attack_type == "flood":
                            is_attack = True
                    
                    msg = CANMessage(
                        vehicle_id=vid,
                        timestamp=datetime.now(timezone.utc),
                        can_id=can_id,
                        source_ecu=ecu,
                        payload=payload,
                        is_attack=is_attack,
                        attack_type=self.attack_type if is_attack else None
                    )
                    
                    messages.append(msg.model_dump(by_alias=True))
                    
                    if random.random() < 0.1 or is_attack:
                        await ws_manager.broadcast(msg.model_dump(mode='json', by_alias=True), "can_traffic")
                    
                    alerts = security_layer.filter_can_packet(msg.model_dump(by_alias=True))
                    if alerts and db_client.alerts is not None:
                        await db_client.alerts.insert_many([a.model_dump(by_alias=True) for a in alerts])
                        for a in alerts:
                            await ws_manager.broadcast(a.model_dump(mode='json', by_alias=True), "alerts")
                            
                    threats = await ids.detect_can_threats(msg)
                    for t in threats:
                        await ws_manager.broadcast(t.model_dump(mode='json', by_alias=True), "threats")
                    
            if messages and db_client.can_messages is not None:
                await db_client.can_messages.insert_many(messages)
                
            await asyncio.sleep(1.0)

can_bus_sim = CANBusSimulator()

