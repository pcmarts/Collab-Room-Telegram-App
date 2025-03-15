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
  close(): void;
  ready(): void;
  web_app_request_fullscreen(): void;
}

interface Window {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
}