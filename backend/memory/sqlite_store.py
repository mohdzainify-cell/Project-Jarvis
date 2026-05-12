import aiosqlite
import json
from datetime import datetime
from config import settings


class SQLiteMemory:
    def __init__(self):
        self.path = settings.sqlite_path

    async def init(self):
        async with aiosqlite.connect(self.path) as db:
            await db.execute('''
                CREATE TABLE IF NOT EXISTS messages (
                    id       INTEGER PRIMARY KEY AUTOINCREMENT,
                    session  TEXT    NOT NULL,
                    role     TEXT    NOT NULL,
                    content  TEXT    NOT NULL,
                    model    TEXT,
                    ts       TEXT    DEFAULT (datetime('now'))
                )
            ''')
            await db.execute('''
                CREATE TABLE IF NOT EXISTS health_log (
                    id       INTEGER PRIMARY KEY AUTOINCREMENT,
                    date     TEXT    NOT NULL,
                    data     TEXT    NOT NULL,
                    ts       TEXT    DEFAULT (datetime('now'))
                )
            ''')
            await db.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id              INTEGER PRIMARY KEY,
                    password_hash   TEXT NOT NULL,
                    recovery_phrase TEXT,
                    voice_phrase    TEXT DEFAULT 'Jarvis online',
                    created_at      TEXT DEFAULT (datetime('now'))
                )
            ''')
            await db.commit()

    async def add_message(self, session: str, role: str, content: str, model: str = None):
        async with aiosqlite.connect(self.path) as db:
            await db.execute(
                'INSERT INTO messages (session, role, content, model) VALUES (?, ?, ?, ?)',
                (session, role, content, model)
            )
            await db.commit()

    async def get_history(self, session: str, limit: int = 20) -> list[dict]:
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                'SELECT role, content, model, ts FROM messages WHERE session=? ORDER BY id DESC LIMIT ?',
                (session, limit)
            ) as cur:
                rows = await cur.fetchall()
        return [dict(r) for r in reversed(rows)]

    async def log_health(self, date: str, data: dict):
        async with aiosqlite.connect(self.path) as db:
            await db.execute(
                'INSERT INTO health_log (date, data) VALUES (?, ?)',
                (date, json.dumps(data))
            )
            await db.commit()

    async def get_health(self, days: int = 7) -> list[dict]:
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                'SELECT date, data FROM health_log ORDER BY id DESC LIMIT ?',
                (days,)
            ) as cur:
                rows = await cur.fetchall()
        return [{'date': r['date'], **json.loads(r['data'])} for r in rows]