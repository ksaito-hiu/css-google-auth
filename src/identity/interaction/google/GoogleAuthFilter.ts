
export interface GoogleAuthFilter {
  check(tokenSet: any): Promise<void>;
}
