import asyncio
import websockets
import json

async def test_websocket():
    try:
        uri = "ws://localhost:8001/api/ws/test_user"
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected successfully!")
            
            # Send a test message
            test_message = {
                "type": "chat_message",
                "channel_id": "general",
                "sender_id": "test_user",
                "sender_name": "Test User",
                "content": "Hello WebSocket!"
            }
            await websocket.send(json.dumps(test_message))
            print("✅ Message sent successfully!")
            
            # Wait for response
            response = await asyncio.wait_for(websocket.recv(), timeout=5)
            print(f"✅ Received response: {response}")
            
    except Exception as e:
        print(f"❌ WebSocket error: {e}")

asyncio.run(test_websocket())
