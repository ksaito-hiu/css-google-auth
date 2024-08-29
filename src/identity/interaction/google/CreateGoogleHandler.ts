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
import { GoogleAuthFilter } from './GoogleAuthFilter';
import { PostGAccountGen } from './PostGAccountGen';

type OutType = { resource: string };

const inSchema = object({
  url: string().required(),
});

export interface CreateGoogleHandlerArgs {
  googleOIDC: GoogleOIDC;
  googleStore: GoogleStore;
  googleRoute: GoogleIdRoute;
  gSessionStore: GSessionStore;
  googleAuthFilter: GoogleAuthFilter;
  postGAccountGen: PostGAccountGen;
  addDelLinks: boolean;
}

/**
 * 
 */
export class CreateGoogleHandler extends JsonInteractionHandler<OutType> implements JsonView {
  private readonly logger = getLoggerFor(this);

  private readonly googleOIDC: GoogleOIDC;
  private readonly googleStore: GoogleStore;
  private readonly googleRoute: GoogleIdRoute;
  private readonly gSessionStore: GSessionStore;
  private readonly googleAuthFilter: GoogleAuthFilter;
  private readonly postGAccountGen: PostGAccountGen;
  private readonly addDelLinks: boolean;

  public constructor(args: CreateGoogleHandlerArgs) {
    super();
    this.googleOIDC = args.googleOIDC;
    this.googleStore = args.googleStore;
    this.googleRoute = args.googleRoute;
    this.gSessionStore = args.gSessionStore;
    this.googleAuthFilter = args.googleAuthFilter;
    this.postGAccountGen = args.postGAccountGen;
    this.addDelLinks = args.addDelLinks;
  }

  public async getView({ accountId, json, metadata }: JsonInteractionHandlerInput): Promise<JsonRepresentation> {
    assertAccountId(accountId);
    const googleLogins: Record<string, string> = {};
    for (const { id, google_sub } of await this.googleStore.findByAccount(accountId)) {
      googleLogins[google_sub] = this.googleRoute.getPath({ accountId, googleId: id });
    }
    const addDelLinks = this.addDelLinks;
    return { json: { ...parseSchema(inSchema), googleLogins, addDelLinks }};
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

    const queries = this.googleOIDC.client.callbackParams(url);
    const tokenSet = await this.googleOIDC.getTokenSet(queries,code_verifier);
    await this.googleAuthFilter.check(tokenSet);
    const claims = tokenSet.claims();
    const sub = claims.sub;
    this.gSessionStore.delete(cookie,'code_verifier');

    const googleId = await this.googleStore.create(sub, accountId); // ダブリチェックあり
    await this.postGAccountGen.handle(accountId,googleId,tokenSet);
    const resource = this.googleRoute.getPath({ googleId, accountId });

    return { json: { resource }};
  }
}
