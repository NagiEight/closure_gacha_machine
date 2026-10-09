/* presentation/components/PullHistoryTimeline.tsx */
import { createSignal, For, Show } from 'solid-js';

export interface PullRecord {
  id: string;
  pullNumber: number;
  name: string;
  rarity: 3 | 4 | 5 | 6;
  timestamp: string;
  bannerName: string;
}

export interface UniqueOperator {
  name: string;
  rarity: 3 | 4 | 5 | 6;
  count: number;
  firstPulledAt: string;
}

const MOCK_PULL_HISTORY: PullRecord[] = Array.from({ length: 40 }, (_, i) => {
  const pullNum = i + 1;
  let rarity: 3 | 4 | 5 | 6 = 3;
  let name = 'KROOS';

  if (pullNum === 14 || pullNum === 28 || pullNum === 38) {
    rarity = 6;
    name = pullNum === 14 ? 'ANGELINA' : pullNum === 28 ? 'CHEN' : 'SILVERASH';
  } else if ([5, 11, 21, 33].includes(pullNum)) {
    rarity = 5;
    name = pullNum === 5 ? 'LAPPLAND' : pullNum === 11 ? 'TEXAS' : 'BLUE POISON';
  } else if (pullNum % 3 === 0) {
    rarity = 4;
    name = pullNum % 2 === 0 ? 'PERFUMER' : 'GUMMY';
  }

  return {
    id: `pull-${pullNum}`,
    pullNumber: pullNum,
    name,
    rarity,
    timestamp: `2026-10-${String((i % 28) + 1).padStart(2, '0')} 14:${String(i % 60).padStart(2, '0')}`,
    bannerName: 'ENDFIELD_RECRUIT_01'
  };
});

