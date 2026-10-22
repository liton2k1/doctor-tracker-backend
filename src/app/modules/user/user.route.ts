import { Router } from "express";
import { UserControllers } from "./user.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { checkAuth } from "../../middlewares/checkAuth";
import { uploadProfile } from "../../middlewares/uploadProfile";
import { createUserZodSchema, updateProfileZodSchema } from "./user.validation";
import { Role } from "./user.interface";

const router = Router();

router.post(
  "/register",
  uploadProfile,
  validateRequest(createUserZodSchema),
  UserControllers.createUser,
);

router.patch(
  "/me",
  checkAuth(...Object.values(Role)),
  uploadProfile,
  validateRequest(updateProfileZodSchema),
  UserControllers.updateMyProfile,
);

export const UserRoutes = router;
