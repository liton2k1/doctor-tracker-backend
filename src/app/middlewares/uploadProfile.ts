import fs from "fs";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import AppError from "../helpers/AppError";
import { multerUpload } from "../config/multer";
import { deleteUploadedFile } from "../utils/fileHelpers";

const upload = multerUpload.single("file");

const hasImageSignature = async (filePath: string) => {
  const handle = await fs.promises.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(12);
    await handle.read(buffer, 0, 12, 0);

    const isJpeg =
      buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer
      .subarray(0, 4)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    const isWebp =
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP";

    return isJpeg || isPng || isWebp;
  } finally {
    await handle.close();
  }
};

export const uploadProfile = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  upload(req, res, async (error: unknown) => {
    if (error) return next(error);
    if (!req.file) return next();

    try {
      if (!(await hasImageSignature(req.file.path))) {
        await deleteUploadedFile(req.file.path);
        req.file = undefined;
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Uploaded file is not a valid image !",
        );
      }
      next();
    } catch (err) {
      next(err);
    }
  });
};
