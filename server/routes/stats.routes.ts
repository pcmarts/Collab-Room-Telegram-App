import { Router, type Request, type Response } from "express";
import { getNetworkStats } from "../services/stats.service";

const statsRouter = Router();

statsRouter.get("/network-stats", async (_req: Request, res: Response) => {
  try {
    const stats = await getNetworkStats();
    res.json(stats);
  } catch (error) {
    // Service layer already logged the error
    // Determine the status code based on the error message or type if needed
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch network statistics" });
  }
});

export default statsRouter; 