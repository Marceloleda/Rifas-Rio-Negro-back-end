import authenticationService, { SignInParams } from "@/services/authentication-service";
import { Request, Response } from "express";
import httpStatus from "http-status";

export async function postSignIn(req: Request, res: Response){
    const { email, password_hash } = req.body as SignInParams;
    try{
        const result = await authenticationService.signIn({ email, password_hash });
        return res.status(httpStatus.OK).send({Token :result.token});

    }catch(error){
        return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
}