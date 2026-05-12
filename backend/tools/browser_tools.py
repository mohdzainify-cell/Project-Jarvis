import webbrowser
import asyncio
import subprocess
import platform


class BrowserTools:

    async def open_url(self, url: str) -> dict:
        if not url.startswith(("https://", "http://")):
            url = f"https://{url}"
        webbrowser.open(url)
        return {"status": "opened", "url": url}

    async def search_web(self, query: str) -> dict:
        url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
        webbrowser.open(url)
        return {"status": "searching", "query": query, "url": url}

    async def open_app(self, app_name: str) -> dict:
        os_name = platform.system()
        try:
            if os_name == "Darwin":
                subprocess.Popen(["open", "-a", app_name])
            elif os_name == "Windows":
                subprocess.Popen(["start", app_name], shell=True)
            else:
                subprocess.Popen([app_name])
            return {"status": "launched", "app": app_name}
        except Exception as e:
            return {"status": "error", "message": str(e)}