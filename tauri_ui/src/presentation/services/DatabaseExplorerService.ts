import { createSignal, createMemo } from "solid-js";
import { OperatorSearchQuery, OperatorSummary } from "../../features/operator/domain/entities";
import { BannerSearchQuery, BannerSummary } from "../../features/banner/domain/entities";
import { OperatorPort } from "../../features/operator/domain/ports";
import { BannerPort } from "../../features/banner/domain/ports";

export type SubTab = "OPERATORS" | "BANNERS";

export interface DatabaseExplorerState {
  subTab: SubTab;
  searchQuery: string;
  page: number;
  isLoading: boolean;
  error: string | null;
  operators: OperatorSummary[];
  banners: BannerSummary[];
}

export class DatabaseExplorerService {
  private readonly operatorPort: OperatorPort;
  private readonly bannerPort: BannerPort;

  // Reactive State Primitives
  private readonly subTabSignal = createSignal<SubTab>("OPERATORS");
  private readonly searchSignal = createSignal<string>("");
  private readonly pageSignal = createSignal<number>(1);
  private readonly isLoadingSignal = createSignal<boolean>(false);
  private readonly errorSignal = createSignal<string | null>(null);

  private readonly operatorsSignal = createSignal<OperatorSummary[]>([]);
  private readonly bannersSignal = createSignal<BannerSummary[]>([]);

  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(operatorPort: OperatorPort, bannerPort: BannerPort) {
    this.operatorPort = operatorPort;
    this.bannerPort = bannerPort;
  }

  // Reactive Getters for UI Consumption
  public readonly subTab = this.subTabSignal[0];
  public readonly searchQuery = this.searchSignal[0];
  public readonly page = this.pageSignal[0];
  public readonly isLoading = this.isLoadingSignal[0];
  public readonly error = this.errorSignal[0];
  public readonly operators = this.operatorsSignal[0];
  public readonly banners = this.bannersSignal[0];

  public setSubTab(tab: SubTab): void {
    if (this.subTab() === tab) return;
    this.subTabSignal[1](tab);
    this.searchSignal[1]("");
    this.pageSignal[1](1);
    this.errorSignal[1](null);
    void this.fetchData();
  }

  public setSearchQuery(query: string): void {
    this.searchSignal[1](query);
    this.pageSignal[1](1);

    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    this.searchDebounceTimer = setTimeout(() => {
      void this.fetchData();
    }, 300);
  }

  public setPage(newPage: number): void {
    if (newPage < 1 || newPage === this.page()) return;
    this.pageSignal[1](newPage);
    void this.fetchData();
  }

  public async fetchData(): Promise<void> {
    this.isLoadingSignal[1](true);
    this.errorSignal[1](null);

    try {
      const activeTab = this.subTab();
      const page = this.page();
      const queryText = this.searchQuery().trim();

      if (activeTab === "OPERATORS") {
        const query: OperatorSearchQuery = queryText
          ? { nameQuery: queryText }
          : {};
        const results = await this.operatorPort.searchOperators(page, query);
        this.operatorsSignal[1](results);
      } else {
        const query: BannerSearchQuery = queryText
          ? { nameQuery: queryText }
          : {};
        const results = await this.bannerPort.searchBanners(page, query);
        this.bannersSignal[1](results);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load database content.";
      this.errorSignal[1](message);
    } finally {
      this.isLoadingSignal[1](false);
    }
  }
}
