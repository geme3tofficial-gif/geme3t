import "server-only";

import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const bucketName = "course-images";
const maximumImageSize = 4 * 1024 * 1024;
const imageTypes = {
  "image/jpeg": {
    extension: "jpg",
    signature: (bytes: Uint8Array) =>
      bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  "image/png": {
    extension: "png",
    signature: (bytes: Uint8Array) =>
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a,
  },
  "image/webp": {
    extension: "webp",
    signature: (bytes: Uint8Array) =>
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50,
  },
} as const;

function isCourseImageType(value: string): value is keyof typeof imageTypes {
  return Object.hasOwn(imageTypes, value);
}

export class CourseImageUploadError extends Error {
  constructor(
    message: string,
    readonly kind: "invalid-image" | "storage-error" = "storage-error",
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "CourseImageUploadError";
  }
}

export async function uploadCourseImage(file: File, slug: string) {
  if (!isCourseImageType(file.type)) {
    throw new CourseImageUploadError(
      "Choose a PNG, JPEG, or WebP image no larger than 4 MB.",
      "invalid-image",
    );
  }
  const fileType = imageTypes[file.type];
  if (
    file.size === 0 ||
    file.size > maximumImageSize
  ) {
    throw new CourseImageUploadError(
      "Choose a PNG, JPEG, or WebP image no larger than 4 MB.",
      "invalid-image",
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!fileType.signature(bytes)) {
    throw new CourseImageUploadError(
      "The selected file does not contain a valid image of its declared type.",
      "invalid-image",
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new CourseImageUploadError(
      "Course image uploads require the server-side Supabase service-role key.",
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: buckets, error: listError } =
    await supabase.storage.listBuckets();
  if (listError) {
    throw new CourseImageUploadError(
      "Could not check Supabase Storage for the course image bucket.",
      "storage-error",
      { cause: listError },
    );
  }

  if (!buckets.some((bucket) => bucket.name === bucketName)) {
    const { error: createError } = await supabase.storage.createBucket(
      bucketName,
      {
        public: true,
        fileSizeLimit: maximumImageSize,
        allowedMimeTypes: Object.keys(imageTypes),
      },
    );

    if (createError) {
      const { data: refreshedBuckets, error: refreshError } =
        await supabase.storage.listBuckets();
      if (
        refreshError ||
        !refreshedBuckets.some((bucket) => bucket.name === bucketName)
      ) {
        throw new CourseImageUploadError(
          "Could not create the public course image bucket in Supabase Storage.",
          "storage-error",
          { cause: refreshError ?? createError },
        );
      }
    }
  }

  const objectPath = `${slug}/${randomUUID()}.${fileType.extension}`;
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(objectPath, Buffer.from(bytes), {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) {
    throw new CourseImageUploadError(
      "Could not upload the course image to Supabase Storage.",
      "storage-error",
      { cause: uploadError },
    );
  }

  return supabase.storage.from(bucketName).getPublicUrl(objectPath).data
    .publicUrl;
}
