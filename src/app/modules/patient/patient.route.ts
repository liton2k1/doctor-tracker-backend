import { Router } from "express";
import { PatientControllers } from "./patient.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { validateQuery } from "../../middlewares/validateQuery";
import { uploadProfile } from "../../middlewares/uploadProfile";
import { Role } from "../user/user.interface";
import {
  patientQueryZodSchema,
  updatePatientZodSchema,
} from "./patient.validation";

const router = Router();

router.use(checkAuth(Role.ADMIN));

router.get("/meta/filters", PatientControllers.getPatientFilterOptions);

router.get(
  "/",
  validateQuery(patientQueryZodSchema),
  PatientControllers.getAllPatients,
);

router.get("/:id", PatientControllers.getSinglePatient);
router.patch(
  "/:id",
  uploadProfile,
  validateRequest(updatePatientZodSchema),
  PatientControllers.updatePatient,
);
router.delete("/:id", PatientControllers.deletePatient);

export const PatientRoutes = router;
