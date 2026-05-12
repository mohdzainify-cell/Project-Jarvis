"""
Run this to reset your JARVIS password.
Usage: python reset_password.py
"""
import asyncio
import aiosqlite
import bcrypt
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "data" / "jarvis.db"

async def reset():
    print(f"Database: {DB_PATH}")
    
    new_password = input("Enter your new password: ").strip()
    if not new_password:
        print("Password cannot be empty.")
        return

    hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()

    async with aiosqlite.connect(DB_PATH) as db:
        # Make sure table exists
        await db.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id              INTEGER PRIMARY KEY,
                password_hash   TEXT NOT NULL,
                recovery_phrase TEXT,
                voice_phrase    TEXT DEFAULT 'Jarvis online',
                created_at      TEXT DEFAULT (datetime('now'))
            )
        ''')
        # Delete old and insert fresh
        await db.execute('DELETE FROM users WHERE id = 1')
        await db.execute(
            'INSERT INTO users (id, password_hash) VALUES (1, ?)',
            (hashed,)
        )
        await db.commit()

    print(f"\nPassword set successfully, Sir.")
    print(f"You can now log in with: {new_password}")

if __name__ == "__main__":
    asyncio.run(reset())