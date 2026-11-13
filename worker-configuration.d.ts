/// <reference types="@cloudflare/workers-types" />

declare global {
  interface CloudflareEnv {
    ASSETS?: Fetcher;
    DB?: D1Database;
  }
}

export {};
