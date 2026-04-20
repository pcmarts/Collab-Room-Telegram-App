/**
 * Vercel serverless function entry.
 *
 * Wraps the Express app built by server/app.ts and exports a handler that
 * Vercel invokes for every request matched by vercel.json rewrites (/api/*).
 *
 * The Express app itself is cached on the module level so it's only built
 * once per container — subsequent invocations on the same warm container
 * reuse it and skip the middleware setup cost.
 */
import type { IncomingMessage, ServerResponse } from "http";
import { createApp } from "../server/app";
import { ensureWebhookConfigured } from "../server/telegram";

type AppHandler = (req: IncomingMessage, res: ServerResponse) => void;

let appPromise: Promise<AppHandler> | null = null;

function getApp(): Promise<AppHandler> {
  if (!appPromise) {
    appPromise = (async () => {
      const { app } = await createApp();
      // Fire-and-forget — a webhook registration failure shouldn't block the
      // container from serving requests.
      ensureWebhookConfigured().catch((err) => {
        console.error("[Vercel] ensureWebhookConfigured failed:", err);
      });
      return app as unknown as AppHandler;
    })();
  }
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getApp();
  return app(req, res);
}
