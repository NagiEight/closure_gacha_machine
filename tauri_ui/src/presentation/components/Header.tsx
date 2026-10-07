export default function Header() {
  return (
    <header class="h-12 shrink-0 px-4 flex items-center justify-between relative overflow-hidden">
      <div
        class="absolute inset-0 z-0 border border-[#ffde00]/30 backdrop-blur-md opacity-60 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.4) 100%)",
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
  );
}
