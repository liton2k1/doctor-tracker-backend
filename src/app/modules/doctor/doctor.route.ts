import { Router } from "express";
import { DoctorControllers } from "./doctor.controller";
import { PatientControllers } from "../patient/patient.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { validateQuery } from "../../middlewares/validateQuery";
import { uploadProfile } from "../../middlewares/uploadProfile";
import { Role } from "../user/user.interface";
import {
  createDoctorZodSchema,
  doctorQueryZodSchema,
  updateDoctorZodSchema,
} from "./doctor.validation";
import {
  createPatientZodSchema,
  doctorPatientQueryZodSchema,
} from "../patient/patient.validation";

const router = Router();

router.use(checkAuth(Role.ADMIN));

router.get("/meta/filters", DoctorControllers.getDoctorFilterOptions);

router.post(
  "/",
  uploadProfile,
  validateRequest(createDoctorZodSchema),
  DoctorControllers.createDoctor,
);
router.get(
  "/",
  validateQuery(doctorQueryZodSchema),
  DoctorControllers.getAllDoctors,
);

router.get("/:id", DoctorControllers.getSingleDoctor);
router.patch(
  "/:id",
  uploadProfile,
  validateRequest(updateDoctorZodSchema),
  DoctorControllers.updateDoctor,
);
router.delete("/:id", DoctorControllers.deleteDoctor);

router.get(
  "/:id/patients",
  validateQuery(doctorPatientQueryZodSchema),
  PatientControllers.getDoctorPatients,
);
router.post(
  "/:id/patients",
  uploadProfile,
  validateRequest(createPatientZodSchema),
  PatientControllers.createPatientForDoctor,
);
router.delete(
  "/:id/patients/:patientId",
  PatientControllers.deletePatientFromDoctor,
);

export const DoctorRoutes = router;
