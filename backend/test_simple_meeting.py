#!/usr/bin/env python3
"""
Simple Google Calendar Meeting Test
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

def test_meeting_creation():
    """Test meeting creation without attendees"""
    try:
        credentials = service_account.Credentials.from_service_account_file(
            GOOGLE_MEET_CREDENTIALS_PATH,
            scopes=['https://www.googleapis.com/auth/calendar']
        )
        
        service = build('calendar', 'v3', credentials=credentials)
        
        # Create event
        event = {
            'summary': 'ShowTime Portal Test Meeting',
            'description': 'Test meeting created by ShowTime Employee Portal\n\nAttendees: admin@showtimeconsulting.in, test@example.com',
            'start': {
                'dateTime': (datetime.utcnow() + timedelta(hours=1)).isoformat() + 'Z',
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': (datetime.utcnow() + timedelta(hours=2)).isoformat() + 'Z',
                'timeZone': 'UTC',
            },
            'conferenceData': {
                'createRequest': {
                    'requestId': str(uuid.uuid4()),
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
        
        # Extract meeting link
        conference_data = created_event.get('conferenceData', {})
        entry_points = conference_data.get('entryPoints', [])
        meeting_link = None
        
        for entry_point in entry_points:
            if entry_point.get('entryPointType') == 'video':
                meeting_link = entry_point.get('uri')
                break
        
        print(f"✅ Meeting created successfully!")
        print(f"📅 Event ID: {created_event['id']}")
        print(f"🔗 Meeting Link: {meeting_link}")
        print(f"📝 Event URL: {created_event.get('htmlLink', 'N/A')}")
        
        return {
            'success': True,
            'event_id': created_event['id'],
            'meeting_link': meeting_link,
            'html_link': created_event.get('htmlLink')
        }
        
    except Exception as e:
        print(f"❌ Meeting creation failed: {e}")
        return {'success': False, 'error': str(e)}

if __name__ == "__main__":
    print("🚀 Testing ShowTime Portal Meeting Creation")
    print("-" * 45)
    
    result = test_meeting_creation()
    
    if result['success']:
        print(f"\n🎉 SUCCESS! Google Calendar integration is working.")
        print(f"The meeting link can be shared with attendees manually.")
    else:
        print(f"\n❌ FAILED: {result['error']}")