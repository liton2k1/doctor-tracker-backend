import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";

export const validateQuery =
  (zodSchema: ZodTypeAny) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedQuery = await zodSchema.parseAsync(req.query);
      Object.defineProperty(req, "query", {
        value: parsedQuery,
        writable: true,
        configurable: true,
        enumerable: true,
      });
      next();
    } catch (error) {
      next(error);
    }
  };
