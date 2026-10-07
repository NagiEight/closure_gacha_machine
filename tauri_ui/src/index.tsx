/* @refresh reload */
import './index.css';
import { render } from "solid-js/web";
import Home from "./presentation/pages/home";

render(() => <Home />, document.getElementById("root") as HTMLElement);
