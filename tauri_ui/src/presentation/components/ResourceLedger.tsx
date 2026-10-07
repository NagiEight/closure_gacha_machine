interface ResourceLedgerProps {
  pityCount?: number;
  maxPity?: number;
  guarantee?: boolean;
  permits?: number;
  orundum?: number;
}

export default function ResourceLedger(props: ResourceLedgerProps) {
  return (
    <div class="h-10 shrink-0 px-4 flex items-center justify-between font-mono text-xs relative overflow-hidden">
      <div
        class="absolute inset-0 z-0 border border-white/10 backdrop-blur-md opacity-60 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.3) 100%)",
        }}
      />
      <div class="flex items-center gap-3 text-neutral-400 relative z-10">
        <span class="text-[#ffde00] font-bold shrink-0">// PITY_STATUS:</span>
        <span class="text-[11px]">
          COUNT:{" "}
          <span class="text-white font-bold">
            {props.pityCount ?? 42}/{props.maxPity ?? 68}
          </span>{" "}
          | GUARANTEE:{" "}
          <span class="text-[#ffde00] font-bold">
            {(props.guarantee ?? true) ? "ACTIVE" : "INACTIVE"}
          </span>
        </span>
      </div>

      <div class="flex items-center gap-4 shrink-0 text-[11px] relative z-10">
        <div class="flex items-center gap-2">
          <span class="text-neutral-500">PERMITS:</span>
          <span class="font-bold text-white bg-white/5 px-2 py-0.5 border border-white/10">
            {String(props.permits ?? 4).padStart(2, "0")}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-neutral-500">ORUNDUM:</span>
          <span class="font-bold text-[#ffde00] bg-[#ffde00]/10 px-2 py-0.5 border border-[#ffde00]/30">
            {(props.orundum ?? 12400).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
