#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for ShowTime Employee Portal
Tests all API endpoints including file upload, meetings, and WebSocket functionality
"""

import requests
import json
import sys
import io
from datetime import datetime, timedelta
import uuid
import websocket
import threading
import time

class ShowTimeAPITester:
    def __init__(self, base_url="http://localhost:8001/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details
        })

    def test_health_check(self):
        """Test health endpoint"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Response: {response.json() if success else response.text}"
            self.log_test("Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("Health Check", False, str(e))
            return False

    def test_root_endpoint(self):
        """Test root API endpoint"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Response: {response.json() if success else response.text}"
            self.log_test("Root Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Root Endpoint", False, str(e))
            return False

    def test_employee_crud(self):
        """Test employee CRUD operations"""
        test_employee = {
            "name": "Test Employee",
            "email": "test@showtimeconsulting.in",
            "designation": "Software Engineer",
            "department": "Engineering",
            "date_of_birth": "1990-01-01"
        }
        
        # Test CREATE
        try:
            response = requests.post(f"{self.base_url}/employees", json=test_employee, timeout=10)
            if response.status_code == 200:
                employee_data = response.json()
                employee_id = employee_data.get('id')
                self.log_test("Employee Create", True, f"Created employee with ID: {employee_id}")
                
                # Test READ
                response = requests.get(f"{self.base_url}/employees/{employee_id}", timeout=10)
                success = response.status_code == 200
                self.log_test("Employee Read", success, f"Status: {response.status_code}")
                
                # Test UPDATE
                updated_data = test_employee.copy()
                updated_data['designation'] = "Senior Software Engineer"
                updated_data['id'] = employee_id
                response = requests.put(f"{self.base_url}/employees/{employee_id}", json=updated_data, timeout=10)
                success = response.status_code == 200
                self.log_test("Employee Update", success, f"Status: {response.status_code}")
                
                # Test DELETE
                response = requests.delete(f"{self.base_url}/employees/{employee_id}", timeout=10)
                success = response.status_code == 200
                self.log_test("Employee Delete", success, f"Status: {response.status_code}")
                
                return True
            else:
                self.log_test("Employee Create", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Employee CRUD", False, str(e))
            return False

    def test_get_all_employees(self):
        """Test getting all employees"""
        try:
            response = requests.get(f"{self.base_url}/employees", timeout=10)
            success = response.status_code == 200
            if success:
                employees = response.json()
                details = f"Retrieved {len(employees)} employees"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            self.log_test("Get All Employees", success, details)
            return success
        except Exception as e:
            self.log_test("Get All Employees", False, str(e))
            return False

    def test_user_status_endpoints(self):
        """Test user status management"""
        try:
            # Test get all user statuses
            response = requests.get(f"{self.base_url}/users/status", timeout=10)
            success = response.status_code == 200
            self.log_test("Get User Statuses", success, f"Status: {response.status_code}")
            
            # Test set user status
            test_user_id = "test_user_123"
            status_data = {
                "client_name": test_user_id,
                "status": "busy"
            }
            response = requests.post(f"{self.base_url}/users/{test_user_id}/status", json=status_data, timeout=10)
            success = response.status_code == 200
            self.log_test("Set User Status", success, f"Status: {response.status_code}")
            
            return True
        except Exception as e:
            self.log_test("User Status Endpoints", False, str(e))
            return False

    def test_messages_endpoint(self):
        """Test messages retrieval"""
        try:
            # Test get messages without parameters
            response = requests.get(f"{self.base_url}/messages", timeout=10)
            success = response.status_code == 200
            if success:
                messages = response.json()
                details = f"Retrieved {len(messages)} messages"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            self.log_test("Get Messages", success, details)
            
            # Test get messages with channel_id
            response = requests.get(f"{self.base_url}/messages?channel_id=general", timeout=10)
            success = response.status_code == 200
            self.log_test("Get Channel Messages", success, f"Status: {response.status_code}")
            
            return True
        except Exception as e:
            self.log_test("Messages Endpoint", False, str(e))
            return False

    def test_file_upload(self):
        """Test file upload functionality"""
        try:
            # Create a test file
            test_content = b"This is a test file for ShowTime Employee Portal"
            test_file = io.BytesIO(test_content)
            
            files = {
                'file': ('test_document.txt', test_file, 'text/plain')
            }
            data = {
                'sender_id': 'test_user_123',
                'sender_name': 'Test User',
                'channel_id': 'general'
            }
            
            response = requests.post(f"{self.base_url}/files/upload", files=files, data=data, timeout=30)
            success = response.status_code == 200
            
            if success:
                result = response.json()
                file_id = result.get('file_id')
                details = f"File uploaded successfully. File ID: {file_id}, URL: {result.get('file_url')}"
                
                # Test file download if upload was successful
                if file_id:
                    download_response = requests.get(f"{self.base_url}/files/download/{file_id}", timeout=30)
                    download_success = download_response.status_code == 200
                    self.log_test("File Download", download_success, f"Status: {download_response.status_code}")
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("File Upload", success, details)
            return success
        except Exception as e:
            self.log_test("File Upload", False, str(e))
            return False

    def test_meetings_crud(self):
        """Test meeting CRUD operations"""
        try:
            # Create test meeting
            start_time = datetime.utcnow() + timedelta(hours=1)
            end_time = start_time + timedelta(hours=1)
            
            meeting_data = {
                "title": "Test Meeting",
                "description": "This is a test meeting for API testing",
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "attendees": ["test1@showtimeconsulting.in", "test2@showtimeconsulting.in"]
            }
            
            # Test CREATE meeting
            response = requests.post(
                f"{self.base_url}/meetings",
                json=meeting_data,
                params={"creator_id": "test_user_123", "creator_name": "Test User"},
                timeout=30
            )
            
            if response.status_code == 200:
                meeting = response.json()
                meeting_id = meeting.get('id')
                self.log_test("Meeting Create", True, f"Created meeting with ID: {meeting_id}")
                
                # Test READ meeting
                response = requests.get(f"{self.base_url}/meetings/{meeting_id}", timeout=10)
                success = response.status_code == 200
                self.log_test("Meeting Read", success, f"Status: {response.status_code}")
                
                # Test GET all meetings
                response = requests.get(f"{self.base_url}/meetings", timeout=10)
                success = response.status_code == 200
                if success:
                    meetings = response.json()
                    details = f"Retrieved {len(meetings)} meetings"
                else:
                    details = f"Status: {response.status_code}"
                self.log_test("Get All Meetings", success, details)
                
                # Test DELETE meeting
                response = requests.delete(
                    f"{self.base_url}/meetings/{meeting_id}",
                    params={"user_id": "test_user_123"},
                    timeout=10
                )
                success = response.status_code == 200
                self.log_test("Meeting Delete", success, f"Status: {response.status_code}")
                
                return True
            else:
                self.log_test("Meeting Create", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Meetings CRUD", False, str(e))
            return False

    def test_websocket_connection(self):
        """Test WebSocket connection"""
        try:
            ws_url = "ws://localhost:8001/api/ws/test_user_123"
            
            connection_successful = False
            message_received = False
            
            def on_message(ws, message):
                nonlocal message_received
                message_received = True
                print(f"WebSocket received: {message}")
            
            def on_error(ws, error):
                print(f"WebSocket error: {error}")
            
            def on_close(ws, close_status_code, close_msg):
                print("WebSocket connection closed")
            
            def on_open(ws):
                nonlocal connection_successful
                connection_successful = True
                print("WebSocket connection opened")
                
                # Send a test message
                test_message = {
                    "type": "chat_message",
                    "sender_name": "Test User",
                    "content": "Test message from API test",
                    "channel_id": "general",
                    "message_type": "text"
                }
                ws.send(json.dumps(test_message))
                
                # Close after a short delay
                def close_connection():
                    time.sleep(2)
                    ws.close()
                
                threading.Thread(target=close_connection).start()
            
            ws = websocket.WebSocketApp(
                ws_url,
                on_open=on_open,
                on_message=on_message,
                on_error=on_error,
                on_close=on_close
            )
            
            # Run WebSocket in a separate thread with timeout
            ws_thread = threading.Thread(target=ws.run_forever)
            ws_thread.daemon = True
            ws_thread.start()
            
            # Wait for connection and message
            time.sleep(5)
            
            self.log_test("WebSocket Connection", connection_successful, "Connection established" if connection_successful else "Failed to connect")
            self.log_test("WebSocket Message", message_received, "Message sent and received" if message_received else "No message received")
            
            return connection_successful
            
        except Exception as e:
            self.log_test("WebSocket Connection", False, str(e))
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting ShowTime Employee Portal Backend API Tests")
        print("=" * 60)
        
        # Basic connectivity tests
        self.test_health_check()
        self.test_root_endpoint()
        
        # Employee management tests
        self.test_get_all_employees()
        self.test_employee_crud()
        
        # User status tests
        self.test_user_status_endpoints()
        
        # Messaging tests
        self.test_messages_endpoint()
        
        # File handling tests
        self.test_file_upload()
        
        # Meeting management tests
        self.test_meetings_crud()
        
        # WebSocket tests
        self.test_websocket_connection()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['name']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = ShowTimeAPITester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed! Backend API is working correctly.")
        return 0
    else:
        print(f"\n⚠️  Some tests failed. Check the details above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())