#!/usr/bin/env python3
"""
Google Drive folder setup script for Employee Portal
"""

import os
from pathlib import Path
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Setup
ROOT_DIR = Path(__file__).parent
GOOGLE_DRIVE_CREDENTIALS_PATH = ROOT_DIR / 'google_drive_credentials.json'

def setup_drive_folder():
    """Create a dedicated folder for employee portal files"""
    try:
        credentials = service_account.Credentials.from_service_account_file(
            GOOGLE_DRIVE_CREDENTIALS_PATH,
            scopes=['https://www.googleapis.com/auth/drive']
        )
        service = build('drive', 'v3', credentials=credentials)
        
        # Create folder
        folder_metadata = {
            'name': 'ShowTime Employee Portal Files',
            'mimeType': 'application/vnd.google-apps.folder'
        }
        
        folder = service.files().create(body=folder_metadata, fields='id').execute()
        folder_id = folder.get('id')
        
        print(f"Created folder with ID: {folder_id}")
        
        # Make folder readable by anyone with the link
        permission = {
            'role': 'reader',
            'type': 'anyone'
        }
        service.permissions().create(fileId=folder_id, body=permission).execute()
        print("Folder permissions set to public read")
        
        return folder_id
        
    except Exception as e:
        print(f"Error setting up Google Drive folder: {e}")
        return None

if __name__ == "__main__":
    folder_id = setup_drive_folder()
    if folder_id:
        print(f"\nUse this folder ID in your server.py:")
        print(f"'parents': ['{folder_id}']")