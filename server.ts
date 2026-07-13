import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import http from "http";
import apiApp from "./api/index.js";

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  const httpServer = http.createServer(app);

  // Mount API routes
  app.use(apiApp);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Use *all for Express 5 compatibility if applicable, otherwise * works for Express 4.
    // Express 4 uses '*', let's check package.json -> ^4.21.2
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
