export interface JWTPayload {
    userId: string;
    handle: string;
}
export declare function signAccess(payload: JWTPayload): string;
export declare function signRefresh(payload: JWTPayload): string;
export declare function verifyAccess(token: string): JWTPayload;
export declare function verifyRefresh(token: string): JWTPayload;
//# sourceMappingURL=jwt.d.ts.map