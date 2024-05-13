import { PostGAccountGen } from './PostGAccountGen';

export class DefaultPostGAccountGen implements PostGAccountGen {
  async handle(accountId: string, googleId: string, tokenSet: any): Promise<void> {
//console.log('GAHA: DefaultPostGAccountGen#handle called.');
    return;
  }
}
