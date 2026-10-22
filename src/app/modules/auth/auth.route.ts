import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AuthControllers } from "./auth.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { checkAuth } from "../../middlewares/checkAuth";
import { loginZodSchema } from "./auth.validation";
import { Role } from "../user/user.interface";
import { envVars } from "../../config";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: envVars.NODE_ENV === "production" ? 10 : 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});

router.post(
  "/login",
  loginLimiter,
  validateRequest(loginZodSchema),
  AuthControllers.userLogin,
);
router.post("/logout", AuthControllers.logout);
router.get("/me", checkAuth(...Object.values(Role)), AuthControllers.getMe);

export const AuthRoutes = router;
