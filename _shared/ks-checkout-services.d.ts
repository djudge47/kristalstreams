export type CheckoutService = {customerId:string;username:string;connections:number;expiresAt:string|null};
export type CheckoutServices = {accountId:string;checkedAt:string;services:CheckoutService[];nextCursor:string|null};
export function readCheckoutServices(value:unknown,accountId:string,lookahead?:boolean):CheckoutServices;
