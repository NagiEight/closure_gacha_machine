import { createSignal, For } from 'solid-js';

interface Banner {
  id: string;
  name: string;
  code: string;
  class: string;
  rarity: string;
  imageBg: string;
  isLimited: boolean;
}

const BANNERS: Banner[] = [
  {
    id: 'b1',
    name: 'PERICEA',
    code: 'EF-SPEC-01',
    class: 'GUARD / 6-STAR SPECIALIST',
    rarity: '★★★★★★',
    imageBg: 'from-amber-900/40 via-neutral-900/80 to-black',
    isLimited: true,
  },
  {
    id: 'b2',
    name: 'ENDADMIN',
    code: 'EF-TACT-02',
    class: 'CASTER / 6-STAR TACTICIAN',
    rarity: '★★★★★★',
    imageBg: 'from-cyan-900/40 via-neutral-900/80 to-black',
    isLimited: false,
  },
  {
    id: 'b3',
    name: 'CHEN QIANYU',
    code: 'EF-VANG-03',
    class: 'VANGUARD / 6-STAR PIONEER',
    rarity: '★★★★★★',
    imageBg: 'from-emerald-900/40 via-neutral-900/80 to-black',
    isLimited: false,
  },
];

export default function BannerSlider() {
  const [currentIndex, setCurrentIndex] = createSignal(0);

  const activeBanner = () => BANNERS[currentIndex()];

  const nextBanner = () => {
    setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
  };

  const prevBanner = () => {
    setCurrentIndex((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);
  };

  return (
    <div class="relative w-full h-full flex flex-col justify-between overflow-hidden p-6">
      {/* Inner Visual Frame (Handles Background, Border, and Backdrop Blur independently) */}
      <div class="absolute inset-0 z-0 bg-black/40 border border-[#ffde00]/20 backdrop-blur-md pointer-events-none opacity-20" />

      {/* Top Banner Meta Header */}
      <div class="relative z-10 flex justify-between items-center h-8 border-b border-white/10 pb-2">
        <div class="flex items-center gap-3">
          <span class="font-mono text-xs text-[#ffde00] tracking-widest leading-none">
            // HEADCOUNT_TARGET [{currentIndex() + 1}/{BANNERS.length}]
          </span>
          {activeBanner().isLimited ? (
            <span class="px-2 py-0.5 bg-[#ffde00] text-black font-mono text-[10px] font-bold tracking-wider uppercase leading-none">
              LIMITED
            </span>
          ) : (
            <span class="h-4" />
          )}
        </div>
        <div class="font-mono text-xs text-neutral-400 tracking-wider leading-none">
          {activeBanner().code}
        </div>
      </div>

      {/* Main Banner Visual Display */}
      <div class={`relative z-10 flex-1 my-4 border border-white/10 bg-gradient-to-br ${activeBanner().imageBg} p-8 flex flex-col justify-end transition-all duration-300`}>
        <div class="relative z-10">
          <div class="text-[#ffde00] text-sm tracking-widest mb-1">
            {activeBanner().rarity}
          </div>
          <h2 class="text-5xl font-black uppercase tracking-tight text-white mb-2">
            {activeBanner().name}
          </h2>
          <p class="font-mono text-xs text-neutral-300 tracking-widest uppercase">
            {activeBanner().class}
          </p>
        </div>
      </div>

      {/* Controls & Pagination Footer */}
      <div class="relative z-10 flex items-center justify-between pt-2">
        {/* Carousel Indicators */}
        <div class="flex items-center gap-2">
          <For each={BANNERS}>
            {(banner, index) => (
              <button
                onClick={() => setCurrentIndex(index())}
                class={`h-1.5 transition-all ${
                  index() === currentIndex()
                    ? `w-8 ${banner.isLimited ? 'bg-[#ffde00]' : 'bg-white'}`
                    : 'w-3 bg-white/20 hover:bg-white/40'
                }`}
              />
            )}
          </For>
        </div>

        {/* Arrow Controls & Gacha Buttons */}
        <div class="flex items-center gap-4">
          <div class="flex gap-1 font-mono text-xs">
            <button
              onClick={prevBanner}
              class="px-3 py-2 bg-black/60 hover:bg-white/10 border border-white/20 text-neutral-300 hover:text-white transition-all"
            >
              &lt; PREV
            </button>
            <button
              onClick={nextBanner}
              class="px-3 py-2 bg-black/60 hover:bg-white/10 border border-white/20 text-neutral-300 hover:text-white transition-all"
            >
              NEXT &gt;
            </button>
          </div>

          <div class="h-6 w-[1px] bg-white/10" />

          <div class="flex gap-2">
            <button class="px-4 py-2.5 bg-black/80 hover:bg-white/10 text-[#ffde00] border border-[#ffde00]/40 font-mono text-xs font-bold uppercase tracking-widest transition-all">
              SEARCH x1
            </button>
            <button class="px-4 py-2.5 bg-[#ffde00] hover:bg-[#c8ae00] text-black font-mono text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(255,222,0,0.25)]">
              SEARCH x10
            </button>
            <button class="px-4 py-2.5 bg-white hover:bg-neutral-200 text-black font-mono text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(255,255,255,0.25)]">
              SEARCH xCUSTOM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
