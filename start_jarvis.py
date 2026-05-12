"""
JARVIS Launcher
Press the ▶ Run button in VS Code to start everything.
"""

import subprocess
import sys
import os
import time
import threading
import urllib.request
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────
ROOT    = Path("C:/Users/pksam/Desktop/jarvis")
BACKEND = ROOT / "backend"
PYTHON  = ROOT / "backend" / "venv" / "Scripts" / "python.exe"
NPM     = "npm.cmd"
NPXCMD  = "npx.cmd"

# ── Colours ───────────────────────────────────────────────────────────
CYAN   = "\033[96m"
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
PURPLE = "\033[95m"
BLUE   = "\033[94m"
RESET  = "\033[0m"
BOLD   = "\033[1m"

processes = []


def log(tag, msg, colour=CYAN):
    print(f"{colour}{BOLD}[{tag}]{RESET} {msg}")


def stream_output(proc, tag, colour):
    try:
        for line in iter(proc.stdout.readline, b""):
            text = line.decode("utf-8", errors="replace").rstrip()
            if text:
                print(f"{colour}[{tag}]{RESET} {text}")
                # Detect when Vite is ready
                if "ready in" in text and "VITE" in text:
                    log("READY", "Vite is online.", GREEN)
    except Exception:
        pass


def run(cmd, tag, colour, cwd=None):
    if cwd is None:
        cwd = ROOT
    proc = subprocess.Popen(
        cmd,
        cwd=str(cwd),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        creationflags=subprocess.CREATE_NO_WINDOW,
    )
    processes.append(proc)
    t = threading.Thread(
        target=stream_output,
        args=(proc, tag, colour),
        daemon=True
    )
    t.start()
    return proc


def kill_port(port: int):
    try:
        result = subprocess.run(
            f"netstat -ano | findstr :{port}",
            shell=True,
            capture_output=True,
            text=True
        )
        for line in result.stdout.strip().splitlines():
            if f":{port}" in line and "LISTENING" in line:
                parts = line.strip().split()
                pid = parts[-1]
                subprocess.run(
                    f"taskkill /PID {pid} /F",
                    shell=True,
                    capture_output=True
                )
                log("CLEANUP", f"Killed process on port {port} (PID {pid})", YELLOW)
    except Exception:
        pass


def wait_for_backend(timeout=60):
    log("WAIT", "Waiting for Python Backend...", YELLOW)
    for i in range(timeout):
        try:
            urllib.request.urlopen("http://127.0.0.1:8765/health", timeout=2)
            log("READY", "Python Backend is online.", GREEN)
            return True
        except Exception:
            time.sleep(1)
    log("FAIL", "Python Backend did not respond after {timeout}s.", RED)
    return False


def wait_for_vite(timeout=30):
    """Wait for Vite by checking port directly."""
    log("WAIT", "Waiting for Vite...", YELLOW)
    import socket
    for i in range(timeout):
        try:
            sock = socket.create_connection(("localhost", 5173), timeout=1)
            sock.close()
            log("READY", "Vite is online.", GREEN)
            return True
        except Exception:
            time.sleep(1)
    log("FAIL", "Vite did not respond.", RED)
    return False


def shutdown():
    log("JARVIS", "Shutting down all systems...", YELLOW)
    for proc in processes:
        try:
            proc.terminate()
        except Exception:
            pass
    time.sleep(1)
    for proc in processes:
        try:
            proc.kill()
        except Exception:
            pass
    kill_port(5173)
    kill_port(8765)
    log("JARVIS", "Goodbye, Sir.", CYAN)
    sys.exit(0)


