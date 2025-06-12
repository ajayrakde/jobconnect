import type { Express } from "express";
import { createServer, type Server } from "http";
import {
  demoUsers,
  demoCandidates,
  demoEmployers,
  demoJobPosts,
  demoApplications,
  demoShortlists,
  demoMatchScores,
  demoAdminInviteCodes,
} from "./demoData";

export async function registerDemoRoutes(app: Express): Promise<Server> {
  app.get("/api/users", (_req, res) => {
    res.json(demoUsers);
  });

  app.get("/api/candidates", (_req, res) => {
    res.json(demoCandidates);
  });

  app.get("/api/employers", (_req, res) => {
    res.json(demoEmployers);
  });

  app.get("/api/jobs", (_req, res) => {
    res.json(demoJobPosts);
  });

  app.get("/api/applications", (_req, res) => {
    res.json(demoApplications);
  });

  app.get("/api/shortlists", (_req, res) => {
    res.json(demoShortlists);
  });

  app.get("/api/match-scores", (_req, res) => {
    res.json(demoMatchScores);
  });

  app.get("/api/admin/invite-codes", (_req, res) => {
    res.json(demoAdminInviteCodes);
  });

  app.get("/api/admin/stats", (_req, res) => {
    const stats = {
      candidates: demoCandidates.length,
      jobs: demoJobPosts.length,
      matches: demoShortlists.length,
      matchRate:
        demoCandidates.length > 0
          ? Math.round((demoShortlists.length / demoCandidates.length) * 100)
          : 0,
    };
    res.json(stats);
  });

  const httpServer = createServer(app);
  return httpServer;
}
