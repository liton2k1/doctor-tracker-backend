import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import router from "./app/routes";
import { envVars } from "./app/config";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import { notFound } from "./app/middlewares/notFound";

const app: Application = express();

// Middlewares
app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: [envVars.FRONTEND_URL],
    credentials: true,
  }),
);

// Static Files
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/v1", router);

// Application Route
app.get("/", (req: Request, res: Response) => {
  res.send({
    success: true,
    message: "Server is running successfully",
  });
});

// Not Found Route
app.use(notFound);

// Global Error Handler
app.use(globalErrorHandler);

export default app;
