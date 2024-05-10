import { object, string } from 'yup';
import { getLoggerFor } from '@solid/community-server';
import { assertAccountId } from '@solid/community-server';
import type { JsonRepresentation } from '@solid/community-server';
import { JsonInteractionHandler } from '@solid/community-server';
import type { JsonInteractionHandlerInput } from '@solid/community-server';
import type { JsonView } from '@solid/community-server';
import { parseSchema, validateWithError } from '@solid/community-server';
import { GoogleIdRoute } from './util/GoogleIdRoute';
import { GoogleStore } from './util/GoogleStore';
import { GoogleOIDC, CGA } from './GoogleOIDC';
import { GSessionStore } from './util/GSessionStore';

type OutType = { resource: string };

const inSchema = object({
  url: string().required(),
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
    return { json: { ...parseSchema(inSchema), googleLogins }};
    // let res,json;
    // res = await fetch('http://localhost:3000/.account/account/d014c5d9-a780-494f-ac3a-10e8a821794f/login/google/');
    // json = await res.json();
  }

  public async handle({ accountId, json, metadata }: JsonInteractionHandlerInput): Promise<JsonRepresentation<OutType>> {
    assertAccountId(accountId);
    const { url } = await validateWithError(inSchema, json);

    const cookie = metadata.get(CGA.terms.cgaCookie)?.value;
    if (!cookie) {
      throw new Error('CreateGoogleHandler: no cookie.');
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

    const googleId = await this.googleStore.create(sub, accountId); // ダブリチェックあり
    const resource = this.googleRoute.getPath({ googleId, accountId });

    return { json: { resource }};
  }
}
