import express, { type Express, type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { bot } from "./telegram";
import { config } from "../shared/config";
import { apiLimiter } from "./middleware/rate-limiter";
import { logger } from "./utils/logger";
import { requestLogger, errorLogger } from "./middleware/logger-middleware";

const PgSession = connectPg(session);

/**
 * Build and fully configure the Express app.
 *
 * Used by both the local dev entry (server/index.ts) and the Vercel handler
 * (api/index.ts). Does NOT call `listen()` and does not attach Vite middleware —
 * those concerns belong to the caller.
 */
export async function createApp(): Promise<{ app: Express; httpServer: any }> {
  const app = express();

  app.set("etag", false);

  // Security headers
  app.use((req, res, next) => {
    if (!config.ENABLE_SECURITY_HEADERS) return next();

    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://telegram.org https://cdn.jsdelivr.net; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "img-src 'self' data: https://telegram.org https://*.telegram.org https://*.supabase.co; " +
      "connect-src 'self' https://api.telegram.org https://*.supabase.co; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'; " +
      "frame-ancestors 'self' https://telegram.org https://*.telegram.org; " +
      "upgrade-insecure-requests;"
    );

    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=()"
    );

    if (config.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    }

    res.removeHeader("X-Powered-By");
    next();
  });

  // Body parsers (size-capped)
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: false, limit: "100kb" }));

  // Postgres-backed sessions — survives Vercel cold starts.
  // createTableIfMissing auto-provisions the `session` table on first run.
  app.use(
    session({
      store: new PgSession({
        conString: config.DATABASE_URL,
        tableName: "session",
        createTableIfMissing: true,
      }),
      secret: config.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: config.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
      },
    })
  );

  // Telegram webhook endpoint. Mounted BEFORE the /api rate-limiter so the bot
  // isn't throttled.
  //
  // node-telegram-bot-api's `processUpdate` emits events synchronously and does
  // not return a promise for async listeners, so on a serverless runtime the
  // function returns 200 before `handleStart` etc. have finished awaiting
  // (db query, `bot.sendMessage`…). The function is then frozen and the reply
  // never actually goes out. We intercept `bot.emit` for the duration of this
  // request, collect any promises the listeners return, and await them before
  // sending 200.
  app.post("/api/telegram/webhook", async (req, res) => {
    const pending: Promise<unknown>[] = [];
    const originalEmit = bot.emit.bind(bot);
    (bot as any).emit = (event: string, ...args: unknown[]) => {
      const listeners = bot.listeners(event);
      for (const listener of listeners) {
        try {
          const result = (listener as (...a: unknown[]) => unknown)(...args);
          if (result && typeof (result as Promise<unknown>).then === "function") {
            pending.push(
              (result as Promise<unknown>).catch((err) =>
                logger.error(`[Bot] listener for ${event} threw`, err),
              ),
            );
          }
        } catch (err) {
          logger.error(`[Bot] listener for ${event} threw sync`, err);
        }
      }
      return listeners.length > 0;
    };

    try {
      bot.processUpdate(req.body);
      await Promise.all(pending);
    } catch (err) {
      logger.error("[Bot] processUpdate failed", err);
    } finally {
      (bot as any).emit = originalEmit;
    }
    res.sendStatus(200);
  });

  // Request logging + rate limiting on /api/*
  app.use(requestLogger);
  app.use("/api", apiLimiter);

  // Disable caching on API responses
  app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Last-Modified", new Date().toUTCString());
    next();
  });

  // Register all API routes and get back the underlying http.Server
  const httpServer = await registerRoutes(app);

  // Error middleware
  app.use(errorLogger);
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message =
      config.NODE_ENV === "production" && status === 500
        ? "Internal Server Error"
        : err.message || "Internal Server Error";
    res.status(status).json({
      error: message,
      ...(config.NODE_ENV !== "production" && { stack: err.stack }),
    });
  });

  return { app, httpServer };
}
