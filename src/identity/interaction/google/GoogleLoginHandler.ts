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

const inSchema = object({
  google_sub: string().required(),
});

export interface GoogleLoginHandlerArgs {
  accountStore: AccountStore;
  googleStore: GoogleStore;
  cookieStore: CookieStore;
}

/**
 * 
 */
export class GoogleLoginHandler extends ResolveLoginHandler implements JsonView {
  protected readonly logger = getLoggerFor(this);

  private readonly googleStore: GoogleStore;

  public constructor(args: GoogleLoginHandlerArgs) {
    super(args.accountStore, args.cookieStore);
    this.googleStore = args.googleStore;
  }

  public async getView(): Promise<JsonRepresentation> {
    return { json: parseSchema(inSchema) };
  }

  public async login({ json }: JsonInteractionHandlerInput): Promise<JsonRepresentation<LoginOutputType>> {
    const { google_sub } = await validateWithError(inSchema, json);
    // Try to log in, will error if email/password combination is invalid
    const { accountId } = await this.googleStore.authenticate(google_sub);
    this.logger.debug(`Logging in user ${google_sub}`);

    return { json: { accountId }};
  }
}
