import { Errback, NextFunction, Request, Response } from "express";

const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(err.stack);
  res.status(500).json({
    status: 500,
    message: "Something went wrong",
    error: err.message,
  });
};
export default errorMiddleware;
