import { createSignal, createMemo, For } from 'solid-js';

type SubTab = 'OPERATORS' | 'BANNERS';

interface Operator {
  id: string;
  name: string;
  rarity: number;
  class: string;
}

interface Banner {
  id: string;
  code: string;
  name: string;
  type: string;
}

const MOCK_OPERATORS: Operator[] = Array.from({ length: 25 }, (_, i) => ({
  id: `op-${i + 1}`,
  name: `OPERATOR_${String(i + 1).padStart(2, '0')}`,
  rarity: (i % 3) + 4,
  class: ['GUARD', 'CASTER', 'VANGUARD', 'SNIPER', 'MEDIC'][i % 5],
}));

const MOCK_BANNERS: Banner[] = Array.from({ length: 18 }, (_, i) => ({
  id: `b-${i + 1}`,
  code: `EF-RECRUIT-${String(i + 1).padStart(2, '0')}`,
  name: `TARGET_BANNER_${i + 1}`,
  type: i % 2 === 0 ? 'HEADCOUNT' : 'JOINT',
}));

const ITEMS_PER_PAGE = 8;

export default function DatabaseExplorer() {
  const [subTab, setSubTab] = createSignal<SubTab>('OPERATORS');
  const [search, setSearch] = createSignal('');
  const [page, setPage] = createSignal(1);

  // Filtered dataset calculation
  const filteredData = createMemo(() => {
    const q = search().toLowerCase();
    if (subTab() === 'OPERATORS') {
      return MOCK_OPERATORS.filter((op) => op.name.toLowerCase().includes(q) || op.class.toLowerCase().includes(q));
    } else {
      return MOCK_BANNERS.filter((b) => b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q));
    }
  });

  // Pagination calculation
  const totalPages = createMemo(() => Math.ceil(filteredData().length / ITEMS_PER_PAGE) || 1);
  const paginatedData = createMemo(() => {
    const start = (page() - 1) * ITEMS_PER_PAGE;
    return filteredData().slice(start, start + ITEMS_PER_PAGE);
  });

  const handleSubTabChange = (tab: SubTab) => {
    setSubTab(tab);
    setSearch('');
    setPage(1);
  };

  return (
    <div class="h-full flex flex-col p-6 relative overflow-hidden">
      {/* Inner Visual Frame (Handles Background, Border, and Backdrop Blur independently) */}
      <div class="absolute inset-0 z-0 bg-black/40 border border-[#ffde00]/20 backdrop-blur-md pointer-events-none opacity-20" />

      {/* Top Bar: Sub-tabs & Search Input */}
      <div class="relative z-10 flex flex-col md:flex-row justify-between items-center pb-4 border-b border-white/10 gap-4">
        {/* Toggle Switch */}
        <div class="flex border border-white/20 p-1 bg-black/60 font-mono text-xs">
          <button
            onClick={() => handleSubTabChange('OPERATORS')}
            class={`px-4 py-1.5 font-bold transition-all ${
              subTab() === 'OPERATORS' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
            }`}
          >
            OPERATORS
          </button>
          <button
            onClick={() => handleSubTabChange('BANNERS')}
            class={`px-4 py-1.5 font-bold transition-all ${
              subTab() === 'BANNERS' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
            }`}
          >
            BANNERS
          </button>
        </div>

        {/* Search Input */}
        <div class="flex items-center gap-2 w-full md:w-auto font-mono text-xs">
          <span class="text-[#ffde00]">// SEARCH:</span>
          <input
            type="text"
            value={search()}
            onInput={(e) => {
              setSearch(e.currentTarget.value);
              setPage(1);
            }}
            placeholder={`SEARCH ${subTab()}...`}
            class="bg-black/60 border border-white/20 px-3 py-1.5 text-white focus:border-[#ffde00] outline-none w-full md:w-64"
          />
        </div>
      </div>

      {/* Grid Results Container */}
      <div class="relative z-10 flex-1 overflow-y-auto my-4 grid grid-cols-2 md:grid-cols-4 gap-4 pr-1">
        <For each={paginatedData()}>
          {(item) => (
            <div class="bg-black/60 border border-white/10 hover:border-[#ffde00]/60 p-4 flex flex-col justify-between transition-all">
              {subTab() === 'OPERATORS' ? (
                <>
                  <div class="font-mono text-[10px] text-neutral-500">
                    {'★'.repeat((item as Operator).rarity)}
                  </div>
                  <div class="font-bold text-sm my-2 text-white">{(item as Operator).name}</div>
                  <div class="font-mono text-[10px] text-[#ffde00]">{(item as Operator).class}</div>
                </>
              ) : (
                <>
                  <div class="font-mono text-[10px] text-neutral-500">{(item as Banner).code}</div>
                  <div class="font-bold text-sm my-2 text-white">{(item as Banner).name}</div>
                  <div class="font-mono text-[10px] text-[#ffde00]">{(item as Banner).type}</div>
                </>
              )}
            </div>
          )}
        </For>
      </div>

      {/* Pagination Footer */}
      <div class="relative z-10 flex justify-between items-center border-t border-white/10 pt-4 font-mono text-xs">
        <span class="text-neutral-500">
          PAGE [{page()} / {totalPages()}] (TOTAL: {filteredData().length})
        </span>

        <div class="flex gap-2">
          <button
            disabled={page() === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            class="px-3 py-1 bg-black/60 border border-white/20 text-neutral-300 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-300"
          >
            &lt; PREV
          </button>
          <button
            disabled={page() >= totalPages()}
            onClick={() => setPage((p) => Math.min(totalPages(), p + 1))}
            class="px-3 py-1 bg-black/60 border border-white/20 text-neutral-300 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-300"
          >
            NEXT &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
