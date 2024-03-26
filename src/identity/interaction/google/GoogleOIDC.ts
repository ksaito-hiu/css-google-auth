import { Initializer, getLoggerFor, InteractionRoute } from '@solid/community-server';
import { Issuer, generators } from 'openid-client';

export class GoogleOIDC extends Initializer {
  private readonly google_route;
  private readonly client_id;
  private readonly client_secret;
  private issuer: any;
  private client: any;
  private readonly logger;

  public constructor(g_route: InteractionRoute, c_id: string, c_secret: string) {
    super();
    this.google_route = g_route.getPath();
    this.client_id = c_id;
    this.client_secret = c_secret;
console.log("GAHA: ",this.google_route);
console.log("GAHA: ",this.client_id);
console.log("GAHA: ",this.client_secret);
    this.logger = getLoggerFor(this);
  }

  public async handle(input: void): Promise<void> {
    this.issuer = await Issuer.discover('https://accounts.google.com');
    const redirect_uris = [
      this.google_route + 'callback/'
    ];
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
console.log("GAHA: ",err);
    }
  }
}
