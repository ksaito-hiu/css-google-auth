import { boolean, object, string } from 'yup';
import { getLoggerFor } from '@solid/community-server';
import type { AccountStore } from '@solid/community-server';
import type { CookieStore } from '@solid/community-server';
import type { JsonRepresentation } from '@solid/community-server';
import type { JsonInteractionHandlerInput } from '@solid/community-server';
import type { JsonView } from '@solid/community-server';
import type { LoginOutputType } from '@solid/community-server';
import { ResolveLoginHandler } from '@solid/community-server';
import { parseSchema, URL_SCHEMA, validateWithError } from '@solid/community-server';
import type { GoogleStore } from './util/GoogleStore';
import { SOLID_META } from '@solid/community-server';
import { DataFactory } from 'n3';
import namedNode = DataFactory.namedNode;
import type { GSessionStore } from './util/GSessionStore';
import type { GoogleIdRoute } from './util/GoogleIdRoute';
import type { GoogleOIDC } from './GoogleOIDC';

const inSchema = object({
  google_sub: string().required(),
});

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

  public async getView({ metadata }: JsonInteractionHandlerInput): Promise<JsonRepresentation> {
    const cookie = metadata.get(namedNode('urn:npm:solid:community-server:http:accountCookie'),SOLID_META.ResponseMetadata)?.value;
    if (!cookie) {
      throw new Error('GoogleLoginHandler: no cookie.');
    }
    const code_verifier = 'abcdefg'+(new Date()).toISOString();
    this.gSessionStore.set(cookie,'code_verifier',code_verifier);
console.log('GAHA: cookie=',cookie);
    return { json: parseSchema(inSchema) };
    // let res,json;
    // res = await fetch('http://localhost:3000/.account/login/google/');
    // json = await res.json();
  }

  public async login({ json, metadata }: JsonInteractionHandlerInput): Promise<JsonRepresentation<LoginOutputType>> {
    const { google_sub } = await validateWithError(inSchema, json);
    // Try to log in, will error if email/password combination is invalid
    //const { accountId } = await this.googleStore.authenticate(google_sub);
const accountId = 'gaha';
    //this.logger.debug(`Logging in user ${google_sub}`);

    const cookie = metadata.get(namedNode('urn:npm:solid:community-server:http:accountCookie'),SOLID_META.ResponseMetadata)?.value;
    if (!cookie) {
      throw new Error('GoogleLoginHandler: no cookie.');
    }
    const code_verifier = await this.gSessionStore.get(cookie,'code_verifier');
console.log('GAHA: code_verifier=',code_verifier);

    return { json: { accountId }};
    // let res,json;
    // res = await fetch('http://localhost:3000/.account/login/google/',
    //  {method:'POST',headers:{'Content-Type':'application/json'},body:'{"google_sub":"12345"}'});
    // json = await res.json();
  }
}
