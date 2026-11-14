/// <reference types="@cloudflare/workers-types" />

declare global {
  interface CloudflareEnv {
    ASSETS?: Fetcher;
    DB?: D1Database;
    ADMIN_TOKEN?: string;
    RESEND_API_KEY?: string;
    RESEND_FROM?: string;
  }
}

export {};
