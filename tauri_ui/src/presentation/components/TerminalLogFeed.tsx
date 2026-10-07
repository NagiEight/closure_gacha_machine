import { For, createSignal, onMount, onCleanup } from "solid-js";

export default function TerminalLogFeed() {
  const [logs, setLogs] = createSignal<string[]>([
    "[INIT] BOOTSTRAP_SEQUENCE_OK",
    "[SEC] ENCRYPTION_LAYER_ESTABLISHED // AES-256",
    "[NET] CONNECTED TO ENDFIELD_MAINNET",
  ]);

  let logContainerRef!: HTMLDivElement;

  onMount(() => {
    const logPool = [
      "MEM_ALLOC: 0x7FFF5FBFF000 // OK",
      "PING // 12ms // TOKYO_EDGE_01",
      "BYPASSING_FIREWALL_LAYER_4...",
      "PITY_STATE_SYNC: DB_READ_SUCCESS",
      "ENDFIELD_OS // KERNEL_VER_7.1.10",
      "FETCHING_OPERATOR_DATASET_CHUNK...",
      "INJECTING_PAYLOAD: SUCCESS",
      "ACCESS_GRANTED: LEVEL_5_CLEARANCE",
    ];

    const interval = setInterval(() => {
      const randomLog = logPool[Math.floor(Math.random() * logPool.length)];
      const timestamp = new Date().toISOString().split("T")[1].slice(0, 8);

      setLogs((prev) => [...prev.slice(-15), `[${timestamp}] ${randomLog}`]);
      if (logContainerRef) {
        logContainerRef.scrollTop = logContainerRef.scrollHeight;
      }
    }, 1800);

    onCleanup(() => clearInterval(interval));
  });

  return (
    <footer class="h-20 shrink-0 p-2 font-mono text-[10px] flex flex-col justify-between relative overflow-hidden">
      <div
        class="absolute inset-0 z-0 border border-white/10 backdrop-blur-md opacity-80 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.6) 100%)",
        }}
      />

      <div class="flex items-center justify-between border-b border-white/10 pb-1 px-1 relative z-10">
        <span class="text-white font-bold tracking-widest">
          // TERMINAL_STREAM_OUTPUT
        </span>
        <span class="text-neutral-500 animate-pulse">● LIVE_FEED</span>
      </div>

      <div
        ref={logContainerRef}
        class="flex-1 overflow-y-auto space-y-0.5 text-neutral-400 scrollbar-none pt-1 px-1 font-mono relative z-10"
      >
        <For each={logs()}>
          {(log) => <div class="leading-none">{log}</div>}
        </For>
      </div>
    </footer>
  );
}
