#!/usr/bin/env python3
"""
Enhanced Google Calendar API Test Script
"""

import json
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Setup
ROOT_DIR = Path(__file__).parent
GOOGLE_MEET_CREDENTIALS_PATH = ROOT_DIR / 'google_meet_credentials.json'

def test_calendar_api():
    """Test Google Calendar API with different configurations"""
    try:
        credentials = service_account.Credentials.from_service_account_file(
            GOOGLE_MEET_CREDENTIALS_PATH,
            scopes=['https://www.googleapis.com/auth/calendar']
        )
        
        service = build('calendar', 'v3', credentials=credentials)
        
        # Test 1: Basic API access
        print("🧪 Test 1: Basic Calendar Access")
        try:
            calendar_list = service.calendarList().list().execute()
            print(f"✅ Found {len(calendar_list.get('items', []))} calendars")
        except Exception as e:
            print(f"❌ Calendar list error: {e}")
            return False
        
        # Test 2: Simple event creation (without conference data)
        print("\n🧪 Test 2: Simple Event Creation")
        try:
            simple_event = {
                'summary': 'Test Event - Simple',
                'description': 'Simple test event without meeting link',
                'start': {
                    'dateTime': (datetime.utcnow() + timedelta(hours=1)).isoformat() + 'Z',
                    'timeZone': 'UTC',
                },
                'end': {
                    'dateTime': (datetime.utcnow() + timedelta(hours=2)).isoformat() + 'Z',
                    'timeZone': 'UTC',
                },
                'attendees': [{'email': 'test@example.com'}]
            }
            
            created_simple = service.events().insert(
                calendarId='primary',
                body=simple_event
            ).execute()
            
            print(f"✅ Simple event created: {created_simple['id']}")
            
        except Exception as e:
            print(f"❌ Simple event creation failed: {e}")
            return False
        
        # Test 3: Event with Google Meet (correct configuration)
        print("\n🧪 Test 3: Event with Google Meet")
        try:
            meet_event = {
                'summary': 'Test Meeting with Google Meet',
                'description': 'Test meeting with video conference',
                'start': {
                    'dateTime': (datetime.utcnow() + timedelta(hours=2)).isoformat() + 'Z',
                    'timeZone': 'UTC',
                },
                'end': {
                    'dateTime': (datetime.utcnow() + timedelta(hours=3)).isoformat() + 'Z',
                    'timeZone': 'UTC',
                },
                'attendees': [
                    {'email': 'test@example.com'},
                    {'email': 'admin@showtimeconsulting.in'}
                ],
                'conferenceData': {
                    'createRequest': {
                        'requestId': str(uuid.uuid4()),
                        'conferenceSolutionKey': {
                            'type': 'hangoutsMeet'
                        }
                    }
                }
            }
            
            created_meet = service.events().insert(
                calendarId='primary',
                body=meet_event,
                conferenceDataVersion=1,
                sendUpdates='all'
            ).execute()
            
            # Extract meeting link
            conference_data = created_meet.get('conferenceData', {})
            entry_points = conference_data.get('entryPoints', [])
            meeting_link = None
            
            for entry_point in entry_points:
                if entry_point.get('entryPointType') == 'video':
                    meeting_link = entry_point.get('uri')
                    break
            
            print(f"✅ Meeting event created: {created_meet['id']}")
            print(f"🔗 Meeting link: {meeting_link or 'No link generated'}")
            print(f"📧 Conference data: {conference_data}")
            
            return True
            
        except Exception as e:
            print(f"❌ Meeting event creation failed: {e}")
            return False
            
    except Exception as e:
        print(f"❌ Calendar API setup failed: {e}")
        return False

def cleanup_test_events():
    """Clean up test events created during testing"""
    try:
        credentials = service_account.Credentials.from_service_account_file(
            GOOGLE_MEET_CREDENTIALS_PATH,
            scopes=['https://www.googleapis.com/auth/calendar']
        )
        
        service = build('calendar', 'v3', credentials=credentials)
        
        # Get events from today onwards
        now = datetime.utcnow().isoformat() + 'Z'
        events_result = service.events().list(
            calendarId='primary',
            timeMin=now,
            q='Test',  # Search for events with "Test" in the title
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        
        print(f"\n🧹 Found {len(events)} test events to clean up")
        
        for event in events:
            if 'Test' in event.get('summary', ''):
                try:
                    service.events().delete(
                        calendarId='primary',
                        eventId=event['id']
                    ).execute()
                    print(f"🗑️ Deleted: {event.get('summary', 'Untitled')}")
                except Exception as e:
                    print(f"❌ Failed to delete {event.get('summary', 'Untitled')}: {e}")
                    
    except Exception as e:
        print(f"❌ Cleanup failed: {e}")

if __name__ == "__main__":
    print("🚀 Enhanced Google Calendar API Testing")
    print("=" * 50)
    
    success = test_calendar_api()
    
    if success:
        print("\n🎉 All tests passed! Google Calendar integration is working.")
        
        # Ask if user wants to clean up test events
        cleanup = input("\n🧹 Clean up test events? (y/n): ").lower().strip()
        if cleanup == 'y':
            cleanup_test_events()
    else:
        print("\n❌ Some tests failed. Please check the configuration.")