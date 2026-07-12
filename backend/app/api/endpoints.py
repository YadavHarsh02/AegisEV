from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from typing import List
from app.websocket.manager import ws_manager
from app.simulator.telemetry import telemetry_sim
from app.simulator.can_bus import can_bus_sim
from app.database.mongodb import db_client
from pydantic import BaseModel
import asyncio

router = APIRouter()

class AttackRequest(BaseModel):
    attack_type: str
    duration: int = 10

@router.get("/api/dashboard/summary")
async def get_summary():
    if db_client.telemetry is None:
        return {"status": "Database not connected"}
    
    vehicles_count = len(await db_client.telemetry.distinct("vehicle_id"))
    alerts_count = await db_client.alerts.count_documents({})
    threats_count = await db_client.threat_events.count_documents({})
    anomalies_count = await db_client.anomalies.count_documents({})
    
    return {
        "total_vehicles": vehicles_count,
        "active_vehicles": telemetry_sim.num_vehicles if telemetry_sim.running else 0,
        "total_alerts": alerts_count,
        "threat_count": threats_count,
        "anomaly_count": anomalies_count
    }

@router.post("/api/simulator/start")
async def start_simulators():
    await telemetry_sim.start()
    await can_bus_sim.start()
    return {"status": "Simulators started"}

@router.post("/api/simulator/stop")
async def stop_simulators():
    await telemetry_sim.stop()
    await can_bus_sim.stop()
    return {"status": "Simulators stopped"}

@router.post("/api/attack/trigger")
async def trigger_attack(req: AttackRequest):
    if req.attack_type not in ["spoofing", "replay", "flood"]:
        raise HTTPException(status_code=400, detail="Invalid attack type")
    
    # We shouldn't await this directly if it blocks, but trigger_attack in simulator spawns a sleep, so it's better to fire and forget
    asyncio.create_task(can_bus_sim.trigger_attack(req.attack_type, req.duration))
    return {"status": f"Triggered {req.attack_type} attack for {req.duration}s"}

@router.get("/api/incidents")
async def get_incidents():
    if db_client.db is None:
        return []
    cursor = db_client.db["incidents"].find().sort("start_time", -1).limit(50)
    incidents = await cursor.to_list(length=50)
    for inc in incidents:
        inc["_id"] = str(inc["_id"])
    return incidents

@router.get("/api/vehicle/{vid}")
async def get_vehicle_profile(vid: str):
    latest_tel = None
    if db_client.telemetry is not None:
        latest_tel = await db_client.telemetry.find_one({"vehicle_id": vid}, sort=[("timestamp", -1)])
        if latest_tel:
            latest_tel["_id"] = str(latest_tel["_id"])
            
    incidents = []
    if db_client.db is not None:
        cursor = db_client.db["incidents"].find({"vehicle_id": vid}).sort("start_time", -1)
        incidents_raw = await cursor.to_list(length=20)
        for i in incidents_raw:
            i["_id"] = str(i["_id"])
            incidents.append(i)
            
    alerts = []
    if db_client.alerts is not None:
        cursor = db_client.alerts.find({"vehicle_id": vid}).sort("timestamp", -1)
        alerts_raw = await cursor.to_list(length=20)
        for a in alerts_raw:
            a["_id"] = str(a["_id"])
            alerts.append(a)

    return {
        "vehicle_id": vid,
        "latest_telemetry": latest_tel,
        "incidents": incidents,
        "alerts": alerts
    }


# Websocket Endpoints
@router.websocket("/ws/{channel}")
async def websocket_endpoint(websocket: WebSocket, channel: str):
    if channel not in ws_manager.active_connections:
        await websocket.close()
        return
        
    await ws_manager.connect(websocket, channel)
    try:
        while True:
            # We don't expect messages from client, just keep connection open
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, channel)
