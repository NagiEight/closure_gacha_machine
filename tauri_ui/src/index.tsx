/* @refresh reload */
import './index.css';
import { render } from "solid-js/web";
import Home from "./presentation/pages/home";
import { OperatorApiAdapter } from './features/operator/infrastructure/cgm_adapter';
import { BannerApiAdapter } from './features/banner/infrastructure/cgm_adapter';
import { DatabaseExplorerService } from './presentation/services/DatabaseExplorerService';

const baseUrl = import.meta.env.VITE_BASE_URL;

// Instantiate infrastructure adapters with base URL from environment
const operatorAdapter = new OperatorApiAdapter(baseUrl);
const bannerAdapter = new BannerApiAdapter(baseUrl);

// Initialize application service with port dependencies
const databaseExplorerService = new DatabaseExplorerService(
  operatorAdapter,
  bannerAdapter
);

render(
  () => <Home databaseExplorerService={databaseExplorerService} />,
  document.getElementById("root") as HTMLElement
);
