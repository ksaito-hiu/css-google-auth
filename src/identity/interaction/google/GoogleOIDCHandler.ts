import { object, string } from 'yup';
import { getLoggerFor } from '@solid/community-server';
import type { JsonRepresentation } from '@solid/community-server';
import { JsonInteractionHandler } from '@solid/community-server';
import type { JsonInteractionHandlerInput } from '@solid/community-server';
import type { JsonView } from '@solid/community-server';
import { parseSchema, validateWithError } from '@solid/community-server';
import { GoogleStore } from './util/GoogleStore';
import { GoogleOIDC, CGA } from './GoogleOIDC';
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
 * Google認証が通ったかどうかの判定はGoogleLoginHandlerやCreateGoogleHandler内で
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

  private readonly googleOIDC: GoogleOIDC;
  private readonly gSessionStore: GSessionStore;

  public constructor(googleOIDC: GoogleOIDC, gSessionStore: GSessionStore) {
    super();
    this.googleOIDC = googleOIDC;
    this.gSessionStore = gSessionStore;
  }

  public async getView(args: JsonInteractionHandlerInput): Promise<JsonRepresentation> {
    return { json: parseSchema(inSchema) };
  }

/*

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
      const { code_verifier, code_challenge } = this.googleOIDC.createCode();
      this.gSessionStore.set(cookie,'code_verifier',code_verifier);
      this.gSessionStore.set(cookie,'stage',stage);
      //const redirect_url = args.target.path;
      const params = {
        scope: 'openid email profile',
        code_challenge,
        code_challenge_method: 'S256',
        //redirect_url
      };
      json.response = this.googleOIDC.client.authorizationUrl(params);
    } else if (func === 'getStage') {
      const stage = await this.gSessionStore.get(cookie,'stage');
      json.response = stage ?? 'undefined';
    } else {
      json.response = 'error in GoogleOIDCHandler#handle.';
    }

    return { json, metadata };
  }
}
