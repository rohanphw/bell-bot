import express from "express";
import { env } from "../config/env";
import { basicAuth } from "./middleware/auth";
import apiRoutes from "./routes/api";
import pageRoutes from "./routes/pages";

export function createWebServer() {
  const app = express();

  // Apply basic auth to all routes
  app.use(basicAuth);

  // API routes
  app.use("/api", apiRoutes);

  // Page routes
  app.use(pageRoutes);

  return app;
}

export function startWebServer() {
  const app = createWebServer();

  app.listen(env.PORT, () => {
    console.log(`Admin panel running at http://localhost:${env.PORT}`);
  });
}
