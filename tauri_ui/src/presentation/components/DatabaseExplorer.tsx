import { For, Show, onMount } from "solid-js";
import { DatabaseExplorerService } from "../services/DatabaseExplorerService";

interface DatabaseExplorerProps {
  service: DatabaseExplorerService;
}

export default function DatabaseExplorer(props: DatabaseExplorerProps) {
  const { service } = props;

  onMount(() => {
    void service.fetchData();
  });

  return (
    <div class="h-full flex flex-col p-6 relative overflow-hidden">
      <div class="absolute inset-0 z-0 bg-black/40 border border-[#ffde00]/20 backdrop-blur-md pointer-events-none opacity-20" />

      {/* Top Bar */}
      <div class="relative z-10 flex flex-col md:flex-row justify-between items-center pb-4 border-b border-white/10 gap-4">
        <div class="flex border border-white/20 p-1 bg-black/60 font-mono text-xs">
          <button
            onClick={() => service.setSubTab("OPERATORS")}
            class={`px-4 py-1.5 font-bold transition-all ${
              service.subTab() === "OPERATORS"
                ? "bg-white text-black"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            OPERATORS
          </button>
          <button
            onClick={() => service.setSubTab("BANNERS")}
            class={`px-4 py-1.5 font-bold transition-all ${
              service.subTab() === "BANNERS"
                ? "bg-white text-black"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            BANNERS
          </button>
        </div>

        <div class="flex items-center gap-2 w-full md:w-auto font-mono text-xs">
          <span class="text-[#ffde00]">// SEARCH:</span>
          <input
            type="text"
            value={service.searchQuery()}
            onInput={(e) => service.setSearchQuery(e.currentTarget.value)}
            placeholder={`SEARCH ${service.subTab()}...`}
            class="bg-black/60 border border-white/20 px-3 py-1.5 text-white focus:border-[#ffde00] outline-none w-full md:w-64"
          />
        </div>
      </div>

      {/* Grid Results Container */}
      <div class="relative z-10 flex-1 overflow-y-auto my-4 pr-1">
        <Show when={!service.isLoading()} fallback={<div class="font-mono text-xs text-neutral-400 p-4">LOADING DATA...</div>}>
          <Show when={!service.error()} fallback={<div class="font-mono text-xs text-red-400 p-4">{service.error()}</div>}>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Show when={service.subTab() === "OPERATORS"}>
                <For each={service.operators()}>
                  {(op) => (
                    <div class="bg-black/60 border border-white/10 hover:border-[#ffde00]/60 p-4 flex flex-col justify-between transition-all">
                      <div class="font-mono text-[10px] text-neutral-500">
                        {"★".repeat(op.rarity)}
                      </div>
                      <div class="font-bold text-sm my-2 text-white">{op.name}</div>
                      <div class="font-mono text-[10px] text-[#ffde00]">{op.class}</div>
                    </div>
                  )}
                </For>
              </Show>

              <Show when={service.subTab() === "BANNERS"}>
                <For each={service.banners()}>
                  {(banner) => (
                    <div class="bg-black/60 border border-white/10 hover:border-[#ffde00]/60 p-4 flex flex-col justify-between transition-all">
                      <div class="font-mono text-[10px] text-neutral-500">{banner.type}</div>
                      <div class="font-bold text-sm my-2 text-white">{banner.name}</div>
                      <div class="font-mono text-[10px] text-[#ffde00]">
                        {new Date(banner.releaseDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </For>
              </Show>
            </div>
          </Show>
        </Show>
      </div>

      {/* Pagination Footer */}
      <div class="relative z-10 flex justify-between items-center border-t border-white/10 pt-4 font-mono text-xs">
        <span class="text-neutral-500">PAGE [{service.page()}]</span>

        <div class="flex gap-2">
          <button
            disabled={service.page() === 1 || service.isLoading()}
            onClick={() => service.setPage(service.page() - 1)}
            class="px-3 py-1 bg-black/60 border border-white/20 text-neutral-300 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-300"
          >
            &lt; PREV
          </button>
          <button
            disabled={service.isLoading()}
            onClick={() => service.setPage(service.page() + 1)}
            class="px-3 py-1 bg-black/60 border border-white/20 text-neutral-300 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-300"
          >
            NEXT &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
