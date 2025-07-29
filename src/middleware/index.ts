import { Response } from 'express';

const sendError = (res: Response, message: string , statuCode=404) =>{
    return res.status(statuCode).json({
        success: false,
        message: message,
        statuCode: statuCode  
    });
};

const sendSuccess = (res: Response, message: string, data: any) => {
    return res.json({
        success: true,
        message: message,
        data: data
    });
};

const generateOTP = (length: any) => {
    let otp: any = [];
    
    for(let i = 0; i < length; i++){
        let generatotp = Math.round(Math.random() * 9);
        otp += generatotp;
    }
    
    return otp;
    };




export {
    sendError,
    sendSuccess,
    generateOTP
};