import { randomUUID } from 'node:crypto';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { EnvVar } from '@config/env-var';

/** Folders inside the per-environment prefix. Only `avatars` is public. */
export type StorageFolder = 'evidence' | 'avatars';

/** What S3 reports about an uploaded object. */
export interface StoredObject {
  size: number;
  contentType: string;
}

const TIMEOUT_MS = 10_000;
const UPLOAD_URL_TTL_SECONDS = 5 * 60;
// Read URLs are signed against the start of the current hour and stay valid two
// hours: the same URL comes back all hour long, so the browser can cache images.
const READ_URL_WINDOW_MS = 60 * 60 * 1000;
const READ_URL_TTL_SECONDS = 2 * 60 * 60;

/**
 * Object storage on S3 (or an S3-compatible server such as MinIO). Files never
 * pass through the API: it signs short-lived URLs for the browser to PUT/GET,
 * and checks what actually landed in the bucket before trusting it.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly prefix: string;
  private readonly publicBaseUrl: string | undefined;

  constructor(config: ConfigService) {
    this.bucket = config.get<string>(EnvVar.S3_BUCKET) ?? '';
    this.prefix = config.getOrThrow<string>(EnvVar.S3_KEY_PREFIX);
    this.publicBaseUrl = config
      .get<string>(EnvVar.S3_PUBLIC_BASE_URL)
      ?.replace(/\/+$/, '');

    const accessKeyId = config.get<string>(EnvVar.S3_ACCESS_KEY_ID);
    const secretAccessKey = config.get<string>(EnvVar.S3_SECRET_ACCESS_KEY);
    this.client = this.bucket
      ? new S3Client({
          region: config.getOrThrow<string>(EnvVar.S3_REGION),
          endpoint: config.get<string>(EnvVar.S3_ENDPOINT) || undefined,
          forcePathStyle: config.get<boolean>(EnvVar.S3_FORCE_PATH_STYLE),
          credentials:
            accessKeyId && secretAccessKey
              ? { accessKeyId, secretAccessKey }
              : undefined,
          // Recent SDKs add CRC32 checksums by default; on a presigned PUT they
          // sign the checksum of an empty body and the real upload is rejected
          // (MinIO does not support them either).
          requestChecksumCalculation: 'WHEN_REQUIRED',
          responseChecksumValidation: 'WHEN_REQUIRED',
          maxAttempts: 2,
          requestHandler: {
            connectionTimeout: TIMEOUT_MS,
            requestTimeout: TIMEOUT_MS,
          },
        })
      : null;

    this.logger.log(
      this.client
        ? `Object storage: s3://${this.bucket}/${this.prefix}/`
        : 'Object storage is not configured (S3_BUCKET is empty).',
    );
  }

  /** `<prefix>/<folder>/<scope>/<uuid><ext>`: never the user's file name. */
  newKey(folder: StorageFolder, scope: string, extension: string): string {
    return `${this.folderPrefix(folder, scope)}${randomUUID()}${extension}`;
  }

  /** Every key of that folder and scope starts with this. */
  folderPrefix(folder: StorageFolder, scope: string): string {
    return `${this.prefix}/${folder}/${scope}/`;
  }

  /**
   * Presigned PUT for the browser. Type and size are part of the signature, so
   * the upload must match what was declared: the S3 presigner leaves
   * Content-Type unsigned by default, which would let a public avatar URL
   * receive an HTML page.
   */
  uploadUrl(key: string, contentType: string, size: number): Promise<string> {
    return getSignedUrl(
      this.s3(),
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        ContentLength: size,
      }),
      {
        expiresIn: UPLOAD_URL_TTL_SECONDS,
        signableHeaders: new Set(['content-type', 'content-length']),
      },
    );
  }

  /** Short-lived read URL for a private object. */
  readUrl(key: string): Promise<string> {
    const now = Date.now();
    return getSignedUrl(
      this.s3(),
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      {
        expiresIn: READ_URL_TTL_SECONDS,
        signingDate: new Date(now - (now % READ_URL_WINDOW_MS)),
      },
    );
  }

  /** Permanent URL of an object under the public `avatars` folder. */
  publicUrl(key: string): string {
    if (!this.publicBaseUrl) {
      throw new ServiceUnavailableException(
        'Las imágenes públicas no están configuradas (S3_PUBLIC_BASE_URL).',
      );
    }
    return `${this.publicBaseUrl}/${key}`;
  }

  /** Size and type as stored, or null when the object does not exist. */
  async stat(key: string): Promise<StoredObject | null> {
    try {
      const head = await this.s3().send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return {
        size: head.ContentLength ?? 0,
        contentType: head.ContentType ?? '',
      };
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } })
        .$metadata?.httpStatusCode;
      if ((error as Error).name === 'NotFound' || status === 404) return null;
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    await this.s3().send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  private s3(): S3Client {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'El almacenamiento de archivos no está configurado.',
      );
    }
    return this.client;
  }
}
