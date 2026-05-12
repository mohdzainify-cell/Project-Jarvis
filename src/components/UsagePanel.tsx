import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { X, Cpu, HardDrive, MemoryStick, Mic, Send } from "lucide-react";
import { useJarvisStore } from "@/store/jarvisStore";

interface Stats {
  cpu: number;
  ram: number;
  disk: number;
}

export default function UsagePanel() {
  const { toggleUsage, battery, activeModel } = useJarvisStore();

  const [stats, setStats] = useState<Stats>({ cpu: 0, ram: 0, disk: 0 });
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // ------------------ SYSTEM STATS ------------------
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:8000/system/stats");
        const data = await res.json();
        setStats(data);
      } catch { }
    };

    fetchStats();
    const id = setInterval(fetchStats, 3000);
    return () => clearInterval(id);
  }, []);

  // ------------------ WEBSOCKET ------------------
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/chat");
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "chunk") {
        setMessages((prev) => {
          const last = prev[prev.length - 1] || "";
          const updated = [...prev.slice(0, -1), last + data.content];
          return updated;
        });
      }

      if (data.type === "done") {
        // 🔊 PLAY AUDIO
        if (data.audio) {
          const audio = new Audio(
            "data:audio/mp3;base64," + data.audio
          );
          audio.play();
        }
      }
    };

    return () => ws.close();
  }, []);

  // ------------------ SEND MESSAGE ------------------
  const sendMessage = () => {
    if (!input.trim() || !wsRef.current) return;

    setMessages((prev) => [...prev, "You: " + input, "Jarvis: "]);
    wsRef.current.send(
      JSON.stringify({
        message: input,
        session_id: "default",
      })
    );

    setInput("");
  };

  // ------------------ MIC INPUT ------------------
  const startMic = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);

    const chunks: BlobPart[] = [];

    mediaRecorder.ondataavailable = (e) => {
      chunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/wav" });

      const formData = new FormData();
      formData.append("file", blob);

      const res = await fetch("http://localhost:8000/voice/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setInput(data.text);
    };

    mediaRecorder.start();

    setTimeout(() => {
      mediaRecorder.stop();
    }, 3000); // record 3 sec
  };

  // ------------------ UI BAR ------------------
  const Bar = ({
    label,
    value,
    icon,
  }: {
    label: string;
    value: number;
    icon: React.ReactNode;
  }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2 text-cyan-600 font-mono text-xs">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-cyan-400 font-mono text-xs">
          {value.toFixed(1)}%
        </span>
      </div>
      <div className="h-1.5 bg-black/50 rounded-full overflow-hidden border border-cyan-400/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400"
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>
    </div>
  );

  return (
    <motion.div
      className="glass-panel absolute right-4 top-14 w-80 p-5 z-50"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-cyan-400 font-mono text-xs">
          JARVIS PANEL
        </span>
        <button onClick={toggleUsage}>
          <X size={14} />
        </button>
      </div>

      {/* STATS */}
      <Bar label="CPU" value={stats.cpu} icon={<Cpu size={10} />} />
      <Bar label="RAM" value={stats.ram} icon={<MemoryStick size={10} />} />
      <Bar label="DISK" value={stats.disk} icon={<HardDrive size={10} />} />

      {/* CHAT */}
      <div className="mt-4 h-32 overflow-y-auto text-xs font-mono text-cyan-300">
        {messages.map((msg, i) => (
          <div key={i}>{msg}</div>
        ))}
      </div>

      {/* INPUT */}
      <div className="flex gap-2 mt-3">
        <input
          className="flex-1 bg-black/50 text-cyan-300 text-xs p-2 rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Talk to Jarvis..."
        />

        <button onClick={sendMessage}>
          <Send size={14} />
        </button>

        <button onClick={startMic}>
          <Mic size={14} />
        </button>
      </div>

      {/* BATTERY */}
      <div className="mt-4 text-xs font-mono flex justify-between">
        <span>BATTERY</span>
        <span>
          {battery.level}% {battery.charging ? "⚡" : ""}
        </span>
      </div>

      {/* MODEL */}
      {activeModel && (
        <div className="mt-2 text-xs font-mono">
          {activeModel.provider} • {activeModel.model}
        </div>
      )}
    </motion.div>
  );
}