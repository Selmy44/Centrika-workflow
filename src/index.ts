import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { connectDatabase } from "./db";
import { appRouter } from "./router";
import { createContext } from "./core/context";

// port helper
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort = 3001) {
  for (let p = startPort; p < startPort + 20; p++) {
    if (await isPortAvailable(p)) return p;
  }
  throw new Error("No available port found");
}

async function start() {
  const app = express();
  const server = createServer(app);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // CORS: Allow cross-origin requests from the frontend
  const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim());

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  // Try to connect DB at startup
  try {
    connectDatabase();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn("[DB] Database connection note:", msg);
  }

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  const preferredPort = parseInt(process.env.PORT || "3001");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} busy, using ${port}`);
  }

  server.listen(port, () => {
    console.log(`✅ Centrika Backend running on http://localhost:${port}`);
    console.log(`   API endpoint: http://localhost:${port}/api/trpc`);
  });
}

start().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});

export type AppRouter = typeof appRouter;
