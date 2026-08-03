export { };

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        fullName?: string;
      };
      // Raw request body bytes, captured by express.json's verify hook — used
      // to verify Plaid webhook signatures (see plaid.webhook.ts).
      rawBody?: Buffer;
    }
  }
}

import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      email: string;
      fullName?: string;
    };
    rawBody?: Buffer;
  }
}
