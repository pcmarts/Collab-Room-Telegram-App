interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  share: (text: string) => Promise<boolean>;
  openTelegramLink: (url: string) => void;
  MainButton: {
    show: () => void;
    hide: () => void;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive: boolean) => void;
    hideProgress: () => void;
    isActive: boolean;
    isVisible: boolean;
    text: string;
  };
  HapticFeedback: {
    impactOccurred: (style: string) => void;
    notificationOccurred: (type: string) => void;
    selectionChanged: () => void;
  };
  initData: string;
  version: string;
  viewportHeight: number;
  viewportStableHeight: number;
  isExpanded: boolean;
  colorScheme: string;
  themeParams: {
    bg_color: string;
    text_color: string;
    hint_color: string;
    link_color: string;
    button_color: string;
    button_text_color: string;
    secondary_bg_color: string;
  };
  onEvent(eventName: string, eventHandler: () => void): void;
  offEvent(eventName: string, eventHandler: () => void): void;
  sendData(data: string): void;
  openLink(url: string): void;
}

interface Window {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
}