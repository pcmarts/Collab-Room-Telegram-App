type TelegramWebApp = {
  colorScheme?: "light" | "dark";
  themeParams?: {
    bg_color?: string;
    header_bg_color?: string;
    secondary_bg_color?: string;
  };
  onEvent?: (event: string, handler: () => void) => void;
  offEvent?: (event: string, handler: () => void) => void;
};

type TelegramAware = {
  Telegram?: { WebApp?: TelegramWebApp };
};

function applyScheme(scheme: "light" | "dark") {
  const root = document.documentElement;
  if (scheme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

function applyBridgeColors(params?: TelegramWebApp["themeParams"]) {
  if (!params) return;
  const root = document.documentElement;
  if (params.bg_color) root.style.setProperty("--tg-bg", params.bg_color);
  if (params.header_bg_color)
    root.style.setProperty("--tg-header", params.header_bg_color);
}

function detectPrefersDark() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export function initTelegramTheme(): () => void {
  const tg = (window as unknown as TelegramAware).Telegram?.WebApp;

  if (!tg) {
    applyScheme(detectPrefersDark() ? "dark" : "light");
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) =>
      applyScheme(e.matches ? "dark" : "light");
    mq?.addEventListener?.("change", listener);
    return () => mq?.removeEventListener?.("change", listener);
  }

  const sync = () => {
    applyScheme(tg.colorScheme === "dark" ? "dark" : "light");
    applyBridgeColors(tg.themeParams);
  };

  sync();
  tg.onEvent?.("themeChanged", sync);
  return () => tg.offEvent?.("themeChanged", sync);
}