def checks():
    log("CHECK", f"Python path: {PYTHON}", CYAN)

    if not PYTHON.exists():
        log("ERROR", "Python venv not found.", RED)
        log("ERROR", "Run: cd backend && python -m venv venv", RED)
        log("ERROR", "Then: venv\\Scripts\\python.exe -m pip install fastapi uvicorn litellm chromadb aiosqlite pydantic-settings bcrypt python-dotenv psutil", RED)
        sys.exit(1)

    log("CHECK", "Python venv found.", GREEN)

    try:
        result = subprocess.run(
            [str(PYTHON), "-m", "uvicorn", "--version"],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode != 0:
            raise Exception("failed")
        log("CHECK", f"uvicorn OK — {result.stdout.strip()}", GREEN)
    except Exception:
        log("ERROR", "uvicorn not found. Run: venv\\Scripts\\python.exe -m pip install uvicorn fastapi", RED)
        sys.exit(1)

    try:
        result = subprocess.run(
            ["node", "--version"],
            capture_output=True, text=True, timeout=10
        )
        log("CHECK", f"Node.js {result.stdout.strip()}", GREEN)
    except Exception:
        log("ERROR", "Node.js not found. Install from https://nodejs.org", RED)
        sys.exit(1)

    log("CHECK", "npm OK.", GREEN)

    try:
        subprocess.run(["ollama", "--version"], capture_output=True, timeout=5)
        log("CHECK", "Ollama found.", GREEN)
    except Exception:
        log("WARN", "Ollama not found — local fallback unavailable.", YELLOW)


def main():
    print(f"""
{CYAN}{BOLD}
  ╔══════════════════════════════════════╗
  ║   J.A.R.V.I.S.  —  Initialising      ║
  ║   Just A Rather Very Intelligent     ║
  ║   System  •  Stark Industries        ║
  ╚══════════════════════════════════════╝
{RESET}""")

    # ── Step 1: Checks ────────────────────────────────────────────────
    log("JARVIS", "Running startup checks...", CYAN)
    checks()
    log("JARVIS", "All checks passed. Booting systems...", GREEN)

    # ── Step 2: Kill leftover ports ───────────────────────────────────
    log("CLEANUP", "Clearing ports from previous runs...", YELLOW)
    kill_port(5173)
    kill_port(8765)
    time.sleep(1)

    # ── Step 3: Ollama ────────────────────────────────────────────────
    log("OLLAMA", "Starting Ollama...", YELLOW)
    try:
        run(["ollama", "serve"], "OLLAMA", YELLOW)
        time.sleep(2)
    except Exception:
        log("OLLAMA", "Skipping — Ollama not installed.", YELLOW)

    # ── Step 4: Python Backend ────────────────────────────────────────
    log("BACKEND", "Starting Python backend on port 8765...", PURPLE)
    run(
        [
            str(PYTHON), "-m", "uvicorn",
            "jarvis_core:app",
            "--host", "127.0.0.1",
            "--port", "8765",
            "--reload"
        ],
        "BACKEND", PURPLE, cwd=BACKEND
    )

    if not wait_for_backend(timeout=60):
        log("ERROR", "Backend failed to start.", RED)
        log("ERROR", "Scroll up and check [BACKEND] lines for the real error.", RED)
        shutdown()

    # ── Step 5: Vite ──────────────────────────────────────────────────
    log("VITE", "Starting Vite on port 5173...", BLUE)
    run([NPM, "run", "vite"], "VITE", BLUE, cwd=ROOT)

    if not wait_for_vite(timeout=30):
        log("ERROR", "Vite failed to start.", RED)
        shutdown()

    # ── Step 6: Electron ──────────────────────────────────────────────
    log("ELECTRON", "Launching JARVIS window...", CYAN)
    time.sleep(1)

    env = os.environ.copy()
    env["NODE_ENV"] = "development"

    electron = subprocess.Popen(
        [NPXCMD, "electron", "."],
        cwd=str(ROOT),
        env=env,
    )
    processes.append(electron)

    log("JARVIS", "All systems online. Good day, Sir.", GREEN)
    print(f"\n{YELLOW}Press Ctrl+C to shut down JARVIS.{RESET}\n")

    try:
        electron.wait()
    except KeyboardInterrupt:
        pass

    log("JARVIS", "Electron window closed.", YELLOW)
    shutdown()


if __name__ == "__main__":
    main()