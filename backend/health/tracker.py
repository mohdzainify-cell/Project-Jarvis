from memory.sqlite_store import SQLiteMemory
from datetime import datetime, timedelta
from statistics import mean


class HealthTracker:
    def __init__(self, memory: SQLiteMemory):
        self.memory = memory

    async def log(self, data: dict) -> dict:
        date = data.pop("date", datetime.today().strftime("%Y-%m-%d"))
        await self.memory.log_health(date, data)
        return {"status": "logged", "date": date}

    async def get_trends(self, days: int = 7) -> dict:
        entries = await self.memory.get_health(days)
        if not entries:
            return {"message": "No health data recorded yet, Sir."}

        def avg(key):
            vals = [e[key] for e in entries if key in e and e[key] is not None]
            return round(mean(vals), 1) if vals else None

        return {
            "period_days": days,
            "avg_sleep":    avg("sleep"),
            "avg_water":    avg("water"),
            "avg_exercise": avg("exercise"),
            "avg_mood":     avg("mood"),
            "entries":      len(entries),
        }