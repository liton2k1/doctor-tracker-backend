import fs from "fs";
import path from "path";
import { envVars } from "../config";
import { UPLOAD_DIRECTORY } from "../config/multer";

export const getFileUrl = (filename: string) =>
  `${envVars.BACKEND_URL}/${UPLOAD_DIRECTORY}/${filename}`;

export const deleteUploadedFile = async (fileUrlOrPath?: string | null) => {
  if (!fileUrlOrPath) return;

  const filename = path.basename(fileUrlOrPath);
  if (!filename) return;

  try {
    await fs.promises.unlink(path.join(UPLOAD_DIRECTORY, filename));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.log("Failed to delete uploaded file :", error);
    }
  }
};
