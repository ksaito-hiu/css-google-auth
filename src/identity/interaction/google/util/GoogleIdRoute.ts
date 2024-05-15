import type { AccountIdKey, AccountIdRoute } from '@solid/community-server';
import { IdInteractionRoute } from '@solid/community-server';
import type { ExtendedRoute } from '@solid/community-server';

export type GoogleIdKey = 'googleId';

/**
 * An {@link AccountIdRoute} that also includes a google login identifier.
 */
export type GoogleIdRoute = ExtendedRoute<AccountIdRoute, GoogleIdKey>;

/**
 * Implementation of an {@link GoogleIdRoute} that adds the identifier relative to a base {@link AccountIdRoute}.
 */
export class BaseGoogleIdRoute extends IdInteractionRoute<AccountIdKey, GoogleIdKey> {
  public constructor(base: AccountIdRoute) {
    super(base, 'googleId');
  }
}
