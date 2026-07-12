from app.models.schemas import RiskScore
from app.database.mongodb import db_client
from datetime import datetime, timedelta, timezone
import asyncio

class RiskScoringEngine:
    def __init__(self):
        self.running = False
        
    async def start(self):
        if not self.running:
            self.running = True
            print("Started Risk Scoring Engine.")
            asyncio.create_task(self._scoring_loop())
            
    async def stop(self):
        self.running = False
        print("Stopped Risk Scoring Engine.")
        
    def _classify_score(self, score: int) -> str:
        if score <= 25:
            return "Safe"
        elif score <= 50:
            return "Elevated"
        elif score <= 75:
            return "High Risk"
        return "Critical"

    async def _scoring_loop(self):
        while self.running:
            try:
                if db_client.telemetry is None:
                    await asyncio.sleep(5)
                    continue
                    
                time_window = datetime.now(timezone.utc) - timedelta(minutes=5)
                
                vehicles = await db_client.telemetry.distinct("vehicle_id", {"timestamp": {"$gte": time_window}})
                
                for vid in vehicles:
                    alerts_count = await db_client.alerts.count_documents({"vehicle_id": vid, "timestamp": {"$gte": time_window}})
                    anomalies_count = await db_client.anomalies.count_documents({"vehicle_id": vid, "timestamp": {"$gte": time_window}})
                    threats_count = await db_client.threat_events.count_documents({"vehicle_id": vid, "timestamp": {"$gte": time_window}})
                    
                    raw_score = (threats_count * 30) + (anomalies_count * 15) + (alerts_count * 5)
                    final_score = min(100, raw_score)
                    
                    risk = RiskScore(
                        vehicle_id=vid,
                        timestamp=datetime.now(timezone.utc),
                        score=final_score,
                        classification=self._classify_score(final_score),
                        active_threats=threats_count,
                        alert_count=alerts_count,
                        anomaly_count=anomalies_count
                    )
                    
                    await db_client.risk_scores.update_one(
                        {"vehicle_id": vid},
                        {"$set": risk.model_dump(by_alias=True)},
                        upsert=True
                    )
                    
                    from app.websocket.manager import ws_manager
                    await ws_manager.broadcast(risk.model_dump(mode='json', by_alias=True), "risk")
                    
            except Exception as e:
                print(f"Error in risk scoring loop: {e}")
                
            await asyncio.sleep(5.0)

risk_engine = RiskScoringEngine()
