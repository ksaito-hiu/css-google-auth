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
  req: string().trim().min(1).required(),
  input: string().trim().min(1).required(),
});

/**
 * 
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
a = await fetch('http://localhost:3000/.account/google/oidc/',{method:'POST',headers: {'Content-Type':'application/json'},body:'{"req":"abcdefg","input":"hijklmn"}'});
*/
  public async handle(args: JsonInteractionHandlerInput): Promise<JsonRepresentation<OutType>> {
    const { req, input } = await validateWithError(inSchema, args.json);
    let accountId = args.accountId;
    const json = { response: 'dummy' };
    const metadata = args.metadata;

    // まず、Cookieが無い時は作る。必要なら空のaccountも作る。
    // Cookieの扱いはResolveLoginHandlerから類推して作ってる。
    let cookie = metadata.get(CGA.terms.cgaCookie)?.value;
    if (!cookie) {
      cookie = v4();
      metadata.add(CGA.terms.cgaCookie, cookie);
      //metadata.add(CGA.terms.cgaCookieExpiration, 3*60*60);
    }

    if (req === 'getGoToUrl') {
console.log("GAHA: ******************************LLLLLLLLLLLLLLLLLLLLLL");
      // Google認証へのリンク作成。
      const { code_verifier, code_challenge } = this.googleOIDC.createCode();
      this.gSessionStore.set(cookie,'code_verifier',code_verifier);
      const redirect_url = (JSON.parse(input)).redirect_url;
      //const redirect_url = 'http://localhost:3000/.account/login/google/oidc/';
      const params = {
        scope: 'openid email profile',
        code_challenge,
        code_challenge_method: 'S256',
        redirect_url
      };
      json.response = this.googleOIDC.client.authorizationUrl(params);
    } else if (req === 'authorize') {
console.log("GAHA: ******************************MMMMMMMMMMMMMMMMMMMMMMMMMM");
      const code_verifier = await this.gSessionStore.get(cookie,'code_verifier');
      const url = new URL((JSON.parse(input)).url);
      const callback = url.origin + ((url.port)?(':'+url.port):'') + url.pathname;
      const queries = this.googleOIDC.client.callbackParams(url.href);
      const tokenSet = await this.googleOIDC.client.callback(callback,queries,{ code_verifier });
      const claims = tokenSet.claims();
      const sub = claims.sub;
      this.gSessionStore.delete(cookie,'code_verifier');
      const res = {
        authorized: true,
      };
      json.response = JSON.stringify(res);
    } else if (req === 'new_account') {
console.log("GAHA: ******************************NNNNNNNNNNNNNNNNNNNNNNNNNN");
      const code_verifier = await this.gSessionStore.get(cookie,'code_verifier');
      const url = new URL((JSON.parse(input)).url);
      const callback = url.origin + ((url.port)?(':'+url.port):'') + url.pathname;
      const queries = this.googleOIDC.client.callbackParams(url.href);
      const tokenSet = await this.googleOIDC.client.callback(callback,queries,{ code_verifier });
      const claims = tokenSet.claims();
      const sub = claims.sub;
      this.gSessionStore.delete(cookie,'code_verifier');
      accountId = await this.accountStore.create();
      this.googleStore.create(sub,accountId);
      const res = {
        created: true,
      };
      json.response = JSON.stringify(res);
    } else {
console.log("GAHA: ******************************OOOOOOOOOOOOOOOOOOOOOOOOOO");
      const res = {
        dummy: true
      };
      json.response = JSON.stringify(res);
    }

    return { json, metadata };
  }
}
