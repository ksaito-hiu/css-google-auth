import { object, string } from 'yup';
import { getLoggerFor } from '@solid/community-server';
import type { AccountStore } from '@solid/community-server';
import type { CookieStore } from '@solid/community-server';
import { assertAccountId } from '@solid/community-server';
import type { JsonRepresentation } from '@solid/community-server';
import { JsonInteractionHandler } from '@solid/community-server';
import type { JsonInteractionHandlerInput } from '@solid/community-server';
import type { JsonView } from '@solid/community-server';
import { parseSchema, validateWithError } from '@solid/community-server';
import type { GoogleIdRoute } from './util/GoogleIdRoute';
import type { GoogleStore } from './util/GoogleStore';

type OutType = { resource: string };

const inSchema = object({
  google_sub: string().required(),
});

export interface CreateGoogleHandlerArgs {
  accountStore: AccountStore;
  googleStore: GoogleStore;
  cookieStore: CookieStore;
}

/**
 * 
 */
export class CreateGoogleHandler extends JsonInteractionHandler<OutType> implements JsonView {
  private readonly logger = getLoggerFor(this);

  private readonly googleStore: GoogleStore;
  private readonly googleRoute: GoogleIdRoute;

  public constructor(googleStore: GoogleStore, googleRoute: GoogleIdRoute) {
    super();
    this.googleStore = googleStore;
    this.googleRoute = googleRoute;
  }

  public async getView(input: JsonInteractionHandlerInput): Promise<JsonRepresentation> {
    assertAccountId(input.accountId);
    console.log("GAHA1: ",input);
    return { json: { resource: "getView" }};
  }

  public async handle(input: JsonInteractionHandlerInput): Promise<JsonRepresentation<OutType>> {
    assertAccountId(input.accountId);
    console.log("GAHA2: ",input);

    return { json: { resource: "handle" }};
  }
}
