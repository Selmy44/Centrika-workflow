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
    server.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(true); // Treat other errors as available, or handle differently
      }
    });
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port);
  });
}

async function findAvailablePort(startPort = 3001) {
  for (let p = startPort; p < startPort + 20; p++) {
    if (await isPortAvailable(p)) return p;
  }
  return startPort; // Fallback to startPort if all fail, let it crash naturally
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
    await connectDatabase();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ Database connection failed during startup:", msg);
    // Optionally exit if DB is required
    // process.exit(1);
  }

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
  
  // Just try to bind to the port. If it fails, let it crash so we know immediately.

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
