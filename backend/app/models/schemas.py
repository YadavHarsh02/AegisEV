from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class TelemetryData(BaseModel):
    vehicle_id: str
    timestamp: datetime
    battery_voltage: float
    battery_current: float
    battery_temperature: float
    state_of_charge: float
    state_of_health: float
    charge_cycles: int
    cell_voltages: List[float] = Field(default_factory=list)
    cell_temperatures: List[float] = Field(default_factory=list)

class CANMessage(BaseModel):
    vehicle_id: str
    timestamp: datetime
    can_id: str
    source_ecu: str
    payload: str
    is_attack: bool = False
    attack_type: Optional[str] = None

class Alert(BaseModel):
    vehicle_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    alert_type: str
    severity: str
    description: str
    raw_data: Optional[Dict[str, Any]] = None

class Anomaly(BaseModel):
    vehicle_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    anomaly_type: str
    anomaly_score: float
    confidence_score: float
    features: Dict[str, Any]
    explanation: Optional[str] = None
    recommended_action: Optional[str] = None

class ThreatEvent(BaseModel):
    vehicle_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    threat_type: str
    risk_level: str
    details: str
    recommended_action: Optional[str] = None

class RiskScore(BaseModel):
    vehicle_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    score: int
    classification: str
    active_threats: int
    alert_count: int
    anomaly_count: int

class Incident(BaseModel):
    incident_id: str
    vehicle_id: str
    severity: str
    start_time: datetime
    end_time: datetime
    related_events: List[Dict[str, Any]]
    root_cause: str
    root_cause_chain: List[str]
    confidence_score: float
    recommended_action: str
