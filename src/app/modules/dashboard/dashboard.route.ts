import { Router } from "express";
import { DashboardControllers } from "./dashboard.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateQuery } from "../../middlewares/validateQuery";
import { Role } from "../user/user.interface";
import {
  distributionsQueryZodSchema,
  patientsPerDoctorQueryZodSchema,
  timelineQueryZodSchema,
} from "./dashboard.validation";

const router = Router();

router.use(checkAuth(Role.ADMIN));

router.get("/overview", DashboardControllers.getOverview);
router.get(
  "/patients-per-doctor",
  validateQuery(patientsPerDoctorQueryZodSchema),
  DashboardControllers.getPatientsPerDoctor,
);
router.get(
  "/timeline",
  validateQuery(timelineQueryZodSchema),
  DashboardControllers.getTimeline,
);
router.get(
  "/distributions",
  validateQuery(distributionsQueryZodSchema),
  DashboardControllers.getDistributions,
);

export const DashboardRoutes = router;
