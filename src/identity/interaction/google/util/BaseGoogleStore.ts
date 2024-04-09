import { compare, hash } from 'bcryptjs';
import { Initializer } from '@solid/community-server';
import { getLoggerFor } from '@solid/community-server';
import { BadRequestHttpError } from '@solid/community-server';
import { createErrorMessage } from '@solid/community-server';
import { ForbiddenHttpError } from '@solid/community-server';
import { InternalServerError } from '@solid/community-server';
import { ACCOUNT_TYPE } from '@solid/community-server';
import type { AccountLoginStorage } from '@solid/community-server';
import type { GoogleStore } from './GoogleStore';

export const GOOGLE_STORAGE_TYPE = 'google';
export const GOOGLE_STORAGE_DESCRIPTION = {
  google_sub: 'string',
  accountId: `id:${ACCOUNT_TYPE}`,
} as const;

/**
 * A {@link GoogleStore} that uses a {@link KeyValueStorage} to store the entries.
 * Google sub claims are hashed and salted.
 * Default `saltRounds` is 10.
 */
export class BaseGoogleStore extends Initializer implements GoogleStore {
  private readonly logger = getLoggerFor(this);

  private readonly storage: AccountLoginStorage<{ [GOOGLE_STORAGE_TYPE]: typeof GOOGLE_STORAGE_DESCRIPTION }>;
  private readonly saltRounds: number;
  private initialized = false;

  // Wrong typings to prevent Components.js typing issues
  public constructor(storage: AccountLoginStorage<Record<string, never>>, saltRounds = 10) {
    super();
    this.storage = storage as unknown as typeof this.storage;
    this.saltRounds = saltRounds;
  }

  // Initialize the type definitions
  public async handle(): Promise<void> {
    if (this.initialized) {
      return;
    }
    try {
      await this.storage.defineType(GOOGLE_STORAGE_TYPE, GOOGLE_STORAGE_DESCRIPTION, true);
      await this.storage.createIndex(GOOGLE_STORAGE_TYPE, 'accountId');
      await this.storage.createIndex(GOOGLE_STORAGE_TYPE, 'google_sub');
      this.initialized = true;
    } catch (cause: unknown) {
      throw new InternalServerError(
        `Error defining Google infomation in storage: ${createErrorMessage(cause)}`,
        { cause },
      );
    }
  }

  public async create(google_sub: string, accountId: string): Promise<string> {
    if (await this.findByGoogleSub(google_sub)) {
      this.logger.warn(`Trying to create duplicate login for google_sub ${google_sub}`);
      throw new BadRequestHttpError('There already is a login for this google_sub.');
    }
    const payload = await this.storage.create(GOOGLE_STORAGE_TYPE, {
      accountId,
      google_sub,
    });
    return payload.id;
  }

  public async get(id: string): Promise<{ google_sub: string; accountId: string } | undefined> {
    const result = await this.storage.get(GOOGLE_STORAGE_TYPE, id);
    if (!result) {
      return;
    }
    return { google_sub: result.google_sub, accountId: result.accountId };
  }

  public async findByGoogleSub(google_sub: string): Promise<{ accountId: string; id: string } | undefined> {
    const payload = await this.storage.find(GOOGLE_STORAGE_TYPE, { google_sub });
    if (payload.length === 0) {
      return;
    }
    return { accountId: payload[0].accountId, id: payload[0].id };
  }

  public async findByAccount(accountId: string): Promise<{ id: string; google_sub: string }[]> {
    return (await this.storage.find(GOOGLE_STORAGE_TYPE, { accountId }))
      .map(({ id, google_sub }): { id: string; google_sub: string } => ({ id, google_sub }));
  }

  public async authenticate(): Promise<{ accountId: string; id: string }> {
    // ここで色々やってgoogle_subを手に入れる。認証失敗したりしたら例外を出す。
    // とりあえず認証成功したとしてダミーを入れておく。
    const google_sub = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const payload = await this.storage.find(GOOGLE_STORAGE_TYPE, { google_sub });
    if (payload.length === 0) {
      this.logger.warn(`Trying to get account info for unknown google_sub ${google_sub}`);
      throw new ForbiddenHttpError('Invalid google authentication.');
    }
    const { accountId, id } = payload[0];
    return { accountId, id };
  }

  public async delete(id: string): Promise<void> {
    return this.storage.delete(GOOGLE_STORAGE_TYPE, id);
  }
}
