import { object, string } from 'yup';
import { getLoggerFor } from '@solid/community-server';
import type { JsonRepresentation } from '@solid/community-server';
import { JsonInteractionHandler } from '@solid/community-server';
import type { JsonInteractionHandlerInput } from '@solid/community-server';
import type { JsonView } from '@solid/community-server';
import { parseSchema, validateWithError } from '@solid/community-server';
import { GoogleOIDC, CGA } from './GoogleOIDC';
import { GSessionStore } from './util/GSessionStore';
import { v4 } from 'uuid';

type OutType = { sub: string };

const inSchema = object({
  url: string().required(),
});

/**
 * GoogleのOIDCが使っているsubの情報をGoogleから引き出すためのAPI。
 */
export class SubGoogleHandler extends JsonInteractionHandler implements JsonView {
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
    const { url } = await validateWithError(inSchema, args.json);
    const cookie = args.metadata.get(CGA.terms.cgaCookie)?.value;
    if (!cookie) {
      throw new Error('SubGoogleHandler: no cookie.');
    }
    const code_verifier = await this.gSessionStore.get(cookie,'code_verifier');
    if (!code_verifier) {
      throw new Error('SubGoogleHandler: no data of code_verifier.');
    }

    const queries = this.googleOIDC.client.callbackParams(url);
    const tokenSet = await this.googleOIDC.getTokenSet(queries,code_verifier);
    const claims = tokenSet.claims();
    const sub = claims.sub;
    this.gSessionStore.delete(cookie,'code_verifier');

    return { json: { sub } };
  }
}
