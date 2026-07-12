import numpy as np
from sklearn.ensemble import IsolationForest
from app.models.schemas import TelemetryData, Anomaly
from app.database.mongodb import db_client
from datetime import datetime, timezone
from app.detection.explanation import explanation_engine
from app.detection.correlation import correlation_engine

class AIBatteryAnomalyDetector:
    def __init__(self):
        # We will train this model online with initial normal data
        self.model = IsolationForest(n_estimators=100, contamination=0.01, random_state=42)
        self.is_trained = False
        self.training_data = []
        self.MAX_TRAIN_SAMPLES = 200 # fast training for demo

    def _extract_features(self, telemetry: TelemetryData) -> list:
        return [
            telemetry.battery_voltage,
            telemetry.battery_current,
            telemetry.battery_temperature,
            telemetry.state_of_charge
        ]

    async def process_telemetry(self, telemetry: TelemetryData) -> Anomaly | None:
        features = self._extract_features(telemetry)
        
        if not self.is_trained:
            self.training_data.append(features)
            if len(self.training_data) >= self.MAX_TRAIN_SAMPLES:
                self.model.fit(self.training_data)
                self.is_trained = True
                print("AI Anomaly Detector Model Trained.")
            return None
            
        # Predict anomaly
        feature_array = np.array([features])
        prediction = self.model.predict(feature_array)[0] # 1 for normal, -1 for anomaly
        
        if prediction == -1:
            score = float(self.model.decision_function(feature_array)[0]) # Negative score for anomaly
            # Map score to a confidence 0-100%
            confidence = min(100.0, max(0.0, abs(score) * 100))
            
            anomaly_type = "AbnormalTelemetryPattern"
            if telemetry.battery_temperature > 40.0:
                anomaly_type = "Temperature Spike Anomaly"
            elif telemetry.state_of_charge < 10.0:
                anomaly_type = "SOC Inconsistency"
            
            exp_data = explanation_engine.explain_anomaly(anomaly_type, {
                "voltage": telemetry.battery_voltage,
                "current": telemetry.battery_current,
                "temperature": telemetry.battery_temperature,
                "soc": telemetry.state_of_charge
            })

            anomaly = Anomaly(
                vehicle_id=telemetry.vehicle_id,
                timestamp=datetime.now(timezone.utc),
                anomaly_type=anomaly_type,
                anomaly_score=round(score, 4),
                confidence_score=round(confidence, 2),
                features={
                    "voltage": telemetry.battery_voltage,
                    "current": telemetry.battery_current,
                    "temperature": telemetry.battery_temperature,
                    "soc": telemetry.state_of_charge
                },
                explanation=exp_data["explanation"],
                recommended_action=exp_data["recommended_action"]
            )
            
            if db_client.anomalies is not None:
                await db_client.anomalies.insert_one(anomaly.model_dump(by_alias=True))
            
            await correlation_engine.add_event(telemetry.vehicle_id, anomaly_type, exp_data)
                
            return anomaly
        return None

ai_detector = AIBatteryAnomalyDetector()
