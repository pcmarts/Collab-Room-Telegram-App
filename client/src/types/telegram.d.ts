interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id: string;
    user: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    auth_date: string;
    hash: string;
  };
  
  // App control methods
  close(): void;
  ready(): void;
  expand(): void;
  
  // View properties
  viewportHeight?: number;
  viewportStableHeight?: number;
  isExpanded?: boolean;
  
  // Theme methods and properties
  themeParams?: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
  
  // Haptic feedback methods
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  
  // Event handlers
  onEvent(eventType: string, eventHandler: Function): void;
  offEvent(eventType: string, eventHandler: Function): void;
  isVersionAtLeast(version: string): boolean;
}

interface Window {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
}
