#!/usr/bin/env python3
"""
Internal Backend API Testing for ShowTime Employee Portal
Tests backend on localhost:8001 to verify it's working internally
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import uuid

class InternalAPITester:
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
            self.log_test("Internal Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("Internal Health Check", False, str(e))
            return False

    def test_root_endpoint(self):
        """Test root API endpoint"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Response: {response.json() if success else response.text}"
            self.log_test("Internal Root Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Internal Root Endpoint", False, str(e))
            return False

    def test_employee_endpoints(self):
        """Test employee endpoints"""
        try:
            # Test GET all employees
            response = requests.get(f"{self.base_url}/employees", timeout=10)
            success = response.status_code == 200
            if success:
                employees = response.json()
                details = f"Retrieved {len(employees)} employees"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            self.log_test("Get All Employees (Internal)", success, details)
            return success
        except Exception as e:
            self.log_test("Get All Employees (Internal)", False, str(e))
            return False

    def test_user_status_endpoints(self):
        """Test user status management"""
        try:
            # Test get all user statuses
            response = requests.get(f"{self.base_url}/users/status", timeout=10)
            success = response.status_code == 200
            self.log_test("Get User Statuses (Internal)", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("Get User Statuses (Internal)", False, str(e))
            return False

    def test_messages_endpoint(self):
        """Test messages retrieval"""
        try:
            response = requests.get(f"{self.base_url}/messages", timeout=10)
            success = response.status_code == 200
            if success:
                messages = response.json()
                details = f"Retrieved {len(messages)} messages"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            self.log_test("Get Messages (Internal)", success, details)
            return success
        except Exception as e:
            self.log_test("Get Messages (Internal)", False, str(e))
            return False

    def run_all_tests(self):
        """Run all internal backend tests"""
        print("🚀 Starting ShowTime Employee Portal Internal Backend API Tests")
        print("=" * 70)
        
        # Basic connectivity tests
        self.test_health_check()
        self.test_root_endpoint()
        
        # Employee management tests
        self.test_employee_endpoints()
        
        # User status tests
        self.test_user_status_endpoints()
        
        # Messaging tests
        self.test_messages_endpoint()
        
        # Print summary
        print("\n" + "=" * 70)
        print("📊 INTERNAL TEST SUMMARY")
        print("=" * 70)
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
    tester = InternalAPITester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All internal tests passed! Backend API is working correctly internally.")
        return 0
    else:
        print(f"\n⚠️  Some internal tests failed. Check the details above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())