import { object } from 'yup';
import { getLoggerFor } from '@solid/community-server';
import type { StorageLocationStrategy } from '@solid/community-server';
import { BadRequestHttpError } from '@solid/community-server';
import type { OwnershipValidator } from '@solid/community-server';
import { assertAccountId } from '@solid/community-server';
import type { JsonRepresentation } from '@solid/community-server';
import { JsonInteractionHandler } from '@solid/community-server';
import type { JsonInteractionHandlerInput } from '@solid/community-server';
import type { JsonView } from '@solid/community-server';
import type { PodStore } from '@solid/community-server';
import { parseSchema, URL_SCHEMA, validateWithError } from '@solid/community-server';
//import type { PasswordStore } from './util/PasswordStore';

const inSchema = object({
  webId: URL_SCHEMA.required(),
});

type OutType = {
  a: number;
  b: number;
};

export interface LoginGoogleHandlerArgs {
  /**
   * Base URL of the server.
   * Used to indicate in the response what the object of the `solid:oidcIssuer` triple should be.
   */
  baseUrl: string;
}

/**
 * 
 */
export class LoginGoogleHandler extends JsonInteractionHandler<OutType> implements JsonView {
  private readonly logger = getLoggerFor(this);

  public constructor() {
    super();
  }

  public async getView(input: JsonInteractionHandlerInput): Promise<JsonRepresentation> {
    //assertAccountId(input.accountId);
    console.log("GAHA1: ",input);
    return { json: { a: 1, b: 2 }};
  }

  public async handle(input: JsonInteractionHandlerInput): Promise<JsonRepresentation<OutType>> {
    //assertAccountId(input.accountId);
    console.log("GAHA2: ",input);

    return { json: { a: 3, b: 4 }};
  }
}
