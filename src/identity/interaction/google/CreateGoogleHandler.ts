import { object, string } from 'yup';
import { getLoggerFor } from '@solid/community-server';
import { assertAccountId } from '@solid/community-server';
import type { JsonRepresentation } from '@solid/community-server';
import { JsonInteractionHandler } from '@solid/community-server';
import type { JsonInteractionHandlerInput } from '@solid/community-server';
import type { JsonView } from '@solid/community-server';
import { parseSchema, validateWithError } from '@solid/community-server';
import type { GoogleIdRoute } from './util/GoogleIdRoute';
import type { GoogleStore } from './util/GoogleStore';
import type { GoogleOIDC } from './GoogleOIDC';
import { SOLID_META } from '@solid/community-server';
import { DataFactory } from 'n3';
import namedNode = DataFactory.namedNode;
import type { GSessionStore } from './util/GSessionStore';

type OutType = { resource: string };

const inSchema = object({
  google_sub: string().required(),
});

/**
 * 
 */
export class CreateGoogleHandler extends JsonInteractionHandler<OutType> implements JsonView {
  private readonly logger = getLoggerFor(this);

  private readonly googleOIDC: GoogleOIDC;
  private readonly googleStore: GoogleStore;
  private readonly googleRoute: GoogleIdRoute;
  private readonly gSessionStore: GSessionStore;

  public constructor(googleOIDC: GoogleOIDC, googleStore: GoogleStore, googleRoute: GoogleIdRoute, gSessionStore: GSessionStore) {
    super();
    this.googleOIDC = googleOIDC;
    this.googleStore = googleStore;
    this.googleRoute = googleRoute;
    this.gSessionStore = gSessionStore;
  }

  public async getView({ accountId, json, metadata }: JsonInteractionHandlerInput): Promise<JsonRepresentation> {
    assertAccountId(accountId);
    const googleLogins: Record<string, string> = {};
    for (const { id, google_sub } of await this.googleStore.findByAccount(accountId)) {
      googleLogins[google_sub] = this.googleRoute.getPath({ accountId, googleId: id });
    }
    const { code_verifier, code_challenge } = this.googleOIDC.createCode();
    const params = {
      scope: 'openid email  profile',
      code_challenge,
      code_challenge_method: 'S256'
    };
    const goToUrl = this.googleOIDC.client.authorizationUrl(params);
    const cookie = metadata.get(namedNode('urn:npm:solid:community-server:http:accountCookie'),SOLID_META.ResponseMetadata)?.value;
    if (!cookie) {
      throw new Error('CreateGoogleHandler: no cookie.');
    }
    this.gSessionStore.set(cookie,'code_verifier',code_verifier);
    return { json: { ...parseSchema(inSchema), googleLogins, goToUrl }};
    // let res,json;
    // res = await fetch('http://localhost:3000/.account/account/d014c5d9-a780-494f-ac3a-10e8a821794f/login/google/');
    // json = await res.json();
  }

  public async handle({ accountId, json, metadata }: JsonInteractionHandlerInput): Promise<JsonRepresentation<OutType>> {
    const { google_sub } = await validateWithError(inSchema, json);
    assertAccountId(accountId);
    console.log("GAHA2: accountId=",accountId);

    const googleId = await this.googleStore.create(google_sub, accountId);
    const resource = this.googleRoute.getPath({ googleId, accountId });

    const cookie = metadata.get(namedNode('urn:npm:solid:community-server:http:accountCookie'),SOLID_META.ResponseMetadata)?.value;
    if (!cookie) {
      throw new Error('CreateGoogleHandler: no cookie.');
    }
    const code_verifier = await this.gSessionStore.get(cookie,'code_verifier');
console.log(code_verifier);

    return { json: { resource }};
    // let res,json;
    // res = await fetch('http://localhost:3000/.account/account/d014c5d9-a780-494f-ac3a-10e8a821794f/login/google/',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"google_sub":"1234"}'});
    // json = await res.json();
  }
}
