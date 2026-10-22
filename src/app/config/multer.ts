import fs from "fs";
import path from "path";
import multer from "multer";
import httpStatus from "http-status-codes";
import AppError from "../helpers/AppError";

export const UPLOAD_DIRECTORY = "uploads";
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

fs.mkdirSync(UPLOAD_DIRECTORY, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `${UPLOAD_DIRECTORY}/`);
  },
  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

export const multerUpload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (
      !ALLOWED_EXTENSIONS.includes(extension) ||
      !ALLOWED_MIME_TYPES.includes(file.mimetype)
    ) {
      return cb(
        new AppError(
          httpStatus.BAD_REQUEST,
          "Only JPG, PNG or WebP images are allowed !",
        ),
      );
    }
    cb(null, true);
  },
});
