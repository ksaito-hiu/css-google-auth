import { object, string } from 'yup';
import { getLoggerFor } from '@solid/community-server';
import type { AccountStore } from '@solid/community-server';
import type { CookieStore } from '@solid/community-server';
import type { JsonRepresentation } from '@solid/community-server';
import type { JsonInteractionHandlerInput } from '@solid/community-server';
import type { JsonView } from '@solid/community-server';
import type { LoginOutputType } from '@solid/community-server';
import { ResolveLoginHandler } from '@solid/community-server';
import { parseSchema, URL_SCHEMA, validateWithError } from '@solid/community-server';
import { GoogleStore } from './util/GoogleStore';
import { SOLID_META } from '@solid/community-server';
import { DataFactory } from 'n3';
import namedNode = DataFactory.namedNode;
import { GSessionStore } from './util/GSessionStore';
import { GoogleIdRoute } from './util/GoogleIdRoute';
import { GoogleOIDC, CGA } from './GoogleOIDC';

const inSchema = object({
  url:string().required(),
});

type OutType = { result: string };

export interface GoogleLoginHandlerArgs {
  googleOIDC: GoogleOIDC;
  accountStore: AccountStore;
  googleRoute: GoogleIdRoute;
  googleStore: GoogleStore;
  gSessionStore: GSessionStore;
  cookieStore: CookieStore;
}

/**
 * 
 */
export class GoogleLoginHandler extends ResolveLoginHandler implements JsonView {
  protected readonly logger = getLoggerFor(this);

  private readonly googleOIDC: GoogleOIDC;
  private readonly googleStore: GoogleStore;
  private readonly googleRoute: GoogleIdRoute;
  private readonly gSessionStore: GSessionStore;

  public constructor(args: GoogleLoginHandlerArgs) {
    super(args.accountStore, args.cookieStore);
    this.googleOIDC = args.googleOIDC;
    this.googleStore = args.googleStore;
    this.googleRoute = args.googleRoute;
    this.gSessionStore = args.gSessionStore;
  }

  public async getView(args: JsonInteractionHandlerInput): Promise<JsonRepresentation> {
    const { accountId, json, metadata } = args;
    const cookie = metadata.get(namedNode('urn:npm:solid:community-server:http:accountCookie'),SOLID_META.ResponseMetadata)?.value;
    if (!cookie) {
      throw new Error('GoogleLoginHandler: no cookie.');
    }
    const { code_verifier, code_challenge } = this.googleOIDC.createCode();
    this.gSessionStore.set(cookie,'code_verifier',code_verifier);
    const redirect_url = args.target; // http://localhost:3000/.account/login/google/ のはず
    const params = {
      scope: 'openid email  profile',
      code_challenge,
      code_challenge_method: 'S256',
      redirect_url
    };
    const goToUrl = this.googleOIDC.client.authorizationUrl(params);
    return { json: { ...parseSchema(inSchema), goToUrl }};
  }

  // 通常のResolveLoginHandlerのhandleメソッドの一番最初で以下のloginが呼び出される。
  // returnでaccountIdを返せば、あとのログイン操作はResolveLoginHandlerのhandleの残りの
  // プログラムがやってくれる。
  public async login(args: JsonInteractionHandlerInput): Promise<JsonRepresentation<LoginOutputType>> {
    const { json, metadata } = args;
    const { url } = await validateWithError(inSchema, json);
    const cookie = metadata.get(CGA.terms.cgaCookie)?.value;
    if (!cookie) {
      throw new Error('GoogleLoginHandler: no cookie.');
    }
    const code_verifier = await this.gSessionStore.get(cookie,'code_verifier');
    if (!code_verifier) {
      throw new Error('GoogleLoginHandler: no data of code_verifier.');
    }

    let sub = 'dummy';
    try {
      const queries = this.googleOIDC.client.callbackParams(url);
      const tokenSet = await this.googleOIDC.getTokenSet(queries,code_verifier);
      const claims = tokenSet.claims();
      sub = claims.sub;
      this.gSessionStore.delete(cookie,'code_verifier');
    } catch(err) {
      console.log("GoogleLoginHandler: err=",err);
    }
    const { accountId } = await this.googleStore.authenticate(sub);
    return { json: { accountId, remember: false }};
  }
}
