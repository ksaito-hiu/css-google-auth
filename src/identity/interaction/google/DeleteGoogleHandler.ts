//import type { EmptyObject } from '@solid/community-server';
import { parsePath, verifyAccountId } from '@solid/community-server';
import type { JsonRepresentation } from '@solid/community-server';
import type { JsonInteractionHandlerInput } from '@solid/community-server';
import { JsonInteractionHandler } from '@solid/community-server';
import type { GoogleIdRoute } from './util/GoogleIdRoute';
import type { GoogleStore } from './util/GoogleStore';
type EmptyObject = Record<string, never>;

/**
 * Handles the deletion of a Google login method.
 */
export class DeleteGoogleHandler extends JsonInteractionHandler<EmptyObject> {
  private readonly googleStore: GoogleStore;
  private readonly googleRoute: GoogleIdRoute;

  public constructor(googleStore: GoogleStore, googleRoute: GoogleIdRoute) {
    super();
    this.googleStore = googleStore;
    this.googleRoute = googleRoute;
  }

  public async handle({ target, accountId }: JsonInteractionHandlerInput): Promise<JsonRepresentation<EmptyObject>> {
    const match = parsePath(this.googleRoute, target.path);

    const login = await this.googleStore.get(match.googleId);
    verifyAccountId(accountId, login?.accountId);

    await this.googleStore.delete(match.googleId);

    return { json: {}};
  }
}
