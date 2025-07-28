#!/usr/bin/env python3
"""
Google Calendar API Setup Script
This script enables the Google Calendar API for the project
"""

import json
import requests
from google.oauth2 import service_account
from googleapiclient.discovery import build
from pathlib import Path

# Setup
ROOT_DIR = Path(__file__).parent
GOOGLE_MEET_CREDENTIALS_PATH = ROOT_DIR / 'google_meet_credentials.json'

def enable_calendar_api():
    """Enable Google Calendar API for the project"""
    try:
        # Load credentials
        with open(GOOGLE_MEET_CREDENTIALS_PATH) as f:
            credentials_info = json.load(f)
        
        project_id = credentials_info['project_id']
        print(f"Project ID: {project_id}")
        
        # Instructions for manual API enabling
        print("\n" + "="*60)
        print("🔧 GOOGLE CALENDAR API SETUP REQUIRED")
        print("="*60)
        print(f"1. Visit: https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project={project_id}")
        print("2. Click 'ENABLE' button")
        print("3. Wait 2-3 minutes for the API to propagate")
        print("4. Try the meeting creation again")
        print("="*60)
        
        # Test current status
        credentials = service_account.Credentials.from_service_account_file(
            GOOGLE_MEET_CREDENTIALS_PATH,
            scopes=['https://www.googleapis.com/auth/calendar']
        )
        
        try:
            service = build('calendar', 'v3', credentials=credentials)
            calendars = service.calendarList().list().execute()
            print("✅ SUCCESS: Google Calendar API is already enabled and working!")
            return True
        except Exception as e:
            if "accessNotConfigured" in str(e):
                print("❌ Google Calendar API needs to be enabled manually")
                return False
            else:
                print(f"❌ Other API error: {e}")
                return False
                
    except Exception as e:
        print(f"❌ Setup error: {e}")
        return False

def create_test_meeting():
    """Test meeting creation after API is enabled"""
    try:
        credentials = service_account.Credentials.from_service_account_file(
            GOOGLE_MEET_CREDENTIALS_PATH,
            scopes=['https://www.googleapis.com/auth/calendar']
        )
        
        service = build('calendar', 'v3', credentials=credentials)
        
        # Create a test event
        event = {
            'summary': 'Test Meeting - Employee Portal',
            'description': 'Test meeting created by Employee Portal',
            'start': {
                'dateTime': '2025-07-29T14:00:00',
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': '2025-07-29T15:00:00',
                'timeZone': 'UTC',
            },
            'conferenceData': {
                'createRequest': {
                    'requestId': 'test-meeting-123',
                    'conferenceSolutionKey': {
                        'type': 'hangoutsMeet'
                    }
                }
            }
        }
        
        created_event = service.events().insert(
            calendarId='primary',
            body=event,
            conferenceDataVersion=1
        ).execute()
        
        meeting_link = created_event.get('conferenceData', {}).get('entryPoints', [{}])[0].get('uri')
        print(f"✅ Test meeting created successfully!")
        print(f"📅 Event ID: {created_event['id']}")
        print(f"🔗 Meeting Link: {meeting_link}")
        
        return True
        
    except Exception as e:
        print(f"❌ Test meeting creation failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Google Calendar API Setup")
    print("-" * 40)
    
    # Check API status
    api_enabled = enable_calendar_api()
    
    if api_enabled:
        print("\n📝 Testing meeting creation...")
        create_test_meeting()
    else:
        print("\n⏳ Please enable the API first, then run this script again to test.")