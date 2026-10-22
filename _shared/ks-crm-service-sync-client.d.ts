export type ServiceValues={package_name:string|null;connections_allowed:number;expiration_at:string|null;account_status:string;trial:boolean};
export type ServiceSyncItem={customerId:string;panelId:string;username:string;state:'pending'|'ready'|'matched'|'blocked'|'failed';reason:string|null;checkedAt:string|null;before:ServiceValues;after:ServiceValues|null};
export type ServiceSyncBatch={batchId:string;state:'reviewing'|'review_ready'|'applied';expiresAt:string;appliedAt:string|null;appliedCount:number;total:number;items:ServiceSyncItem[]};
export type ServiceSyncApi=(action:'create'|'review'|'apply'|'status',batchId:string,extra?:Record<string,unknown>)=>Promise<ServiceSyncBatch>;
export function syncUuid(value:unknown):value is string;
export function validateSyncBatch(batch:unknown):ServiceSyncBatch;
export function serviceSyncApi(options:{getToken:()=>Promise<string|null>;fetchImpl?:typeof fetch;signal?:AbortSignal}):ServiceSyncApi;
export function reviewServiceBatch(options:{batch:ServiceSyncBatch;api:ServiceSyncApi;signal?:AbortSignal;onBatch?:(batch:ServiceSyncBatch)=>void;onProgress?:(message:string)=>void}):Promise<ServiceSyncBatch>;
