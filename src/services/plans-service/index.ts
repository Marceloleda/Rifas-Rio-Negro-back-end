import mercadoPagoMiddleware from "@/middlewares/mercado-pago-middleware";
import sellerRepository from "@/repositories/sellers-repository";
import { Response } from "express";
import httpStatus from "http-status";

async function updatePlanToBasic(res: Response, userId: number) {
    const user = await sellerRepository.findByUserId(userId)
    const body = {
        name_plan: "Basico",
        name_user:user.name,
        value: 29.90,
        email: user.email,
        cpf: user.cpf
    }
    try{
        return await mercadoPagoMiddleware.payment(res, body)
    }
    catch(error){
        console.log(error.message)
        return res.status(httpStatus.INTERNAL_SERVER_ERROR);
    }
}

async function updatePlanToPremium(res: Response, userId: number) {
    const user = await sellerRepository.findByUserId(userId)
    const body = {
        name_plan: "Premium",
        name_user:user.name,
        value: 79.90,
        email: user.email,
        cpf: user.cpf
    }

    try{
        const payment = await mercadoPagoMiddleware.payment(res, body)
        return payment
    }
    catch(error){
        console.log(error.message)
        return res.status(httpStatus.INTERNAL_SERVER_ERROR);
    }
}

const planService = {
    updatePlanToBasic,
    updatePlanToPremium
}
export default planService