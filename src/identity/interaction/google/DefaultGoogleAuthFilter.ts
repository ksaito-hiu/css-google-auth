import { GoogleAuthFilter } from './GoogleAuthFilter';

export class DefaultGoogleAuthFilter implements GoogleAuthFilter {
  async check(tokenSet: any): Promise<void> {
//console.log('GAHA: DefaultGoogleAuthFilter#check called.');
    return;
  }
}
