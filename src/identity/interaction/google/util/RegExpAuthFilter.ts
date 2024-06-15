import { GoogleAuthFilter } from '../GoogleAuthFilter';

/*
 * GoogleのOpenID Connectで得られるメールアドレスに
 * 与えられた正規表現をマッチさせて、マッチしたら通す
 * GoogleAuthFilterの実装。コンストラクタでは文字列で
 * 正規表現を受け取るので、バックシュラッシュはエスケープ
 * して「\\」としなければならないので注意。
 */
export class RegExpAuthFilter implements GoogleAuthFilter {
  private readonly regexp: RegExp;

  constructor(regexp: string, flug=undefined) {
    this.regexp = new RegExp(regexp,flug);
  }

  async check(tokenSet: any): Promise<void> {
    const email = tokenSet.claims().email;
    if (email.match(this.regexp)) {
      console.log('RegExpAuthFilter: OK. email=',email);
    } else {
      console.log('RegExpAuthFilter: email did not much. email=',email);
      throw new Error('RegExpAuthFilter: invalid email='+email);
    }
    return;
  }
}
