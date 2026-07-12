from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

db_client = MongoDB()

async def connect_to_mongo():
    try:
        db_client.client = AsyncIOMotorClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
        db_client.db = db_client.client[settings.MONGO_DB_NAME]
        
        # Initialize collections
        db_client.vehicles = db_client.db["vehicles"]
        db_client.telemetry = db_client.db["telemetry"]
        db_client.can_messages = db_client.db["can_messages"]
        db_client.alerts = db_client.db["alerts"]
        db_client.anomalies = db_client.db["anomalies"]
        db_client.threat_events = db_client.db["threat_events"]
        db_client.risk_scores = db_client.db["risk_scores"]
        
        # Create indexes for performance and TTL
        await db_client.telemetry.create_index([("vehicle_id", 1), ("timestamp", -1)])
        await db_client.telemetry.create_index("timestamp", expireAfterSeconds=604800) # 7 days TTL
        await db_client.can_messages.create_index([("vehicle_id", 1), ("timestamp", -1)])
        await db_client.alerts.create_index([("severity", 1)])
        
        print("Connected to MongoDB and initialized indexes.")
    except Exception as e:
        print(f"Could not connect to MongoDB: {e}")

async def close_mongo_connection():
    if db_client.client:
        db_client.client.close()
        print("MongoDB connection closed.")

