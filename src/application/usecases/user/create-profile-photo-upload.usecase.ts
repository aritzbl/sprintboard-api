import { Injectable } from '@nestjs/common';
import {
  PROFILE_PHOTO_EXTENSIONS,
  User,
} from '@entities/user/user.entity';
import { CreateProfilePhotoUploadDto } from '@entities/user/user.types';
import { StorageService } from '@services/storage.service';

export interface ProfilePhotoUpload {
  uploadUrl: string;
  /** Public URL to save as `photoURL` once the upload succeeds. */
  publicUrl: string;
}

/** Presigned URL for the caller to PUT a new profile photo (public object). */
@Injectable()
export class CreateProfilePhotoUploadUseCase {
  constructor(private readonly storage: StorageService) {}

  async execute(
    user: User,
    dto: CreateProfilePhotoUploadDto,
  ): Promise<ProfilePhotoUpload> {
    const key = this.storage.newKey(
      'avatars',
      user.id,
      PROFILE_PHOTO_EXTENSIONS[dto.contentType],
    );
    return {
      // Resolved first so a missing S3_PUBLIC_BASE_URL fails before uploading.
      publicUrl: this.storage.publicUrl(key),
      uploadUrl: await this.storage.uploadUrl(key, dto.contentType, dto.size),
    };
  }
}
