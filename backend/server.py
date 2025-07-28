from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict
import uuid
from datetime import datetime
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# --- WebSocket Connection Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_status: Dict[str, str] = {} # Stores status like "online", "busy"

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.user_status[user_id] = "online"
        logging.info(f"User {user_id} connected. Broadcasting 'online' status. Total connections: {len(self.active_connections)}")
        await self.broadcast_status(user_id, "online")

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        self.user_status[user_id] = "offline"
        logging.info(f"User {user_id} disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            logging.info(f"Sending personal message to {user_id}: {message}")
            await self.active_connections[user_id].send_text(message)
        else:
            logging.warning(f"Could not send personal message to {user_id}: user not connected.")

    async def broadcast(self, message: str, sender_id: str = None):
        logging.info(f"Broadcasting message from {sender_id}: {message}")
        for user_id, connection in self.active_connections.items():
            if sender_id and user_id == sender_id:
                continue
            try:
                await connection.send_text(message)
            except Exception as e:
                logging.error(f"Failed to send message to {user_id}: {e}")

    async def broadcast_status(self, user_id: str, status: str):
        self.user_status[user_id] = status
        message = json.dumps({"type": "status_update", "user_id": user_id, "status": status})
        logging.info(f"Broadcasting status update: {message}")
        for connection_user_id, connection in self.active_connections.items():
            # Send to all, including the user whose status changed, so client can react
            try:
                await connection.send_text(message)
            except Exception as e:
                logging.error(f"Failed to broadcast status to {connection_user_id}: {e}")

manager = ConnectionManager()

# --- Models ---
class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    channel_id: str | None = None # For public/group channels
    recipient_id: str | None = None # For direct messages
    sender_id: str
    sender_name: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    type: str = "text" # e.g., "text", "image", "file"

class Employee(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    designation: str
    department: str
    date_of_birth: str | None = None

# Define Models for existing status checks - might be deprecated or changed
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str # Potentially user_id
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: str # online, offline, busy

class StatusCheckCreate(BaseModel):
    client_name: str # Potentially user_id
    status: str


# --- API Routes ---
@api_router.get("/health")
async def health_check():
    return {"status": "ok"}


@api_router.get("/")
async def root():
    return {"message": "Hello World from API"}

# Modified to reflect actual online users from WebSockets + manually set statuses
@api_router.get("/users/status", response_model=List[Dict])
async def get_all_user_statuses():
    # This returns a list of {"user_id": "some_user_id", "status": "online/offline/busy"}
    # It prioritizes manually set status, then active connection, then defaults to offline
    all_known_users_ids = set(manager.user_status.keys()) | set(manager.active_connections.keys())

    # Potentially fetch all users from DB to show offline status for those never connected
    # For now, only shows users who have connected at least once or had status set

    statuses = []
    for user_id in all_known_users_ids:
        current_status = manager.user_status.get(user_id, "offline")
        if user_id in manager.active_connections and current_status != "busy": # if connected and not busy, they are online
             current_status = "online"
        elif user_id not in manager.active_connections and current_status != "offline": # if not connected but status is not offline (e.g. busy, but logged out)
            if current_status == "busy": # If they were busy and disconnected, keep busy, or set to offline. For now, let's set to offline.
                 manager.user_status[user_id] = "offline" # Reset busy if disconnected
                 current_status = "offline"
            # else keep the manually set status if it's not online (e.g. some other custom status)
        statuses.append({"user_id": user_id, "status": current_status})
    return statuses

@api_router.post("/users/{user_id}/status", response_model=Dict)
async def set_user_status_api(user_id: str, status_update: StatusCheckCreate):
    # This endpoint allows explicitly setting a status like "busy"
    # "online" and "offline" are primarily managed by WebSocket connect/disconnect
    if status_update.client_name != user_id:
        raise HTTPException(status_code=400, detail="User ID in path and body must match.")

    new_status = status_update.status.lower()
    if new_status not in ["online", "offline", "busy"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'online', 'offline', or 'busy'.")

    manager.user_status[user_id] = new_status
    await manager.broadcast_status(user_id, new_status)
    return {"user_id": user_id, "status": new_status}

# Add endpoint to get messages for a channel or direct conversation
@api_router.get("/messages")
async def get_messages(channel_id: str = None, recipient_id: str = None, sender_id: str = None, limit: int = 50):
    """Get messages for a channel or direct conversation"""
    query = {}
    if channel_id:
        query["channel_id"] = channel_id
    elif recipient_id and sender_id:
        # For direct messages, get messages between two users
        query = {
            "$or": [
                {"sender_id": sender_id, "recipient_id": recipient_id},
                {"sender_id": recipient_id, "recipient_id": sender_id}
            ]
        }
    
    messages = await db.messages.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(length=limit)
    # Reverse to get chronological order
    messages.reverse()
    return messages


# --- Employee CRUD Endpoints ---
@api_router.post("/employees", response_model=Employee)
async def create_employee(employee: Employee):
    employee_dict = employee.model_dump()
    await db.employees.insert_one(employee_dict)
    return employee

@api_router.get("/employees", response_model=List[Employee])
async def get_employees():
    employees = await db.employees.find().to_list(1000)
    return employees

@api_router.get("/employees/{employee_id}", response_model=Employee)
async def get_employee(employee_id: str):
    employee = await db.employees.find_one({"id": employee_id})
    if employee:
        return employee
    raise HTTPException(status_code=404, detail="Employee not found")

@api_router.put("/employees/{employee_id}", response_model=Employee)
async def update_employee(employee_id: str, employee: Employee):
    employee_dict = employee.model_dump(exclude_unset=True)
    await db.employees.update_one({"id": employee_id}, {"$set": employee_dict})
    updated_employee = await db.employees.find_one({"id": employee_id})
    if updated_employee:
        return updated_employee
    raise HTTPException(status_code=404, detail="Employee not found")

@api_router.delete("/employees/{employee_id}")
async def delete_employee(employee_id: str):
    delete_result = await db.employees.delete_one({"id": employee_id})
    if delete_result.deleted_count:
        return {"message": "Employee deleted successfully"}
    raise HTTPException(status_code=404, detail="Employee not found")


# --- WebSocket Route ---
@api_router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message_data = json.loads(data)
                logging.info(f"Received message from {user_id}: {message_data}")

                # Validate message structure (basic)
                if "type" not in message_data:
                    logging.warning(f"Message from {user_id} missing 'type' field: {data}")
                    continue

                if message_data["type"] == "chat_message":
                    # Persist message to DB
                    logging.info(f"Processing chat message from {user_id}: {message_data}")
                    msg_to_save = Message(
                        sender_id=user_id,
                        sender_name=message_data.get("sender_name", "Unknown User"), # Client should send this
                        content=message_data.get("content", ""),
                        channel_id=message_data.get("channel_id"),
                        recipient_id=message_data.get("recipient_id")
                    )
                    # Use model_dump() instead of dict() for Pydantic v2 compatibility
                    message_dict = msg_to_save.model_dump(exclude={"id"})
                    insert_result = await db.messages.insert_one(message_dict)
                    logging.info(f"Message from {user_id} saved to DB with id: {insert_result.inserted_id}")

                    # Broadcast to recipient or channel
                    message_to_send = msg_to_save.model_dump()
                    # Convert datetime to ISO string for JSON serialization
                    if 'timestamp' in message_to_send and isinstance(message_to_send['timestamp'], datetime):
                        message_to_send['timestamp'] = message_to_send['timestamp'].isoformat()
                    
                    if msg_to_save.recipient_id: # Direct message
                        logging.info(f"Sending direct message to {msg_to_save.recipient_id}")
                        await manager.send_personal_message(json.dumps(message_to_send), msg_to_save.recipient_id)
                        # Send confirmation back to sender
                        await manager.send_personal_message(json.dumps(message_to_send), user_id)
                    elif msg_to_save.channel_id: # Channel message
                        logging.info(f"Broadcasting message to channel {msg_to_save.channel_id}")
                        await manager.broadcast(json.dumps(message_to_send))
                    else: # General broadcast
                        logging.info("Broadcasting general message")
                        await manager.broadcast(json.dumps(message_to_send))

                elif message_data["type"] == "set_status": # e.g. user manually sets to "busy"
                    new_status = message_data.get("status", "online").lower()
                    if new_status in ["online", "offline", "busy"]:
                         manager.user_status[user_id] = new_status # Update internal state
                         await manager.broadcast_status(user_id, new_status) # Broadcast this change
                    else:
                        logging.warning(f"Invalid status update from {user_id}: {new_status}")

                elif message_data["type"] == "get_all_statuses":
                    all_statuses = {uid: manager.user_status.get(uid, "offline") for uid in manager.user_status}
                    for uid in manager.active_connections:
                        if uid not in all_statuses or all_statuses[uid] != "busy":
                            all_statuses[uid] = "online"

                    await manager.send_personal_message(
                        json.dumps({"type": "all_statuses", "statuses": all_statuses}),
                        user_id
                    )

            except json.JSONDecodeError:
                logging.error(f"Failed to decode JSON from {user_id}: {data}")
            except Exception as e:
                logging.error(f"Error processing message from {user_id}: {e} - Data: {data}")

    except WebSocketDisconnect:
        logging.info(f"WebSocketDisconnect for user {user_id}")
    except Exception as e:
        logging.error(f"Unexpected error for user {user_id}: {e}")
    finally:
        # This block will execute on WebSocketDisconnect or any other exception causing the loop to exit
        manager.disconnect(user_id)
        await manager.broadcast_status(user_id, "offline")
        logging.info(f"User {user_id} fully processed disconnection.")


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"], # Adjust for production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    try:
        await client.admin.command('ping')
        logger.info("MongoDB connection successful.")
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
    # Initialize anything needed on startup, e.g., load initial statuses from DB if persisted
    logger.info("Application startup: WebSocket ConnectionManager initialized.")
    # Example: load user statuses if you were persisting them
    # all_users = await db.users.find({}, {"user_id": 1, "last_status": 1}).to_list(None)
    # for user_doc in all_users:
    #    if "last_status" in user_doc:
    #        manager.user_status[user_doc["user_id"]] = user_doc["last_status"]


@app.on_event("shutdown")
async def shutdown_db_client():
    # Potentially save current statuses to DB
    # for user_id, status in manager.user_status.items():
    #    await db.users.update_one({"user_id": user_id}, {"$set": {"last_status": status}}, upsert=True)
    client.close()
    logger.info("Application shutdown: MongoDB client closed.")
