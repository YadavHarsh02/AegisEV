from datetime import datetime, timezone, timedelta
import uuid
from typing import List, Dict
from app.models.schemas import Incident
from app.websocket.manager import ws_manager
from app.database.mongodb import db_client
import asyncio

class IncidentCorrelationEngine:
    def __init__(self):
        self.active_incidents = {}  # vid -> Incident
        self.event_buffer = []

    async def add_event(self, vehicle_id: str, event_type: str, details: dict):
        event = {
            "vehicle_id": vehicle_id,
            "event_type": event_type,
            "timestamp": datetime.now(timezone.utc),
            "details": details
        }
        self.event_buffer.append(event)
        await self._correlate(vehicle_id)
        
    async def _correlate(self, vehicle_id: str):
        now = datetime.now(timezone.utc)
        # Get events for this vehicle in last 5 minutes
        recent_events = [e for e in self.event_buffer if e["vehicle_id"] == vehicle_id and (now - e["timestamp"]).total_seconds() < 300]
        
        if len(recent_events) >= 2:
            # We have an incident!
            if vehicle_id not in self.active_incidents:
                incident_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
                
                # Determine root cause based on first event
                first_event = sorted(recent_events, key=lambda x: x["timestamp"])[0]
                root_cause = first_event["event_type"]
                
                # Generate chain
                chain = [root_cause]
                for e in recent_events[1:]:
                    if e["event_type"] not in chain:
                        chain.append(e["event_type"])
                chain.append("Critical Incident")
                
                incident = Incident(
                    incident_id=incident_id,
                    vehicle_id=vehicle_id,
                    severity="Critical" if len(recent_events) > 3 else "High",
                    start_time=first_event["timestamp"],
                    end_time=now,
                    related_events=recent_events,
                    root_cause=root_cause,
                    root_cause_chain=chain,
                    confidence_score=min(99.0, 50.0 + len(recent_events) * 10),
                    recommended_action="Isolate vehicle from fleet network and conduct forensic analysis of CAN logs."
                )
                self.active_incidents[vehicle_id] = incident
                
                if db_client.db is not None:
                    await db_client.db["incidents"].insert_one(incident.model_dump(by_alias=True))
                
                await ws_manager.broadcast(incident.model_dump(mode='json', by_alias=True), "incidents")
            else:
                # Update existing incident
                incident = self.active_incidents[vehicle_id]
                incident.end_time = now
                incident.related_events = recent_events
                incident.severity = "Critical" if len(recent_events) > 3 else "High"
                incident.confidence_score = min(99.0, incident.confidence_score + 5)
                
                if db_client.db is not None:
                    await db_client.db["incidents"].update_one(
                        {"incident_id": incident.incident_id},
                        {"$set": incident.model_dump(by_alias=True)}
                    )
                await ws_manager.broadcast(incident.model_dump(mode='json', by_alias=True), "incidents")
                
        # Cleanup buffer (keep only last 5 mins)
        self.event_buffer = [e for e in self.event_buffer if (now - e["timestamp"]).total_seconds() < 300]

correlation_engine = IncidentCorrelationEngine()
