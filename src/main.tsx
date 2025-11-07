import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";

// Initialize theme
const savedTheme = localStorage.getItem("theme") || "dark";
document.documentElement.classList.add(savedTheme);

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
