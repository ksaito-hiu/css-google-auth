/**
 * Google認証のためだけにちょこっと必要になるセッション情報を保存するStore
 */
export interface GSessionStore {
  /**
   * クッキー、キー、値でセット。値はstring。
   */
  set: (cookie: string, key: string, value: string) => Promise<void>;

  /**
   * クッキー、キーで指定した値をゲット。値はstring。
   */
  get: (cookie: string, key: string) => Promise<string | undefined>;

  /**
   * クッキー、キーで指定した値を削除。
   */
  delete: (cookie: string, key: string) => Promise<boolean>;
}
