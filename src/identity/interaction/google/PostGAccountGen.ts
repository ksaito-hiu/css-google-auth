
export interface PostGAccountGen {
  handle(accountId: string, googleId: string, tokenSet: any): Promise<void>;
}
