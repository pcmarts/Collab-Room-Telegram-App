import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Function to remove the initial HTML splash screen after React takes over
const removeHtmlSplashScreen = () => {
  const splashScreen = document.getElementById('splash-screen');
  if (splashScreen) {
    // Fade out the static HTML splash screen
    splashScreen.style.opacity = '0';
    splashScreen.style.transition = 'opacity 0.3s ease';
    
    // Remove it from the DOM after fade-out completes
    setTimeout(() => {
      splashScreen.remove();
    }, 300);
  }
};

// Render the React app as quickly as possible
const rootElement = document.getElementById("root");
if (rootElement) {
  // Create root and render App immediately
  createRoot(rootElement).render(<App />);
  
  // Only after React has mounted, remove the HTML splash screen
  setTimeout(removeHtmlSplashScreen, 100);
}
