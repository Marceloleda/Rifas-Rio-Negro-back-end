import { forbiddenError, notFoundError, unauthorizedError } from "@/errors";
import { createRaffle } from "@/protocols";
import planRepository from "@/repositories/plans-repository";
import rafflesRepository from "@/repositories/raffles-repository";
import { raffles, sellers } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import dayjs from "dayjs";
import { Response } from "express";
import httpStatus from "http-status";


function isDecimalNumber(value: any) {
    if(!isNaN(value)) {
        if(parseInt(value) != parseFloat(value)) {
            return true;
      }
    }   
    return false;
}

function shuffleNumber(number: number) {
    const array = [];
    
    for (let i = number; i > 0; i--) {
        const paddedNumber = i.toString().padStart(String(number).length, '0');
        array.push(Number(paddedNumber));
    }
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
  
    return array
}
  
  

async function raffleCreate(res: Response, data:createRaffle, userId: number) { 
    const date = dayjs();
    if(!userId) throw unauthorizedError()
      
    const decimal: Decimal = new Decimal(data.ticket_price)

    if(!isDecimalNumber(decimal)){
        return res.status(httpStatus.BAD_REQUEST).send("Price must be a decimal")
    }

    const sellers: Omit<sellers,'password_hash' | 'updated_at'> & { raffles: raffles[];} = 
    await rafflesRepository.findSellerAndRafflesByUserId(userId)

    if(!sellers) throw notFoundError();

    const planBasic = await planRepository.findPlanBasic()
    const planPremium = await planRepository.findPlanPremium()
    const planMaster = await planRepository.findPlanMegaRifa()

    //plano Basico
    if(sellers.plan_id === planBasic.id){
        // const isDayExpired = (date: string) => dayjs().date() === dayjs(date).date() ? 
        // false : dayjs().isAfter(dayjs(date));  implementar isso na funcao onde desativa a campanha NA HORA DE BUSCAR AS CAMPANHAS
        const expireAt = date.add(planBasic.campaign_duration, 'day').format('DD-MM-YYYY hh:mm');

        const raffleData = {
            ...data,
            seller_id: userId,
            expire_at: expireAt
        };
        if(!raffleData) throw notFoundError();
        if(sellers.total_ticket_plan === 0){
            throw forbiddenError("Renew or upgrade your plan.")
        }
        if(raffleData.total_tickets > sellers.total_ticket_plan){
            throw forbiddenError("You need to change plans to perform this action (tickets).")
        }
        if(sellers.raffles.length >= planBasic.max_campaigns){
            throw forbiddenError("You need to change plans to perform this action (raffles length).")
        }
        const balance: number = sellers.total_ticket_plan - raffleData.total_tickets
        await rafflesRepository.updateTotalTickets(userId,balance)
        const raffleCreated = await rafflesRepository.createRaffles(raffleData)
        const shuffledArray = shuffleNumber(raffleData.total_tickets);
        await rafflesRepository.createShuffleNumbers(raffleCreated.id, shuffledArray, userId)
        return raffleCreated 
    }

    //plano Premium
    if(sellers.plan_id === planPremium.id){
        const expireAt = date.add(planPremium.campaign_duration, 'day').format('DD-MM-YYYY hh:mm');
        const raffleData = {
            ...data,
            seller_id: userId,
            expire_at: expireAt
        };
        if(!raffleData) throw notFoundError();
        if(sellers.total_ticket_plan === 0){
            throw forbiddenError("Renew or upgrade your plan.")
        }
        if(raffleData.total_tickets > sellers.total_ticket_plan){
            throw forbiddenError("You need to change plans to perform this action (tickets).")
        }
        if(sellers.raffles.length >= planPremium.max_campaigns){
            throw forbiddenError("You need to change plans to perform this action (raffles length).")
        }
        const raffleCreated = await rafflesRepository.createRaffles(raffleData)
        const shuffledArray = shuffleNumber(raffleData.total_tickets);
        await rafflesRepository.createShuffleNumbers(raffleCreated.id, shuffledArray, userId)
        return raffleCreated 
    }

    //plano Master
    if(sellers.plan_id === planMaster.id){
        const expireAt = date.add(planMaster.campaign_duration, 'day').format('DD-MM-YYYY hh:mm');
        const raffleData = {
            ...data,
            seller_id: userId,
            expire_at: expireAt
        };

        if(!raffleData) throw notFoundError();
        if(sellers.total_ticket_plan === 0){
            throw forbiddenError("Renew or upgrade your plan.")
        }
        if(raffleData.total_tickets > sellers.total_ticket_plan){
            throw forbiddenError("You need to change plans to perform this action (tickets).")
        }
        if(sellers.raffles.length >= planMaster.max_campaigns){
            throw forbiddenError("You need to change plans to perform this action (raffles length).")
        }
        
        const raffleCreated = await rafflesRepository.createRaffles(raffleData)
        const shuffledArray = shuffleNumber(raffleData.total_tickets);
        await rafflesRepository.createShuffleNumbers(raffleCreated.id, shuffledArray, userId)

        return raffleCreated 
    }
}
const raffleService = {
    raffleCreate,
};
export default raffleService;