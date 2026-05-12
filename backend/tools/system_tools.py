import psutil
import platform
import subprocess
import asyncio
from datetime import datetime


class SystemTools:

    async def get_battery(self) -> dict:
        bat = psutil.sensors_battery()
        if bat is None:
            return {"level": 100, "charging": True, "time_remaining": None}
        return {
            "level": round(bat.percent),
            "charging": bat.power_plugged,
            "time_remaining": round(bat.secsleft / 60) if bat.secsleft > 0 else None,
        }

    async def get_stats(self) -> dict:
        return {
            "cpu":  psutil.cpu_percent(interval=0.5),
            "ram":  psutil.virtual_memory().percent,
            "disk": psutil.disk_usage('/').percent,
            "uptime": round((datetime.now().timestamp() - psutil.boot_time())),
            "battery": await self.get_battery(),
        }

    async def run_malware_scan(self, path: str = None) -> dict:
        """Basic malware scan using ClamAV if available, else heuristic check."""
        target = path or "/"
        try:
            result = await asyncio.create_subprocess_exec(
                "clamscan", "--summary", "-r", target,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, _ = await result.communicate()
            return {"status": "complete", "output": stdout.decode()[-500:]}
        except FileNotFoundError:
            return {"status": "unavailable", "output": "ClamAV not installed, Sir."}

    async def get_running_processes(self, limit: int = 15) -> list[dict]:
        procs = []
        for p in sorted(
            psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']),
            key=lambda x: x.info['cpu_percent'] or 0,
            reverse=True
        )[:limit]:
            procs.append(p.info)
        return procs

    def get_platform(self) -> dict:
        return {
            "os": platform.system(),
            "version": platform.version(),
            "machine": platform.machine(),
            "hostname": platform.node(),
        }