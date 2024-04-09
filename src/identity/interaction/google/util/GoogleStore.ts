/**
 * The constant used to identify Google auth based login information in the map of logins an account has.
 */
export const GOOGLE_METHOD = 'google';

/**
 * Responsible for storing everything related to Google auth based login information.
 */
export interface GoogleStore {
  /**
   * Creates a new login entry for this account.
   *
   * @param google_sub - Google OIDC sub claim.
   * @param accountId - Account ID.
   */
  create: (google_sub: string, accountId: string) => Promise<string>;

  /**
   * Finds the google_sub associated with this login ID.
   *
   * @param id - The ID of the login object.
   */
  get: (id: string) => Promise<{ google_sub: string; accountId: string } | undefined>;

  /**
   * Finds the account and login ID associated with this google_sub.
   *
   * @param google_sub - Google OIDC sub claim.
   */
  findByGoogleSub: (google_sub: string) => Promise<{ accountId: string; id: string } | undefined>;

  /**
   * Find all login objects created by this account.
   *
   * @param accountId - ID of the account to find the logins for.
   */
  findByAccount: (accountId: string) => Promise<{ id: string; google_sub: string }[]>;

  /**
   * Authenticate if the user pass Google authentication and return the account and login ID if they are.
   * Throw an error if the user can not.
   *
   */
  authenticate: (google_sub: string) => Promise<{ accountId: string; id: string }>;

  /**
   * Delete the login entry.
   *
   * @param id - ID of the login object.
   */
  delete: (id: string) => Promise<void>;
}
