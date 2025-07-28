// import 'dotenv/config'; // Not needed for Azure, use portal env vars
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import cors from "cors";

const app = express();
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://zealous-mud-0c4ecc40f.2.azurestaticapps.net"
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(session({
  secret: process.env['SESSION_SECRET'] || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Always false for local development
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup vite in development and static files in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // SPA fallback route - this should be after API routes but before error handler
  app.get("*", (req, res) => {
    if (!req.path.startsWith('/api')) {
      // For client-side routing
      res.sendFile('index.html', { root: 'dist' });
    }
  });

  // Default port configuration
  const defaultPort = 5000;
  const PORT = process.env['PORT'] || defaultPort;
  
  // In development, use localhost instead of 0.0.0.0
  const host = process.env['NODE_ENV'] === 'development' ? 'localhost' : '0.0.0.0';
  
  // Try to start the server, with fallback to alternative port if needed
  const startServer = (port: number) => {
    server.listen(port, host)
      .on('listening', () => {
        log(`✅ Server running on ${host}:${port}`);
      })
      .on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          if (port === defaultPort) {
            log(`⚠️ Port ${port} is in use, trying alternative port ${port + 1}...`);
            startServer(port + 1);
          } else {
            log(`❌ Port ${port} is also in use. Please close applications using these ports or set a different PORT in .env`);
            process.exit(1);
          }
        } else {
          log(`❌ Failed to start server: ${err.message}`);
          throw err;
        }
      });
  };
  
  startServer(Number(PORT));
})();
