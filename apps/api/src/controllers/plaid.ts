import type { NextFunction, Request, Response } from "express";
import { CountryCode, LinkTokenCreateRequest, Products } from "plaid";
import { plaidClient } from "../lib/plaidClient";



export async function createLinkToken(req: Request, res: Response, next: NextFunction){

    try{
        const userId = req.user!.id;

        const plaidReq: LinkTokenCreateRequest = {
            user: { client_user_id: userId },
            client_name: "Finapse",
            products: [Products.Transactions],
            language: "en",
            country_codes: [CountryCode.Us],
          };

          const { data } = await plaidClient.linkTokenCreate(plaidReq);
          return res.json({ link_token: data.link_token });


    }catch(err){
        return next(err)
    }

}