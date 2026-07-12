import random

class AIExplanationEngine:
    def explain_anomaly(self, anomaly_type: str, features: dict) -> dict:
        explanation = "Deviation detected from established baseline."
        recommended_action = "Investigate vehicle telemetry logs."
        
        if anomaly_type == "Temperature Spike Anomaly":
            explanation = "Battery temperature increased rapidly while voltage remained unchanged, violating historical thermal models."
            recommended_action = "Immediate inspection of thermal sensors and cooling system."
        elif anomaly_type == "Voltage Drop Anomaly":
            explanation = "Sudden drop in pack voltage without corresponding current draw, indicating potential cell failure or sensor spoofing."
            recommended_action = "Halt vehicle operation. Inspect cell balancing."
        elif anomaly_type == "SOC Inconsistency":
            explanation = "State of Charge jumped by >5% in an impossibly short timeframe."
            recommended_action = "Recalibrate BMS sensors. Check for external CAN manipulation."
        
        return {
            "explanation": explanation,
            "recommended_action": recommended_action
        }
        
    def action_for_threat(self, threat_type: str) -> str:
        if threat_type == "CAN Spoofing":
            return "Verify ECU identity and inspect gateway logs for unauthorized access."
        elif threat_type == "Replay Attack":
            return "Invalidate recent commands. Check message counters and MACs."
        elif threat_type == "CAN Flooding":
            return "Implement rate limiting on CAN gateway. Isolate compromised ECU segment."
        return "Conduct full system diagnostic."

explanation_engine = AIExplanationEngine()
