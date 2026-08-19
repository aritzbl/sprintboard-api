import { z } from 'zod';

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
  SHOW_SWAGGER: z.coerce.boolean().default(true),

  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_USERNAME: z.string().default('sprintboard'),
  DB_PASSWORD: z.string().default('sprintboard'),
  DB_NAME: z.string().default('sprintboard'),
  DB_SYNCHRONIZE: z.coerce.boolean().default(false),
  DATABASE_URL: z.string().optional(),

  FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),
  FIREBASE_CLIENT_EMAIL: z.string().min(1, 'FIREBASE_CLIENT_EMAIL is required'),
  FIREBASE_PRIVATE_KEY: z.string().min(1, 'FIREBASE_PRIVATE_KEY is required'),
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
