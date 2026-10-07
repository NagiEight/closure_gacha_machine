export type MainTab = "ONGOING" | "DATABASE" | "HISTORY";

interface SidebarProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
}

export default function Sidebar(props: SidebarProps) {
  const tabs: { id: MainTab; label: string }[] = [
    { id: "ONGOING", label: "01 // ONGOING" },
    { id: "DATABASE", label: "02 // DATABASE" },
    { id: "HISTORY", label: "03 // HISTORY" },
  ];

  return (
    <aside class="col-span-3 p-3 flex flex-col justify-between relative overflow-hidden">
      <div
        class="absolute inset-0 z-0 border border-white/10 backdrop-blur-md opacity-50 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0) 100%)",
        }}
      />
      <div class="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/40 z-10" />

      <nav class="space-y-2 font-mono text-xs tracking-wider relative z-10">
        {tabs.map((tab) => (
          <button
            onClick={() => props.onTabChange(tab.id)}
            class={`w-full text-left px-3 py-2.5 uppercase tracking-widest transition-all ${
              props.activeTab === tab.id
                ? "bg-white text-black font-bold shadow-lg shadow-white/10"
                : "bg-white/5 hover:bg-white/15 text-neutral-300 border border-white/10 hover:border-white/40"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div class="font-mono text-[10px] text-neutral-500 border-t border-white/10 pt-3 relative z-10">
        SYS_ID: 0x994F_JOBS
      </div>
    </aside>
  );
}
