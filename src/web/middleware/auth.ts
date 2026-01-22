import { Request, Response, NextFunction } from "express";
import { env } from "../../config/env";

export function basicAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Bell Admin"');
    res.status(401).send("Authentication required");
    return;
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString(
    "utf-8",
  );
  const [username, password] = credentials.split(":");

  if (username === "admin" && password === env.ADMIN_PASSWORD) {
    next();
  } else {
    res.setHeader("WWW-Authenticate", 'Basic realm="Bell Admin"');
    res.status(401).send("Invalid credentials");
  }
}
