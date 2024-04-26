import { object, string } from 'yup';
import { getLoggerFor } from '@solid/community-server';
import type { JsonRepresentation } from '@solid/community-server';
import { JsonInteractionHandler } from '@solid/community-server';
import type { JsonInteractionHandlerInput } from '@solid/community-server';
import type { JsonView } from '@solid/community-server';
import { parseSchema, validateWithError } from '@solid/community-server';
import { AccountStore } from '@solid/community-server';
import { GoogleStore } from './util/GoogleStore';
import { GoogleOIDC, CGA } from './GoogleOIDC';
import { SOLID_HTTP } from '@solid/community-server';
import { DataFactory } from 'n3';
import namedNode = DataFactory.namedNode;
import { GSessionStore } from './util/GSessionStore';
import { CookieStore } from '@solid/community-server';
import { v4 } from 'uuid';

type OutType = { response: string };

const inSchema = object({
  func: string().trim().min(1).required(),
  stage: string().trim().min(1).required(),
});

/**
 * GoogleのOIDCを処理するためのAPI。ただ、すべてをここに集約することはできなくて、
 * Google認証が通たかどうかの判定はGoogleLoginHandlerやCreateGoogleHandler内で
 * 行わないといけない。このGoogleOIDCHandlerの機能は以下の2つ。
 * 
 * 機能1: 無ければcga-cookieを設定し、このCookieにひもづけてGoogle認証の正当性を
 * 確認するためのcode_verifierと、ユーザーの状態(stage)をGSessionStoreに保存し、
 * accounts.google.comへのパラメータ付きURLを生成し返すこと。Googleログイン画面の
 * HTMLページとか、アカウントにGoogleアカウントを連携させるHTMLページ
 * から呼び出されることを想定。入力例は {func:'makeUrl',stage:'login' } とか
 * {func:'makeUrl',stage:'create'} とか。返り値は
 * { response: 'https://accounts.google.com/o/oauth2/v2/・・・' } という感じ。
 * 
 * 機能2: Googleからのcallbackを受け取った時にユーザがどの状態(stage: loginとかcreate)かを
 * GSessionStoreから取り出して返す機能。OIDCのHTMLページから呼び出されることを想定。
 * その状態に応じてOIDCのHTMLページのJavaScriptの機能でurlのパラメータを
 * 付けたまま適切なページにリダイレクトさせる。入力例は {func:'getStage',stage:'dummy'} の
 * 1通りで、返り値は { response: 'login' } とか { response: 'create' } という感じ。
 */
export class GoogleOIDCHandler extends JsonInteractionHandler implements JsonView {
  private readonly logger = getLoggerFor(this);

  private readonly accountStore: AccountStore;
  private readonly googleOIDC: GoogleOIDC;
  private readonly googleStore: GoogleStore;
  private readonly gSessionStore: GSessionStore;
  private readonly cookieStore: CookieStore;

  public constructor(accountStore: AccountStore, googleOIDC: GoogleOIDC, googleStore: GoogleStore, gSessionStore: GSessionStore, cookieStore: CookieStore) {
    super();
    this.accountStore = accountStore;
    this.googleOIDC = googleOIDC;
    this.googleStore = googleStore;
    this.gSessionStore = gSessionStore;
    this.cookieStore = cookieStore;
  }

  public async getView(args: JsonInteractionHandlerInput): Promise<JsonRepresentation> {
    return { json: parseSchema(inSchema) };
  }

/*
a = await fetch('http://localhost:3000/.account/google/oidc/',{method:'POST',headers: {'Content-Type':'application/json'},body:'{"func":"abcdefg","stage":"hijklmn"}'});
*/
  public async handle(args: JsonInteractionHandlerInput): Promise<JsonRepresentation<OutType>> {
    const { func, stage } = await validateWithError(inSchema, args.json);
    let accountId = args.accountId;
    const json = { response: 'dummy' };
    const metadata = args.metadata;

    // まず、Cookieが無い時は作る。
    // Cookieの扱いはResolveLoginHandlerから類推して作ってる。
    let cookie = metadata.get(CGA.terms.cgaCookie)?.value;
    if (!cookie) {
      cookie = v4();
      metadata.add(CGA.terms.cgaCookie, cookie);
      //metadata.add(CGA.terms.cgaCookieExpiration, 3*60*60);
    }

    if (func === 'makeUrl') {
console.log("GAHA: ******************************MMMMMMMMMMMMMMMMMMMMMM");
      const { code_verifier, code_challenge } = this.googleOIDC.createCode();
      this.gSessionStore.set(cookie,'code_verifier',code_verifier);
      this.gSessionStore.set(cookie,'stage',stage);
      const redirect_url = args.target.path; // 'http://localhost:3000/.account/google/oidc/';
      const params = {
        scope: 'openid email profile',
        code_challenge,
        code_challenge_method: 'S256',
        redirect_url
      };
      json.response = this.googleOIDC.client.authorizationUrl(params);
    } else if (func === 'getStage') {
console.log("GAHA: ******************************NNNNNNNNNNNNNNNNNNNNNNNNNN");
      const stage = await this.gSessionStore.get(cookie,'stage');
      json.response = stage ?? 'undefined';
    } else {
console.log("GAHA: ******************************OOOOOOOOOOOOOOOOOOOOOOOOOO");
      json.response = 'error in GoogleOIDCHandler#handle.';
    }

    return { json, metadata };
  }
}
