/* presentation/pages/home.tsx */
import { createSignal, onMount, onCleanup, For } from 'solid-js';
import OngoingBanners from '../components/OngoingBanners';
import DatabaseExplorer from '../components/DatabaseExplorer';
import PullHistoryTimeline from '../components/PullHistoryTimeline';

export default function Home() {
  const [activeTab, setActiveTab] = createSignal<'ONGOING' | 'DATABASE' | 'HISTORY'>('ONGOING');
  const [logs, setLogs] = createSignal<string[]>([
    '[INIT] BOOTSTRAP_SEQUENCE_OK',
    '[SEC] ENCRYPTION_LAYER_ESTABLISHED // AES-256',
    '[NET] CONNECTED TO ENDFIELD_MAINNET'
  ]);

  let logContainerRef!: HTMLDivElement;

  // Fake hacker log stream
  onMount(() => {
    const logPool = [
      'MEM_ALLOC: 0x7FFF5FBFF000 // OK',
      'PING // 12ms // TOKYO_EDGE_01',
      'BYPASSING_FIREWALL_LAYER_4...',
      'PITY_STATE_SYNC: DB_READ_SUCCESS',
      'ENDFIELD_OS // KERNEL_VER_7.1.10',
      'FETCHING_OPERATOR_DATASET_CHUNK...',
      'INJECTING_PAYLOAD: SUCCESS',
      'ACCESS_GRANTED: LEVEL_5_CLEARANCE'
    ];

    const interval = setInterval(() => {
      const randomLog = logPool[Math.floor(Math.random() * logPool.length)];
      const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);

      setLogs((prev) => [...prev.slice(-15), `[${timestamp}] ${randomLog}`]);
      if (logContainerRef) {
        logContainerRef.scrollTop = logContainerRef.scrollHeight;
      }
    }, 1800);

    onCleanup(() => clearInterval(interval));
  });

  return (
    <div class="relative h-screen bg-[#0d0d0d] text-white font-sans overflow-hidden selection:bg-white selection:text-black">
      {/* Background Grid Pattern */}
      <div
        class="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          "background-image": "radial-gradient(#ffde00 1px, transparent 1px)",
          "background-size": "24px 24px"
        }}
      />

      {/* Main Flex Column Container */}
      <div class="relative z-10 flex flex-col h-screen p-3 gap-3 box-border">

        {/* 1. Header Bar */}
        <header class="h-12 shrink-0 px-4 flex items-center justify-between relative overflow-hidden">
          <div
            class="absolute inset-0 z-0 border border-[#ffde00]/30 backdrop-blur-md opacity-60 pointer-events-none"
            style={{
              background: "linear-gradient(to right, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.4) 100%)"
            }}
          />
          <div class="flex items-center gap-3 relative z-10">
            <span class="w-2.5 h-2.5 bg-[#ffde00] inline-block animate-pulse" />
            <h1 class="font-mono text-xs tracking-widest uppercase font-bold text-[#ffde00]">
              ENDFIELD // GACHA_SYS
            </h1>
          </div>
          <div class="font-mono text-[11px] text-neutral-400 tracking-wider relative z-10">
            ROOT_ACCESS: <span class="text-green-400 font-bold">GRANTED</span>
          </div>
        </header>

        {/* 2. Resource & Pity Ledger */}
        <div class="h-10 shrink-0 px-4 flex items-center justify-between font-mono text-xs relative overflow-hidden">
          <div
            class="absolute inset-0 z-0 border border-white/10 backdrop-blur-md opacity-60 pointer-events-none"
            style={{
              background: "linear-gradient(to right, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.3) 100%)"
            }}
          />
          <div class="flex items-center gap-3 text-neutral-400 relative z-10">
            <span class="text-[#ffde00] font-bold shrink-0">// PITY_STATUS:</span>
            <span class="text-[11px]">
              COUNT: <span class="text-white font-bold">42/68</span> | GUARANTEE: <span class="text-[#ffde00] font-bold">ACTIVE</span>
            </span>
          </div>

          <div class="flex items-center gap-4 shrink-0 text-[11px] relative z-10">
            <div class="flex items-center gap-2">
              <span class="text-neutral-500">PERMITS:</span>
              <span class="font-bold text-white bg-white/5 px-2 py-0.5 border border-white/10">04</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-neutral-500">ORUNDUM:</span>
              <span class="font-bold text-[#ffde00] bg-[#ffde00]/10 px-2 py-0.5 border border-[#ffde00]/30">12,400</span>
            </div>
          </div>
        </div>

        {/* 3. Primary Interactive Area */}
        <div class="flex-1 grid grid-cols-12 gap-3 min-h-0">

          {/* Sidebar */}
          <aside class="col-span-3 p-3 flex flex-col justify-between relative overflow-hidden">
            <div
              class="absolute inset-0 z-0 border border-white/10 backdrop-blur-md opacity-50 pointer-events-none"
              style={{
                background: "linear-gradient(to bottom, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0) 100%)"
              }}
            />

            <div class="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/40 z-10" />

            <nav class="space-y-2 font-mono text-xs tracking-wider relative z-10">
              <button
                onClick={() => setActiveTab('ONGOING')}
                class={`w-full text-left px-3 py-2.5 uppercase tracking-widest transition-all ${
                  activeTab() === 'ONGOING'
                    ? 'bg-white text-black font-bold shadow-lg shadow-white/10'
                    : 'bg-white/5 hover:bg-white/15 text-neutral-300 border border-white/10 hover:border-white/40'
                }`}
              >
                01 // ONGOING
              </button>
              <button
                onClick={() => setActiveTab('DATABASE')}
                class={`w-full text-left px-3 py-2.5 uppercase tracking-widest transition-all ${
                  activeTab() === 'DATABASE'
                    ? 'bg-white text-black font-bold shadow-lg shadow-white/10'
                    : 'bg-white/5 hover:bg-white/15 text-neutral-300 border border-white/10 hover:border-white/40'
                }`}
              >
                02 // DATABASE
              </button>
              <button
                onClick={() => setActiveTab('HISTORY')}
                class={`w-full text-left px-3 py-2.5 uppercase tracking-widest transition-all ${
                  activeTab() === 'HISTORY'
                    ? 'bg-white text-black font-bold shadow-lg shadow-white/10'
                    : 'bg-white/5 hover:bg-white/15 text-neutral-300 border border-white/10 hover:border-white/40'
                }`}
              >
                03 // HISTORY
              </button>
            </nav>

            <div class="font-mono text-[10px] text-neutral-500 border-t border-white/10 pt-3 relative z-10">
              SYS_ID: 0x994F_JOBS
            </div>
          </aside>

          {/* Dynamic Panel Content */}
          <main class="col-span-9 h-full overflow-hidden relative">
            <div
              class="absolute inset-0 z-0 border border-white/10 backdrop-blur-md opacity-40 pointer-events-none"
              style={{
                background: "linear-gradient(to bottom, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.1) 100%)"
              }}
            />
            <div class="relative z-10 h-full">
              {activeTab() === 'ONGOING' && <OngoingBanners />}
              {activeTab() === 'DATABASE' && <DatabaseExplorer />}
              {activeTab() === 'HISTORY' && <PullHistoryTimeline />}
            </div>
          </main>

        </div>

        {/* 4. Terminal Log Feed (Docked Underneath) */}
        <footer class="h-20 shrink-0 p-2 font-mono text-[10px] flex flex-col justify-between relative overflow-hidden">
          <div
            class="absolute inset-0 z-0 border border-white/10 backdrop-blur-md opacity-80 pointer-events-none"
            style={{
              background: "linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.6) 100%)"
            }}
          />

          <div class="flex items-center justify-between border-b border-white/10 pb-1 px-1 relative z-10">
            <span class="text-white font-bold tracking-widest">// TERMINAL_STREAM_OUTPUT</span>
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

      </div>
    </div>
  );
}
