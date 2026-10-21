declare namespace Cloudflare {
  interface Env {
    OPENAI_API_KEY?: string;
    APP_PASSWORD_HASH?: string;
    APP_PASSWORD_SALT?: string;
    APP_OWNER_ID?: string;
    APP_SECRET?: string;
    OPENAI_MODEL?: string;
    AI_DAILY_LIMIT?: string;
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}
