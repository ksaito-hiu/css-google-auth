import { Initializer, getLoggerFor, InteractionRoute } from '@solid/community-server';
import { Issuer, generators } from 'openid-client';
import { createVocabulary } from '@solid/community-server';

// Cookieに関するVocablaryを定義
export const CGA = createVocabulary(
  'urn:npm:css-google-auth:http:',
  // Used for metadata for cookie used in GoogleOIDC.
  'cgaCookie',
  'cgaCookieExpiration'
);

export class GoogleOIDC extends Initializer {
  private readonly logger;
  private readonly callback_url;
  private readonly client_id;
  private readonly client_secret;
  public issuer: any;
  public client: any;

  public constructor(callback_route: InteractionRoute, client_id: string, client_secret: string) {
    super();
    this.callback_url = callback_route.getPath();
    this.client_id = client_id;
    this.client_secret = client_secret;
    this.logger = getLoggerFor(this);
  }

  public async handle(input: void): Promise<void> {
    this.issuer = await Issuer.discover('https://accounts.google.com');
    const redirect_uris = [ this.callback_url ];
    try {
      this.client = new this.issuer.Client({
        client_id: this.client_id,
        client_secret: this.client_secret,
        redirect_uris,
        response_types: ['code'],
      });
      this.logger.info('Google OIDC Client ready.');
    } catch(err) {
      this.logger.error('Google OIDC Client could not initialize.');
    }
  }

  public createCode(): { code_verifier: string, code_challenge: string } {
    const code_verifier = generators.codeVerifier();
    const code_challenge = generators.codeChallenge(code_verifier);
    return { code_verifier, code_challenge };
  }

  public async getTokenSet(queries: string, code_verifier: string) {
    const callbackUrl = this.callback_url;
    const tokenSet = await this.client.callback(callbackUrl,queries,{ code_verifier });
    return tokenSet;
  }
}
