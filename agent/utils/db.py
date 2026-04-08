import sqlite3
import os
import json
from datetime import datetime
from typing import List, Dict, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "opencomet.db")


def init_db():
    """Initialize the database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create conversations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            created_at TEXT,
            updated_at TEXT
        )
    ''')
    
    # Create messages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER,
            role TEXT,
            content TEXT,
            created_at TEXT,
            FOREIGN KEY (conversation_id) REFERENCES conversations (id)
        )
    ''')
    
    # Create settings table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    ''')
    
    # Create pages table (for bookmarks)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT,
            title TEXT,
            created_at TEXT
        )
    ''')
    
    conn.commit()
    conn.close()


def create_conversation(title: str = "New Chat") -> int:
    """Create a new conversation."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    now = datetime.utcnow().isoformat()
    cursor.execute(
        'INSERT INTO conversations (title, created_at, updated_at) VALUES (?, ?, ?)',
        (title, now, now)
    )
    conv_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return conv_id


def add_message(conversation_id: int, role: str, content: str):
    """Add a message to a conversation."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    now = datetime.utcnow().isoformat()
    cursor.execute(
        'INSERT INTO messages (conversation_id, role, content, created_at) VALUES (?, ?, ?, ?)',
        (conversation_id, role, content, now)
    )
    
    # Update conversation timestamp
    cursor.execute(
        'UPDATE conversations SET updated_at = ? WHERE id = ?',
        (now, conversation_id)
    )
    
    conn.commit()
    conn.close()


def get_conversation(conversation_id: int) -> Dict:
    """Get a conversation with all messages."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT id, title, created_at, updated_at FROM conversations WHERE id = ?', (conversation_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return None
    
    conversation = {
        'id': row[0],
        'title': row[1],
        'created_at': row[2],
        'updated_at': row[3],
        'messages': []
    }
    
    cursor.execute(
        'SELECT role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at',
        (conversation_id,)
    )
    
    for msg in cursor.fetchall():
        conversation['messages'].append({
            'role': msg[0],
            'content': msg[1],
            'timestamp': msg[2]
        })
    
    conn.close()
    return conversation


def get_conversations(limit: int = 20) -> List[Dict]:
    """Get all conversations."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute(
        'SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC LIMIT ?',
        (limit,)
    )
    
    conversations = []
    for row in cursor.fetchall():
        conversations.append({
            'id': row[0],
            'title': row[1],
            'created_at': row[2],
            'updated_at': row[3]
        })
    
    conn.close()
    return conversations


def delete_conversation(conversation_id: int):
    """Delete a conversation and its messages."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM messages WHERE conversation_id = ?', (conversation_id,))
    cursor.execute('DELETE FROM conversations WHERE id = ?', (conversation_id,))
    
    conn.commit()
    conn.close()


def save_setting(key: str, value: str):
    """Save a setting."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        (key, value)
    )
    
    conn.commit()
    conn.close()


def get_setting(key: str) -> Optional[str]:
    """Get a setting."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT value FROM settings WHERE key = ?', (key,))
    row = cursor.fetchone()
    
    conn.close()
    return row[0] if row else None


def save_page(url: str, title: str):
    """Save a bookmarked page."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    now = datetime.utcnow().isoformat()
    cursor.execute(
        'INSERT INTO pages (url, title, created_at) VALUES (?, ?, ?)',
        (url, title, now)
    )
    
    conn.commit()
    conn.close()


def get_pages() -> List[Dict]:
    """Get all bookmarked pages."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT url, title, created_at FROM pages ORDER BY created_at DESC')
    
    pages = []
    for row in cursor.fetchall():
        pages.append({
            'url': row[0],
            'title': row[1],
            'created_at': row[2]
        })
    
    conn.close()
    return pages


# Initialize on import
init_db()