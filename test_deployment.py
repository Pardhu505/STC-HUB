#!/usr/bin/env python3
"""
Production Deployment Testing Script
Run this script to test your deployed ShowTime Employee Portal
"""

import requests
import json
import sys
from datetime import datetime, timedelta

class DeploymentTester:
    def __init__(self, backend_url, frontend_url):
        self.backend_url = backend_url.rstrip('/')
        self.frontend_url = frontend_url.rstrip('/')
        self.api_url = f"{self.backend_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        
    def log(self, message, status="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        status_icon = {"INFO": "ℹ️", "SUCCESS": "✅", "ERROR": "❌", "WARNING": "⚠️"}
        print(f"[{timestamp}] {status_icon.get(status, '•')} {message}")
    
    def test_backend_health(self):
        """Test backend health endpoint"""
        self.log("Testing backend health check...")
        self.tests_run += 1
        
        try:
            response = requests.get(f"{self.api_url}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "ok":
                    self.log("Backend health check passed", "SUCCESS")
                    self.tests_passed += 1
                    return True
                else:
                    self.log(f"Backend health check failed: {data}", "ERROR")
            else:
                self.log(f"Backend health check failed: HTTP {response.status_code}", "ERROR")
        except Exception as e:
            self.log(f"Backend health check failed: {str(e)}", "ERROR")
        
        return False
    
    def test_detailed_health(self):
        """Test detailed health endpoint"""
        self.log("Testing detailed health check...")
        self.tests_run += 1
        
        try:
            response = requests.get(f"{self.api_url}/health/detailed", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log(f"Environment: {data.get('environment')}", "INFO")
                self.log(f"Services: {data.get('services', {})}", "INFO")
                self.tests_passed += 1
                return True
            else:
                self.log(f"Detailed health check failed: HTTP {response.status_code}", "ERROR")
        except Exception as e:
            self.log(f"Detailed health check failed: {str(e)}", "ERROR")
        
        return False
    
    def test_employees_endpoint(self):
        """Test employees endpoint"""
        self.log("Testing employees endpoint...")
        self.tests_run += 1
        
        try:
            response = requests.get(f"{self.api_url}/employees", timeout=10)
            if response.status_code == 200:
                employees = response.json()
                self.log(f"Found {len(employees)} employees", "SUCCESS")
                self.tests_passed += 1
                return True
            else:
                self.log(f"Employees endpoint failed: HTTP {response.status_code}", "ERROR")
        except Exception as e:
            self.log(f"Employees endpoint failed: {str(e)}", "ERROR")
        
        return False
    
    def test_meeting_creation(self):
        """Test meeting creation"""
        self.log("Testing meeting creation...")
        self.tests_run += 1
        
        try:
            meeting_data = {
                "title": "Production Test Meeting",
                "description": "Testing production deployment",
                "start_time": (datetime.utcnow() + timedelta(hours=1)).isoformat() + "Z",
                "end_time": (datetime.utcnow() + timedelta(hours=2)).isoformat() + "Z",
                "attendees": ["test@example.com"]
            }
            
            response = requests.post(
                f"{self.api_url}/meetings",
                params={"creator_id": "test@admin.com", "creator_name": "Test Admin"},
                json=meeting_data,
                timeout=15
            )
            
            if response.status_code == 200:
                meeting = response.json()
                self.log(f"Meeting created successfully: {meeting.get('id')}", "SUCCESS")
                self.log(f"Meeting link: {meeting.get('meeting_link')}", "INFO")
                self.tests_passed += 1
                return meeting
            else:
                self.log(f"Meeting creation failed: HTTP {response.status_code}", "ERROR")
                try:
                    error_detail = response.json().get('detail', 'Unknown error')
                    self.log(f"Error details: {error_detail}", "ERROR")
                except:
                    pass
        except Exception as e:
            self.log(f"Meeting creation failed: {str(e)}", "ERROR")
        
        return None
    
    def test_meetings_list(self):
        """Test meetings list endpoint"""
        self.log("Testing meetings list...")
        self.tests_run += 1
        
        try:
            response = requests.get(f"{self.api_url}/meetings", timeout=10)
            if response.status_code == 200:
                meetings = response.json()
                self.log(f"Found {len(meetings)} meetings", "SUCCESS")
                self.tests_passed += 1
                return True
            else:
                self.log(f"Meetings list failed: HTTP {response.status_code}", "ERROR")
        except Exception as e:
            self.log(f"Meetings list failed: {str(e)}", "ERROR")
        
        return False
    
    def test_frontend_access(self):
        """Test frontend access"""
        self.log("Testing frontend access...")
        self.tests_run += 1
        
        try:
            response = requests.get(self.frontend_url, timeout=10)
            if response.status_code == 200:
                if "ShowTime" in response.text or "showtime" in response.text.lower():
                    self.log("Frontend is accessible and contains expected content", "SUCCESS")
                    self.tests_passed += 1
                    return True
                else:
                    self.log("Frontend accessible but may not be the correct app", "WARNING")
            else:
                self.log(f"Frontend access failed: HTTP {response.status_code}", "ERROR")
        except Exception as e:
            self.log(f"Frontend access failed: {str(e)}", "ERROR")
        
        return False
    
    def test_cors_configuration(self):
        """Test CORS configuration"""
        self.log("Testing CORS configuration...")
        self.tests_run += 1
        
        try:
            headers = {
                'Origin': self.frontend_url,
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
            
            response = requests.options(f"{self.api_url}/health", headers=headers, timeout=10)
            
            cors_headers = response.headers
            if 'Access-Control-Allow-Origin' in cors_headers:
                allowed_origin = cors_headers['Access-Control-Allow-Origin']
                if allowed_origin == '*' or self.frontend_url in allowed_origin:
                    self.log("CORS configuration looks correct", "SUCCESS")
                    self.tests_passed += 1
                    return True
                else:
                    self.log(f"CORS may be misconfigured. Allowed origin: {allowed_origin}", "WARNING")
            else:
                self.log("CORS headers not found", "WARNING")
        except Exception as e:
            self.log(f"CORS test failed: {str(e)}", "ERROR")
        
        return False
    
    def run_all_tests(self):
        """Run all deployment tests"""
        self.log("🚀 Starting ShowTime Employee Portal Deployment Tests")
        self.log(f"Backend URL: {self.backend_url}")
        self.log(f"Frontend URL: {self.frontend_url}")
        self.log("-" * 50)
        
        # Core backend tests
        self.test_backend_health()
        self.test_detailed_health()
        self.test_employees_endpoint()
        
        # Feature tests
        self.test_meeting_creation()
        self.test_meetings_list()
        
        # Frontend and integration tests
        self.test_frontend_access()
        self.test_cors_configuration()
        
        # Results
        self.log("-" * 50)
        success_rate = (self.tests_passed / self.tests_run) * 100
        self.log(f"Tests completed: {self.tests_passed}/{self.tests_run} passed ({success_rate:.1f}%)")
        
        if success_rate >= 85:
            self.log("🎉 Deployment looks good! Most tests passed.", "SUCCESS")
            return True
        elif success_rate >= 70:
            self.log("⚠️ Deployment partially working. Some issues to fix.", "WARNING")
            return False
        else:
            self.log("❌ Deployment has significant issues. Please check configuration.", "ERROR")
            return False

def main():
    print("ShowTime Employee Portal - Production Deployment Tester")
    print("=" * 60)
    
    # Get URLs from user
    backend_url = input("Enter your backend URL (e.g., https://showtime-backend.onrender.com): ").strip()
    frontend_url = input("Enter your frontend URL (e.g., https://showtime-portal.vercel.app): ").strip()
    
    if not backend_url or not frontend_url:
        print("❌ Both URLs are required!")
        sys.exit(1)
    
    # Run tests
    tester = DeploymentTester(backend_url, frontend_url)
    success = tester.run_all_tests()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ Your ShowTime Employee Portal deployment is ready!")
        print(f"🌐 Access your app at: {frontend_url}")
        print(f"🔧 API available at: {backend_url}/api")
    else:
        print("⚠️ Please fix the identified issues and test again.")
        print("📖 Check the deployment guide for troubleshooting steps.")
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()