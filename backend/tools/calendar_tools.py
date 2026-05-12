from datetime import datetime, timedelta
from typing import Optional


class CalendarTools:
    """
    Stub implementation — wire to Google Calendar API or local ICS.
    Replace get_events / add_event with real API calls as needed.
    """

    def __init__(self):
        # In-memory store for now; replace with Google/Outlook API
        self._events: list[dict] = []

    async def get_events(self, days_ahead: int = 7) -> list[dict]:
        now = datetime.now()
        cutoff = now + timedelta(days=days_ahead)
        return [e for e in self._events
                if now <= datetime.fromisoformat(e["start"]) <= cutoff]

    async def add_event(self, title: str, start: str, end: str, description: str = "") -> dict:
        event = {
            "id": str(len(self._events) + 1),
            "title": title,
            "start": start,
            "end": end,
            "description": description,
        }
        self._events.append(event)
        return {"status": "created", "event": event}

    async def delete_event(self, event_id: str) -> dict:
        before = len(self._events)
        self._events = [e for e in self._events if e["id"] != event_id]
        return {"status": "deleted" if len(self._events) < before else "not_found"}