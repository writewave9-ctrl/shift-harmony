import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installGlobalErrorMonitor } from "./lib/logger";

installGlobalErrorMonitor();

createRoot(document.getElementById("root")!).render(<App />);
