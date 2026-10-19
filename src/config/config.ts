import { z } from 'zod';

/**
 * "true"/"false" (or 1/0) from the environment. z.coerce.boolean() would read
 * the string "false" as true — wrong for flags like IS_EMAIL_MOCKED.
 */
const envBoolean = (fallback: boolean) =>
  z
    .preprocess(
      (value) =>
        typeof value === 'string'
          ? value.trim().toLowerCase() || undefined
          : value,
      z.enum(['true', 'false', '1', '0']).optional(),
    )
    .transform((value) =>
      value === undefined ? fallback : value === 'true' || value === '1',
    );

/**
 * Environment schema. Used by @nestjs/config to validate and coerce env vars
 * at startup, so the rest of the app can trust ConfigService values.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  SHOW_SWAGGER: envBoolean(true),

  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_USERNAME: z.string().default('sprintboard'),
  DB_PASSWORD: z.string().default('sprintboard'),
  DB_NAME: z.string().default('sprintboard'),
  DB_SYNCHRONIZE: envBoolean(false),
  DATABASE_URL: z.string().optional(),

  FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),
  FIREBASE_CLIENT_EMAIL: z.string().min(1, 'FIREBASE_CLIENT_EMAIL is required'),
  FIREBASE_PRIVATE_KEY: z.string().min(1, 'FIREBASE_PRIVATE_KEY is required'),
  // Object storage (evidence and profile photos) on S3, or MinIO locally from
  // compose.yml. The browser uploads straight to the bucket through presigned
  // PUT URLs; the API only signs and validates.
  //   S3_BUCKET           without it uploads answer 503.
  //   S3_KEY_PREFIX       per-environment folder in the bucket (local, prod…).
  //   S3_PUBLIC_BASE_URL  public origin of `<prefix>/avatars/*` (bucket policy or
  //                       CDN). Evidence stays private: read through signed URLs.
  //   S3_ENDPOINT, S3_FORCE_PATH_STYLE  only for S3-compatible servers (MinIO).
  // Credentials are optional: without them the SDK default chain is used.
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().min(1).default('us-east-1'),
  S3_KEY_PREFIX: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'lowercase letters, digits or hyphens')
    .default('local'),
  S3_PUBLIC_BASE_URL: z.string().url().optional(),
  S3_ENDPOINT: z.string().url().optional(),
  S3_FORCE_PATH_STYLE: envBoolean(false),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),

  // Email. IS_EMAIL_MOCKED=true sends everything to Mailpit (MAILPIT_URL), the
  // local inbox from compose.yml, whatever the rest says. Otherwise
  // EMAIL_PROVIDER picks the real delivery:
  //   smtp  any SMTP server (Brevo, Gmail…) with the SMTP_* vars.
  //   ses   Amazon SES through the AWS API. Credentials are optional: with none
  //         it uses the instance/task role; SES_ROLE_ARN assumes another role,
  //         and the keys are only for testing by hand.
  // MAIL_FROM is the sender: an address the chosen provider has verified.
  IS_EMAIL_MOCKED: envBoolean(false),
  MAILPIT_URL: z.string().url().default('smtp://localhost:1026'),
  EMAIL_PROVIDER: z.enum(['smtp', 'ses']).default('smtp'),
  MAIL_FROM: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65_535).default(587),
  // Implicit TLS (port 465, e.g. Gmail). Without it, SMTP_STARTTLS upgrades the
  // connection (port 587, e.g. Brevo); turn that off only for an internal
  // relay, since the password would travel in clear text.
  SMTP_SECURE: envBoolean(false),
  SMTP_STARTTLS: envBoolean(true),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  AWS_REGION: z.string().optional(),
  SES_ACCESS_KEY_ID: z.string().optional(),
  SES_SECRET_ACCESS_KEY: z.string().optional(),
  SES_ROLE_ARN: z.string().optional(),
  SES_ROLE_SESSION_NAME: z.string().default('kanbio'),

  WEB_URL: z.string().url().default('http://localhost:3000'),
  LINK_EXPIRATION_HOURS: z.coerce.number().int().min(1).max(168).default(24),
})
  .refine((env) => !env.SES_ACCESS_KEY_ID === !env.SES_SECRET_ACCESS_KEY, {
    message: 'SES_ACCESS_KEY_ID and SES_SECRET_ACCESS_KEY must be set together',
    path: ['SES_ACCESS_KEY_ID'],
  })
  .refine((env) => !env.S3_ACCESS_KEY_ID === !env.S3_SECRET_ACCESS_KEY, {
    message: 'S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY must be set together',
    path: ['S3_ACCESS_KEY_ID'],
  });

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const details = JSON.stringify(parsed.error.flatten().fieldErrors, null, 2);
    throw new Error(
      `Invalid environment variables:\n${details}\n` +
        'Copy .env.example to .env and fill in the required values.',
    );
  }
  return parsed.data;
}
