import { createSignal } from "solid-js";
import Header from "../components/Header";
import ResourceLedger from "../components/ResourceLedger";
import Sidebar, { type MainTab } from "../components/Sidebar";
import TerminalLogFeed from "../components/TerminalLogFeed";
import OngoingBanners from "../components/OngoingBanners";
import DatabaseExplorer from "../components/DatabaseExplorer";
import PullHistoryTimeline from "../components/PullHistoryTimeline";
import { DatabaseExplorerService } from "../services/DatabaseExplorerService";

interface HomeProps {
  databaseExplorerService: DatabaseExplorerService;
}

export default function Home(props: HomeProps) {
  const [activeTab, setActiveTab] = createSignal<MainTab>("ONGOING");

  return (
    <div class="relative h-screen bg-[#0d0d0d] text-white font-sans overflow-hidden selection:bg-white selection:text-black">
      {/* Background Grid Pattern */}
      <div
        class="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          "background-image": "radial-gradient(#ffde00 1px, transparent 1px)",
          "background-size": "24px 24px",
        }}
      />

      {/* Main Flex Column Container */}
      <div class="relative z-10 flex flex-col h-screen p-3 gap-3 box-border">
        <Header />
        <ResourceLedger />

        {/* Primary Interactive Area */}
        <div class="flex-1 grid grid-cols-12 gap-3 min-h-0">
          <Sidebar activeTab={activeTab()} onTabChange={setActiveTab} />

          {/* Dynamic Panel Content */}
          <main class="col-span-9 h-full overflow-hidden relative">
            <div
              class="absolute inset-0 z-0 border border-white/10 backdrop-blur-md opacity-40 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.1) 100%)",
              }}
            />
            <div class="relative z-10 h-full">
              {activeTab() === "ONGOING" && <OngoingBanners />}
              {activeTab() === "DATABASE" && (
                <DatabaseExplorer service={props.databaseExplorerService} />
              )}
              {activeTab() === "HISTORY" && <PullHistoryTimeline />}
            </div>
          </main>
        </div>

        <TerminalLogFeed />
      </div>
    </div>
  );
}
