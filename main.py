#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple Google Drive Scanner - With Version Tracking and Change Detection
Version: 1.0.0 - Initial Release
"""

import os
import json
import time
import logging
import hashlib
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import pytz

try:
    from googleapiclient.discovery import build
    from google.oauth2 import service_account
    from googleapiclient.errors import HttpError
except ImportError:
    print("ERROR: Install required packages with: pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib")
    exit(1)

__version__ = "1.0.0"

@dataclass
class SimpleConfig:
    scopes: List[str] = None
    parentFolderId: str = '12-yT3EhXddZVIreM7O4FLZ_7Yn_bAZJ3'
    credentialsFile: str = 'data1.json'
    outputFile: str = None
    changelogFile: str = None
    maxRetries: int = 3
    retryDelay: int = 2

    def __post_init__(self):
        if self.scopes is None:
            self.scopes = ['https://www.googleapis.com/auth/drive.metadata.readonly']
        
        # Handle public folder logic
        public_folder = 'public'
        if not os.path.exists(public_folder):
            os.makedirs(public_folder, exist_ok=True)
            print(f"📁 Created public folder: {public_folder}")
        else:
            print(f"📁 Found existing public folder: {public_folder}")
        
        # Set consolidated output paths to public folder - only 2 files now
        self.outputFile = os.path.join(public_folder, 'data.json')
        self.changelogFile = os.path.join(public_folder, 'changelog.json')

FILE_CATEGORIES = {
    'documents': [
        'application/pdf',
        'application/vnd.google-apps.document',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ],
    'spreadsheets': [
        'application/vnd.google-apps.spreadsheet',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    'presentations': [
        'application/vnd.google-apps.presentation',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ],
    'images': [
        'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/svg+xml'
    ],
    'videos': [
        'video/mp4', 'video/avi', 'video/mkv', 'video/mov', 'video/wmv'
    ],
    'audio': [
        'audio/mp3', 'audio/wav', 'audio/flac', 'audio/aac'
    ],
    'archives': [
        'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
    ]
}

class SimpleDriveScanner:
    def __init__(self, config: SimpleConfig = None):
        self.config = config or SimpleConfig()
        self.setup_simple_logging()
        self.service = None
        self.current_version = "1.0.0"
        self.stats = {
            'totalFiles': 0,
            'totalFolders': 0,
            'totalSizeMB': 0,
            'apiCallsCount': 0,
            'errors': [],
            'courses': []
        }

    def setup_simple_logging(self):
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[logging.StreamHandler()]
        )
        self.logger = logging.getLogger(__name__)
        
    def authenticate_drive(self):
        """Fixed authentication using credentials file directly"""
        if not os.path.exists(self.config.credentialsFile):
            raise FileNotFoundError(f"Credentials file not found: {self.config.credentialsFile}")

        print(f"🔐 Using credentials file: {self.config.credentialsFile}")
        
        try:
            creds = service_account.Credentials.from_service_account_file(
                self.config.credentialsFile, scopes=self.config.scopes
            )
            self.service = build('drive', 'v3', credentials=creds)
            print("✅ Successfully authenticated with Google Drive")
        except Exception as e:
            print(f"❌ Authentication failed: {str(e)}")
            raise

    def ensure_output_directory(self):
        """Ensure output directory exists"""
        for file_path in [self.config.outputFile, self.config.changelogFile]:
            directory = os.path.dirname(file_path)
            if directory and not os.path.exists(directory):
                os.makedirs(directory, exist_ok=True)
                print(f"📁 Created directory: {directory}")

    def load_previous_scan(self):
        """Load previous scan data and version from changelog.json"""
        try:
            if os.path.exists(self.config.changelogFile):
                with open(self.config.changelogFile, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if data.get('scan_history'):
                        scan_data = data['scan_history']
                        self.current_version = scan_data.get('version', '1.0.0')
                        print(f"📖 Loaded previous scan version: {self.current_version}")
                        return scan_data
            else:
                print(f"📝 Changelog file doesn't exist: {self.config.changelogFile}")
        except Exception as e:
            print(f"⚠️ Error loading previous scan: {str(e)}")
        
        print("📝 No previous scan found. Starting with version 1.0.0")
        return {
            "version": "1.0.0",
            "scan_date": None,
            "data": {},
            "file_signatures": {},
            "total_files": 0,
            "total_folders": 0
        }

    def generate_file_signature(self, file_data):
        """Generate a unique signature for a file based on its properties"""
        signature_data = f"{file_data.get('id', '')}-{file_data.get('name', '')}-{file_data.get('size', 0)}-{file_data.get('modifiedTime', '')}"
        return hashlib.md5(signature_data.encode()).hexdigest()

    def extract_file_signatures(self, folder_data, signatures=None):
        """Extract file signatures from folder data for comparison"""
        if signatures is None:
            signatures = {}
        
        if 'children' in folder_data:
            for item in folder_data['children']:
                if item.get('type') == 'file':
                    sig = self.generate_file_signature(item)
                    signatures[item['id']] = {
                        'signature': sig,
                        'name': item['name'],
                        'size': item.get('size', {}).get('bytes', 0),
                        'modified': item.get('modifiedTime', '')
                    }
                elif item.get('type') == 'folder':
                    self.extract_file_signatures(item, signatures)
        
        return signatures

    def detect_changes(self, current_data, previous_data):
        """Compare current scan with previous scan to detect file changes"""
        current_sigs = self.extract_file_signatures(current_data)
        previous_sigs = previous_data.get('file_signatures', {})
        
        changes = {
            "added_files": [],
            "deleted_files": [],
            "modified_files": [],
            "total_changes": 0,
            "summary": ""
        }
        
        # Find added files (in current but not in previous)
        for file_id, file_info in current_sigs.items():
            if file_id not in previous_sigs:
                changes["added_files"].append({
                    "id": file_id,
                    "name": file_info["name"],
                    "size": file_info["size"]
                })
        
        # Find deleted files (in previous but not in current)
        for file_id, file_info in previous_sigs.items():
            if file_id not in current_sigs:
                changes["deleted_files"].append({
                    "id": file_id,
                    "name": file_info["name"],
                    "size": file_info["size"]
                })
        
        # Find modified files (same ID but different metadata)
        for file_id, current_info in current_sigs.items():
            if file_id in previous_sigs:
                previous_info = previous_sigs[file_id]
                
                # Check various types of changes
                name_changed = current_info["name"] != previous_info["name"]
                size_changed = current_info["size"] != previous_info["size"]
                time_changed = current_info["modified"] != previous_info["modified"]
                
                if name_changed or size_changed or time_changed:
                    # Determine change type
                    change_type = []
                    if name_changed:
                        change_type.append("renamed")
                    if size_changed:
                        change_type.append("resized")
                    if time_changed:
                        change_type.append("modified")
                    
                    changes["modified_files"].append({
                        "id": file_id,
                        "name": current_info["name"],
                        "old_name": previous_info["name"],
                        "old_modified": previous_info["modified"],
                        "new_modified": current_info["modified"],
                        "old_size": previous_info["size"],
                        "new_size": current_info["size"],
                        "change_type": ", ".join(change_type)
                    })
        
        # Calculate totals
        changes["total_changes"] = len(changes["added_files"]) + len(changes["deleted_files"]) + len(changes["modified_files"])
        
        # Generate human-readable summary
        summary_parts = []
        if changes["added_files"]:
            summary_parts.append(f"{len(changes['added_files'])} files added")
        if changes["deleted_files"]:
            summary_parts.append(f"{len(changes['deleted_files'])} files deleted")
        if changes["modified_files"]:
            summary_parts.append(f"{len(changes['modified_files'])} files modified")
        
        changes["summary"] = ", ".join(summary_parts) if summary_parts else "No changes detected"
        
        return changes

    def load_version_history(self):
        """Load existing version history from changelog.json"""
        try:
            if os.path.exists(self.config.changelogFile):
                with open(self.config.changelogFile, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data.get('version_history', [])
        except Exception as e:
            print(f"⚠️ Error loading version history: {str(e)}")
        return []

    def save_version_history(self, new_entry):
        """Save version history with new entry at top - ALWAYS save scans (with or without changes)"""
        try:
            # Load existing history
            history = self.load_version_history()
            
            # Standardize all version keys to "version" for consistency
            for entry in history:
                if "current_version" in entry:
                    entry["version"] = entry.pop("current_version")
                elif "n_version" in entry:
                    entry["version"] = entry.pop("n_version")
            
            # Check if no changes detected
            if new_entry.get("changes", {}).get("total_changes", 0) == 0 and history:
                # Just update the scan_date of the existing top entry
                history[0]["scan_date"] = new_entry["scan_date"]
                # Also update stats if they exist
                if "stats" in new_entry:
                    history[0]["stats"] = new_entry["stats"]
            else:
                # Add new entry at the top (normal behavior for changes detected)
                history.insert(0, new_entry)
            
            # Automatically limit to last 50 versions to prevent file bloat
            if len(history) > 50:
                history = history[:50]
                print(f"🔄 Version history limited to last 50 entries")
            
            return history  # Return the updated history
            
        except Exception as e:
            print(f"❌ Error saving version history: {str(e)}")
            raise

    def increment_version(self, current_version, has_changes):
        """Increment version only if there are changes, otherwise keep same version"""
        if not has_changes:
            return current_version

        try:
            major, minor, patch = map(int, current_version.split('.'))

            patch += 1
            if patch > 9:
                patch = 0
                minor += 1
                if minor > 9:
                    minor = 0
                    major += 1

            return f"{major}.{minor}.{patch}"
        except ValueError:
            return "1.0.1"  # fallback

    def categorize_file(self, mime_type: str) -> str:
        if not mime_type:
            return 'others'
        for category, mime_types in FILE_CATEGORIES.items():
            if mime_type in mime_types:
                return category
        return 'others'

    def format_file_size(self, size_bytes: int) -> Dict[str, float]:
        if size_bytes is None:
            size_bytes = 0
        return {
            'bytes': size_bytes,
            'kb': round(size_bytes / 1024, 2),
            'mb': round(size_bytes / (1024 * 1024), 2),
            'gb': round(size_bytes / (1024 * 1024 * 1024), 4)
        }

    def make_api_call_with_retry(self, api_call, *args, **kwargs):
        for attempt in range(self.config.maxRetries):
            try:
                self.stats['apiCallsCount'] += 1
                return api_call(*args, **kwargs).execute()
            except HttpError as e:
                if e.resp.status == 429:
                    wait = self.config.retryDelay * (2 ** attempt)
                    print(f"⚠️ Rate limit hit, waiting {wait}s...")
                    time.sleep(wait)
                    continue
                elif e.resp.status == 403:
                    self.stats['errors'].append(f"Access forbidden: {str(e)}")
                    return None
                elif attempt == self.config.maxRetries - 1:
                    self.stats['errors'].append(f"API Error: {str(e)}")
                    raise
                time.sleep(self.config.retryDelay)
            except Exception as e:
                if attempt == self.config.maxRetries - 1:
                    self.stats['errors'].append(f"Unexpected error: {str(e)}")
                    raise
                time.sleep(self.config.retryDelay)

    def safe_datetime_format(self, dt: str) -> str:
        if not dt:
            return "N/A"
        return dt.replace("T", " ").replace("Z", "").replace(".000", "")

    def get_folder_description(self, folder_id: str) -> str:
        try:
            meta = self.make_api_call_with_retry(
                self.service.files().get,
                fileId=folder_id,
                fields='description'
            )
            return meta.get('description', '') if meta else ''
        except Exception:
            return ''

    def get_folder_tree(self, folder_id: str, folder_name: str = "Unknown") -> Dict[str, Any]:
        print(f"🔍 Scanning folder: {folder_name}")

        query = f"'{folder_id}' in parents and trashed = false"
        page_token = None
        children = []

        folder_stats = {
            'totalSizeMB': 0,
            'fileCount': 0,
            'folderCount': 0,
            'lastModified': None,
            'fileTypes': {},
            'sizeDistribution': {
                'small': 0,
                'medium': 0,
                'large': 0,
                'huge': 0
            }
        }

        while True:
            response = self.make_api_call_with_retry(
                self.service.files().list,
                q=query,
                spaces='drive',
                fields='nextPageToken, files(id, name, mimeType, size, modifiedTime, createdTime, webViewLink)',
                pageToken=page_token,
                pageSize=1000
            )

            if not response:
                break

            for item in response.get('files', []):
                if item['mimeType'] == 'application/vnd.google-apps.folder':
                    self.stats['totalFolders'] += 1
                    folder_stats['folderCount'] += 1

                    subtree = self.get_folder_tree(item['id'], item['name'])
                    description = self.get_folder_description(item['id'])

                    children.append({
                        "name": item['name'],
                        "id": item['id'],
                        "type": "folder",
                        "driveLink": f"https://drive.google.com/drive/folders/{item['id']}",
                        "description": description,
                        "fileCount": subtree['fileCount'],
                        "folderCount": subtree['folderCount'],
                        "totalSizeMB": subtree['totalSizeMB'],
                        "lastUpdated": subtree['lastUpdated'],
                        "children": subtree['children'],
                        "fileTypes": subtree['fileTypes'],
                        "sizeDistribution": subtree['sizeDistribution']
                    })

                    folder_stats['totalSizeMB'] += subtree['totalSizeMB']
                    folder_stats['fileCount'] += subtree['fileCount']
                    folder_stats['folderCount'] += subtree['folderCount']

                    for ft, count in subtree['fileTypes'].items():
                        folder_stats['fileTypes'][ft] = folder_stats['fileTypes'].get(ft, 0) + count

                    for sz, count in subtree['sizeDistribution'].items():
                        folder_stats['sizeDistribution'][sz] += count

                    if subtree['lastUpdated'] and subtree['lastUpdated'] != "N/A":
                        folder_stats['lastModified'] = max(folder_stats['lastModified'] or subtree['lastUpdated'], subtree['lastUpdated'])
                else:
                    # Handle files
                    self.stats['totalFiles'] += 1
                    folder_stats['fileCount'] += 1

                    size_bytes = int(item.get('size', 0) or 0)
                    size_mb = size_bytes / (1024 * 1024)

                    if size_mb < 1:
                        folder_stats['sizeDistribution']['small'] += 1
                    elif size_mb < 10:
                        folder_stats['sizeDistribution']['medium'] += 1
                    elif size_mb < 100:
                        folder_stats['sizeDistribution']['large'] += 1
                    else:
                        folder_stats['sizeDistribution']['huge'] += 1

                    folder_stats['totalSizeMB'] += size_mb

                    file_type = self.categorize_file(item.get('mimeType', ''))
                    folder_stats['fileTypes'][file_type] = folder_stats['fileTypes'].get(file_type, 0) + 1

                    modified = item.get('modifiedTime') or item.get('createdTime')
                    if modified:
                        formatted = self.safe_datetime_format(modified)
                        folder_stats['lastModified'] = max(folder_stats['lastModified'] or formatted, formatted)

                    # Add file to children list
                    children.append({
                        "name": item['name'],
                        "id": item['id'],
                        "type": "file",
                        "mimeType": item.get('mimeType', ''),
                        "category": file_type,
                        "size": self.format_file_size(size_bytes),
                        "driveLink": item.get('webViewLink', f"https://drive.google.com/file/d/{item['id']}/view"),
                        "modifiedTime": self.safe_datetime_format(modified),
                        "createdTime": self.safe_datetime_format(item.get('createdTime', ''))
                    })

            page_token = response.get('nextPageToken')
            if not page_token:
                break

        return {
            "fileCount": folder_stats['fileCount'],
            "folderCount": folder_stats['folderCount'],
            "totalSizeMB": round(folder_stats['totalSizeMB'], 2),
            "lastUpdated": folder_stats['lastModified'] or "N/A",
            "children": children,
            "fileTypes": folder_stats['fileTypes'],
            "sizeDistribution": folder_stats['sizeDistribution']
        }
        
    def save_scan_with_version(self, scan_data, version, changes, file_signatures):
        """Save scan results with consolidated 2-file structure"""
        print(f"💾 Saving scan results...")

        # Ensure output directory exists
        self.ensure_output_directory()

        try:
            # Use correct Philippine time
            ph_tz = pytz.timezone("Asia/Manila")
            ph_time = datetime.now(ph_tz).isoformat()

            # Save main data.json file (just the drive data)
            output_data = {
                "version": version,
                "scan_date": ph_time,
                "scanner_version": __version__,
                "stats": {
                    "totalFiles": self.stats['totalFiles'],
                    "totalFolders": self.stats['totalFolders'],
                    "totalSizeMB": round(self.stats['totalSizeMB'], 2),
                    "apiCallsCount": self.stats['apiCallsCount']
                },
                "data": scan_data
            }

            with open(self.config.outputFile, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, ensure_ascii=False, indent=2)

            print(f"✅ Main data saved to: {self.config.outputFile}")

            # Create current scan history entry
            scan_history_entry = {
                "version": version,
                "scan_date": ph_time,
                "scanner_version": __version__,
                "changes": changes,
                "data": scan_data,
                "file_signatures": file_signatures,
                "total_files": self.stats['totalFiles'],
                "total_folders": self.stats['totalFolders']
            }

            # Create version history entry
            history_entry = {
                "version": version,
                "scan_date": ph_time,
                "scanner_version": __version__,
                "changes": changes,
                "stats": {
                    "totalFiles": self.stats['totalFiles'],
                    "totalFolders": self.stats['totalFolders'],
                    "totalSizeMB": round(self.stats['totalSizeMB'], 2)
                }
            }
            
            # Get updated version history
            updated_history = self.save_version_history(history_entry)

            # Save consolidated changelog.json file
            changelog_data = {
                "scan_history": scan_history_entry,
                "version_history": updated_history
            }

            with open(self.config.changelogFile, 'w', encoding='utf-8') as f:
                json.dump(changelog_data, f, ensure_ascii=False, indent=2)

            print(f"✅ Changelog saved to: {self.config.changelogFile}")

        except Exception as e:
            print(f"❌ Error saving files: {str(e)}")
            raise
      
    def run(self):
        print(f"🚀 Starting Google Drive Scanner v{__version__}")
        
        try:
            # Load previous scan data
            previous_data = self.load_previous_scan()
            
            # Authenticate and scan
            self.authenticate_drive()
            scan_data = self.get_folder_tree(self.config.parentFolderId)
            
            # Update total stats
            self.stats['totalSizeMB'] = scan_data['totalSizeMB']
            
            # Extract file signatures for change detection
            current_signatures = self.extract_file_signatures(scan_data)
            
            # Detect changes
            changes = self.detect_changes(scan_data, previous_data)
            
            # Determine new version
            has_changes = changes['total_changes'] > 0
            new_version = self.increment_version(self.current_version, has_changes)
            
            # Save results
            self.save_scan_with_version(scan_data, new_version, changes, current_signatures)
            
            # Print results
            print(f"\n📊 Scan Results:")
            print(f"   Version: {self.current_version} → {new_version}")
            print(f"   Files: {self.stats['totalFiles']}")
            print(f"   Folders: {self.stats['totalFolders']}")
            print(f"   Size: {self.stats['totalSizeMB']:.2f} MB")
            print(f"   API Calls: {self.stats['apiCallsCount']}")
            
            if has_changes:
                print(f"\n🔄 Changes Detected: {changes['summary']}")
                if changes['added_files']:
                    print(f"   ➕ Added: {len(changes['added_files'])} files")
                if changes['deleted_files']:
                    print(f"   ➖ Deleted: {len(changes['deleted_files'])} files")
                if changes['modified_files']:
                    print(f"   📝 Modified: {len(changes['modified_files'])} files")
            else:
                print(f"\n✅ No changes detected - version remains {new_version}")
            
            print(f"\n✅ Scan complete! Output saved to {self.config.outputFile}")
            print(f"📜 Changelog saved to {self.config.changelogFile}")
            
            # Verify files were created
            if os.path.exists(self.config.outputFile):
                size = os.path.getsize(self.config.outputFile)
                print(f"📄 {self.config.outputFile} created successfully ({size} bytes)")
            else:
                print(f"❌ {self.config.outputFile} was NOT created!")
                
            if os.path.exists(self.config.changelogFile):
                size = os.path.getsize(self.config.changelogFile)
                print(f"📄 {self.config.changelogFile} created successfully ({size} bytes)")
            else:
                print(f"❌ {self.config.changelogFile} was NOT created!")
            
        except Exception as e:
            print(f"❌ Scanner failed: {str(e)}")
            raise

if __name__ == '__main__':
    scanner = SimpleDriveScanner()
    scanner.run()