export default function PullHistoryTimeline() {
  const [hoveredPull, setHoveredPull] = createSignal<{ record: PullRecord; x: number; y: number } | null>(null);
  const [viewMode, setViewMode] = createSignal<'RAW' | 'UNIQUE'>('RAW');

  const getUniqueOperators = (): UniqueOperator[] => {
    const map = new Map<string, UniqueOperator>();
    for (const pull of MOCK_PULL_HISTORY) {
      if (!map.has(pull.name)) {
        map.set(pull.name, {
          name: pull.name,
          rarity: pull.rarity,
          count: 1,
          firstPulledAt: pull.timestamp
        });
      } else {
        const existing = map.get(pull.name)!;
        existing.count += 1;
      }
    }
    return Array.from(map.values()).sort((a, b) => b.rarity - a.rarity || b.count - a.count);
  };

  const pxPerPull = 32;
  const padding = { top: 25, right: 40, bottom: 30, left: 45 };

  const usableWidth = MOCK_PULL_HISTORY.length * pxPerPull;
  const chartWidth = usableWidth + padding.left + padding.right;
  const chartHeight = 130;
  const usableHeight = chartHeight - padding.top - padding.bottom;

  const getX = (index: number) => padding.left + index * pxPerPull;
  const getY = (rarity: number) => padding.top + usableHeight - ((rarity - 3) / 3) * usableHeight;

  const getRarityColor = (rarity: number) => {
    switch (rarity) {
      case 6: return '#ffde00';
      case 5: return '#a855f7';
      case 4: return '#3b82f6';
      default: return '#9ca3af';
    }
  };

  const getSmoothPath = () => {
    const points = MOCK_PULL_HISTORY.map((p, idx) => ({
      x: getX(idx),
      y: getY(p.rarity)
    }));

    if (points.length === 0) return { linePath: '', areaPath: '' };

    let d = `M ${points[0].x},${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      d += ` C ${cpX},${p0.y} ${cpX},${p1.y} ${p1.x},${p1.y}`;
    }

    const lastX = points[points.length - 1].x;
    const areaD = `${d} L ${lastX},${chartHeight - padding.bottom} L ${padding.left},${chartHeight - padding.bottom} Z`;

    return { linePath: d, areaPath: areaD };
  };

  return (
    <div class="h-full flex flex-col gap-3 font-mono text-xs selection:bg-white selection:text-black relative p-4 overflow-hidden">
      {/* Inner Visual Frame (Invisible Parent Quarantined Styling) */}
      <div class="absolute inset-0 z-0 bg-black/40 border border-[#ffde00]/20 backdrop-blur-md pointer-events-none opacity-20" />

      {/* Main Content Container */}
      <div class="relative z-10 h-full flex flex-col gap-3">

        {/* 1/4 Height: Scrollable Chart Viewport with Expanding Nodes */}
        <div class="h-1/4 min-h-[160px] relative flex flex-col justify-between bg-black/40 p-2 overflow-hidden border border-white/10">

          <div class="flex justify-between items-center text-[10px] px-2 z-10">
            <span class="text-[#ffde00] font-bold tracking-widest">// SMOOTH_RARITY_CURVE</span>
            <span class="text-neutral-500 text-[9px] uppercase tracking-wider">[← SCROLL HORIZONTALLY TO VIEW ALL PULLS →]</span>
          </div>

          <div class="flex-1 w-full overflow-x-auto overflow-y-hidden relative scrollbar-thin scrollbar-thumb-[#ffde00]/20 scrollbar-track-transparent">
            <svg
              width={chartWidth}
              height={chartHeight}
              class="overflow-visible block"
            >
              <defs>
                <linearGradient id="underlaidGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#ffde00" stop-opacity="0.25" />
                  <stop offset="100%" stop-color="#a855f7" stop-opacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={padding.left} y1={padding.top} x2={padding.left} y2={chartHeight - padding.bottom} stroke="rgba(255,255,255,0.2)" stroke-width="1" />
              <line x1={padding.left} y1={chartHeight - padding.bottom} x2={chartWidth - padding.right} y2={chartHeight - padding.bottom} stroke="rgba(255,255,255,0.2)" stroke-width="1" />

              <For each={[3, 4, 5, 6]}>
                {(rarity) => {
                  const y = getY(rarity);
                  return (
                    <g>
                      <line x1={padding.left - 3} y1={y} x2={chartWidth - padding.right} y2={y} stroke="rgba(255, 255, 255, 0.06)" stroke-dasharray="2 2" />
                      <text x={padding.left - 8} y={y + 3} fill={getRarityColor(rarity)} font-size="8" font-weight="bold" text-anchor="end">{rarity}★</text>
                    </g>
                  );
                }}
              </For>

              <For each={MOCK_PULL_HISTORY.filter((p) => p.pullNumber === 1 || p.pullNumber % 5 === 0)}>
                {(pull) => {
                  const x = getX(pull.pullNumber - 1);
                  return (
                    <g>
                      <line x1={x} y1={chartHeight - padding.bottom} x2={x} y2={chartHeight - padding.bottom + 4} stroke="rgba(255,255,255,0.3)" />
                      <text x={x} y={chartHeight - padding.bottom + 14} fill="rgba(255,255,255,0.4)" font-size="8" text-anchor="middle">#{pull.pullNumber}</text>
                    </g>
                  );
                }}
              </For>

              {/* Gradient Fill & Curved Line */}
              <path d={getSmoothPath().areaPath} fill="url(#underlaidGradient)" />
              <path d={getSmoothPath().linePath} fill="none" stroke="#ffde00" stroke-width="1.5" stroke-linecap="round" />

              {/* Dynamic Node Points with Hover Expansion */}
              <For each={MOCK_PULL_HISTORY}>
                {(pull, idx) => {
                  const x = getX(idx());
                  const y = getY(pull.rarity);
                  const color = getRarityColor(pull.rarity);
                  const isHovered = () => hoveredPull()?.record.id === pull.id;

                  return (
                    <g
                      class="cursor-pointer"
                      onMouseEnter={() => setHoveredPull({ record: pull, x, y })}
                      onMouseLeave={() => setHoveredPull(null)}
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered() ? (pull.rarity === 6 ? 9 : 7) : (pull.rarity === 6 ? 5 : 3.5)}
                        fill={color}
                        stroke="#000"
                        stroke-width="1"
                        class="transition-all duration-150"
                      />
                      <Show when={pull.rarity === 6}>
                        <circle
                          cx={x}
                          cy={y}
                          r={isHovered() ? 13 : 8}
                          fill="none"
                          stroke="#ffde00"
                          stroke-width="0.8"
                          opacity={isHovered() ? '0.8' : '0.4'}
                        />
                      </Show>
                    </g>
                  );
                }}
              </For>
            </svg>

            {/* Hovered Operator HUD Popover Square */}
            <Show when={hoveredPull()}>
              {(h) => {
                const boxWidth = 130;
                const boxHeight = 55;
                const popX = Math.min(Math.max(h().x - boxWidth / 2, 10), chartWidth - boxWidth - 10);
                const popY = Math.max(h().y - boxHeight - 14, 5);

                return (
                  <div
                    class="absolute pointer-events-none z-20 bg-black/90 border border-[#ffde00] p-2 shadow-xl backdrop-blur-md flex flex-col justify-between"
                    style={{
                      left: `${popX}px`,
                      top: `${popY}px`,
                      width: `${boxWidth}px`,
                      height: `${boxHeight}px`
                    }}
                  >
                    <div class="flex items-center justify-between text-[9px] border-b border-white/10 pb-1">
                      <span class="text-neutral-400">PULL #{h().record.pullNumber}</span>
                      <span class="font-bold" style={{ color: getRarityColor(h().record.rarity) }}>
                        {h().record.rarity}★
                      </span>
                    </div>
                    <div class="font-bold text-white text-[11px] truncate uppercase tracking-wider">
                      {h().record.name}
                    </div>
                    <div class="text-[8px] text-neutral-500 truncate">
                      {h().record.timestamp}
                    </div>
                  </div>
                );
              }}
            </Show>

          </div>
        </div>

        {/* 3/4 Height: Dual View Mode Terminal Log */}
        <div class="h-3/4 flex-1 bg-black/60 border border-white/10 p-3 flex flex-col justify-between overflow-hidden">
          <div class="flex justify-between items-center pb-2 border-b border-white/10 text-[11px]">
            <div class="flex items-center gap-2">
              <button
                onClick={() => setViewMode('RAW')}
                class={`px-2.5 py-1 uppercase tracking-wider text-[10px] ${
                  viewMode() === 'RAW'
                    ? 'bg-white text-black font-bold'
                    : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                }`}
              >
                01 // RAW LOGS
              </button>
              <button
                onClick={() => setViewMode('UNIQUE')}
                class={`px-2.5 py-1 uppercase tracking-wider text-[10px] ${
                  viewMode() === 'UNIQUE'
                    ? 'bg-white text-black font-bold'
                    : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                }`}
              >
                02 // UNIQUE OPERATORS
              </button>
            </div>

            <span class="text-neutral-500 text-[10px]">
              {viewMode() === 'RAW' ? `TOTAL: ${MOCK_PULL_HISTORY.length} PULLS` : `UNIQUE: ${getUniqueOperators().length} UNITS`}
            </span>
          </div>

          <div class="flex-1 overflow-y-auto space-y-1.5 py-2 font-mono text-[11px] scrollbar-thin scrollbar-thumb-white/10">
            <Show when={viewMode() === 'RAW'}>
              <For each={[...MOCK_PULL_HISTORY].reverse()}>
                {(pull) => (
                  <div class="flex items-center justify-between p-2 bg-white/5 border border-transparent hover:border-[#ffde00]/30">
                    <div class="flex items-center gap-3">
                      <span class="text-neutral-500 font-mono">#{String(pull.pullNumber).padStart(3, '0')}</span>
                      <span class="font-bold tracking-wide" style={{ color: getRarityColor(pull.rarity) }}>
                        [{pull.rarity}★] {pull.name}
                      </span>
                    </div>
                    <div class="flex items-center gap-4 text-[10px] text-neutral-400">
                      <span>{pull.bannerName}</span>
                      <span class="text-neutral-600">{pull.timestamp}</span>
                    </div>
                  </div>
                )}
              </For>
            </Show>

            <Show when={viewMode() === 'UNIQUE'}>
              <div class="grid grid-cols-2 gap-2">
                <For each={getUniqueOperators()}>
                  {(op) => (
                    <div class="flex items-center justify-between p-2.5 bg-white/5 border border-white/10 hover:border-[#ffde00]/40">
                      <div class="flex items-center gap-2">
                        <span class="font-bold" style={{ color: getRarityColor(op.rarity) }}>
                          [{op.rarity}★] {op.name}
                        </span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-[10px] text-neutral-500">OBTAINED:</span>
                        <span class="font-bold text-[#ffde00] bg-[#ffde00]/10 border border-[#ffde00]/30 px-2 py-0.5 text-[10px]">
                          x{op.count}
                        </span>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </div>

      </div>
    </div>
  );
}
