import bcrypt
import aiosqlite
from config import settings


class AuthManager:
    def __init__(self, db_path: str):
        self.db_path = db_path

    async def verify_password(self, password: str) -> bool:
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute('SELECT password_hash FROM users WHERE id=1') as cur:
                row = await cur.fetchone()
        if not row:
            # First run — set the default password
            await self.set_password(password)
            return True
        return bcrypt.checkpw(password.encode(), row[0].encode())

    async def set_password(self, new_password: str) -> bool:
        hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                'INSERT OR REPLACE INTO users (id, password_hash) VALUES (1, ?)',
                (hashed,)
            )
            await db.commit()
        return True

    async def verify_voice(self, transcript: str) -> bool:
        phrase = settings.voice_passphrase.lower().strip()
        return phrase in transcript.lower()