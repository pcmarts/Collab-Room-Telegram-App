import type { Express } from "express";
import { createServer } from "http";
import { supabase } from "../shared/supabase";
import { bot } from "./telegram";
import { z } from "zod";
import { insertCollaborationSchema, insertCompanySchema } from "../shared/schema";

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Auth endpoints
  app.post("/api/auth/telegram", async (req, res) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "telegram",
      options: {
        redirectTo: `${process.env.REPLIT_DOMAINS?.split(',')[0]}/auth/callback`
      }
    });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json(data);
  });

  // Companies endpoints
  app.get("/api/companies", async (req, res) => {
    const { data, error } = await supabase
      .from("companies")
      .select("*");

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json(data);
  });

  app.post("/api/companies", async (req, res) => {
    const validation = insertCompanySchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const { data, error } = await supabase
      .from("companies")
      .insert(validation.data)
      .select();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json(data[0]);
  });

  // Collaborations endpoints
  app.get("/api/collaborations", async (req, res) => {
    const { data, error } = await supabase
      .from("collaborations")
      .select(`
        *,
        host:users!host_id(*),
        company:companies(*),
        applicant:users!applicant_id(*)
      `);

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json(data);
  });

  app.post("/api/collaborations", async (req, res) => {
    const validation = insertCollaborationSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const { data, error } = await supabase
      .from("collaborations")
      .insert(validation.data)
      .select();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    // Notify via Telegram bot
    const collaboration = data[0];
    if (collaboration.host_id) {
      const { data: host } = await supabase
        .from("users")
        .select()
        .eq("id", collaboration.host_id)
        .single();

      if (host?.telegram_id) {
        await bot.sendMessage(
          host.telegram_id,
          `New collaboration created: ${collaboration.title}`
        );
      }
    }

    res.json(data[0]);
  });

  return httpServer;
}
