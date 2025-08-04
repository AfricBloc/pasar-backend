import { Response } from "express";

const sendError = (res: Response, message: string, statusCode = 404) => {
  return res.status(statusCode).json({
    success: false,
    message: message,
    statusCode: statusCode,
  });
};

const sendSuccess = (
  res: Response,
  message: string,
  data: any,
  statusCode: number = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message: message,
    data: data,
    statusCode: statusCode,
  });
};

const generateOTP = (length: any) => {
  let otp: any = [];

  for (let i = 0; i < length; i++) {
    let generatotp = Math.round(Math.random() * 9);
    otp += generatotp;
  }

  return otp;
};

export { sendError, sendSuccess, generateOTP };
