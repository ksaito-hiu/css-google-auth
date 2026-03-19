import { Initializer, InteractionRoute } from '@solid/community-server';
import { getLoggerFor, Logger } from 'global-logger-factory';
import * as client from 'openid-client';
import { createVocabulary } from 'rdf-vocabulary';

// Cookieに関するVocablaryを定義
export const CGA = createVocabulary(
  'urn:npm:css-google-auth:http:',
  // Used for metadata for cookie used in GoogleOIDC.
  'cgaCookie',
  'cgaCookieExpiration'
);

export class GoogleOIDC extends Initializer {
  private readonly client_id: string;
  private readonly client_secret: string;
  private readonly logger: Logger<GoogleOIDC>;
  private config!: client.Configuration;

  public constructor(client_id: string, client_secret: string) {
    super();
console.log("GAHA0: *******************************");
    this.client_id = client_id;
    this.client_secret = client_secret;
    this.logger = getLoggerFor(this);
console.log("GAHA0-1: *******************************");
  }

  public async handle(input: void): Promise<void> {
console.log("GAHA1: ");
    try {
      this.config = await client.discovery(
        new URL('https://accounts.google.com'),
        this.client_id,
        this.client_secret,
      );
console.log("GAHA3: ");
      this.logger.info('Google OIDC Client ready.');
console.log("GAHA4: ");
    } catch(err) {
console.log("GAHA5: ");
      this.logger.error('Google OIDC Client could not initialize.');
    }
  }

  public async createCodeAndNonce(): Promise<{ code_challenge: string, code_verifier: string, nonce: string }> {
    const code_verifier = client.randomPKCECodeVerifier();
    const code_challenge = await client.calculatePKCECodeChallenge(code_verifier);
    let nonce!: string;
    if (!this.config.serverMetadata().supportsPKCE())
      nonce = client.randomNonce();
    return { code_challenge, code_verifier, nonce };
  }

  public createAuthUrl(redirect_uri: string, code_challenge: string, nonce: string): URL {
    const param: Record<string, string> = {
      redirect_uri,
      scope: 'openid email',
      code_challenge,
      code_challenge_method: 'S256',
      nonce,
    };
    const authUrl = client.buildAuthorizationUrl(this.config,param);
    return authUrl;
  }

  public async getTokenSet(redirectUrl: string, queries: string, code_verifier: string, nonce: string) {
    const theUrl: URL = new URL(redirectUrl+queries);
    const tokenSet = await client.authorizationCodeGrant(this.config,theUrl, {
      pkceCodeVerifier: code_verifier,
      expectedNonce: nonce,
      idTokenExpected: true,
    });
    return tokenSet;
  }
}
