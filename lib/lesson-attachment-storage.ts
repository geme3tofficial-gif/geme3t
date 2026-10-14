import "server-only";

import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const bucketName = "lesson-attachments";
const maximumFileSize = 20 * 1024 * 1024;
const allowedFiles = {
  "application/pdf": {
    extensions: [".pdf"],
    signature: (bytes: Uint8Array) =>
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46,
  },
  "application/msword": {
    extensions: [".doc"],
    signature: (bytes: Uint8Array) =>
      bytes[0] === 0xd0 &&
      bytes[1] === 0xcf &&
      bytes[2] === 0x11 &&
      bytes[3] === 0xe0,
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    extensions: [".docx"],
    signature: (bytes: Uint8Array) =>
      bytes[0] === 0x50 &&
      bytes[1] === 0x4b &&
      bytes[2] === 0x03 &&
      bytes[3] === 0x04,
  },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    extensions: [".pptx"],
    signature: (bytes: Uint8Array) =>
      bytes[0] === 0x50 &&
      bytes[1] === 0x4b &&
      bytes[2] === 0x03 &&
      bytes[3] === 0x04,
  },
  "application/vnd.ms-powerpoint": {
    extensions: [".ppt"],
    signature: (bytes: Uint8Array) =>
      bytes[0] === 0xd0 &&
      bytes[1] === 0xcf &&
      bytes[2] === 0x11 &&
      bytes[3] === 0xe0,
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    extensions: [".xlsx"],
    signature: (bytes: Uint8Array) =>
      bytes[0] === 0x50 &&
      bytes[1] === 0x4b &&
      bytes[2] === 0x03 &&
      bytes[3] === 0x04,
  },
  "application/vnd.ms-excel": {
    extensions: [".xls"],
    signature: (bytes: Uint8Array) =>
      bytes[0] === 0xd0 &&
      bytes[1] === 0xcf &&
      bytes[2] === 0x11 &&
      bytes[3] === 0xe0,
  },
  "text/plain": {
    extensions: [".txt"],
    signature: () => true,
  },
  "text/csv": {
    extensions: [".csv"],
    signature: () => true,
  },
} as const;

export class LessonAttachmentUploadError extends Error {
  constructor(
    message: string,
    readonly kind: "invalid-file" | "storage-error" = "storage-error",
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "LessonAttachmentUploadError";
  }
}

function getStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new LessonAttachmentUploadError(
      "Lesson attachment uploads require the server-side Supabase service-role key.",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

type LessonStorageClient = ReturnType<typeof getStorageClient>;

async function ensureBucket(supabase: LessonStorageClient) {
  const { data: buckets, error: listError } =
    await supabase.storage.listBuckets();
  if (listError) {
    throw new LessonAttachmentUploadError(
      "Could not check Supabase Storage for the lesson attachment bucket.",
      "storage-error",
      { cause: listError },
    );
  }
  if (buckets.some((bucket) => bucket.name === bucketName)) return;

  const { error: createError } = await supabase.storage.createBucket(
    bucketName,
    {
      public: true,
      fileSizeLimit: maximumFileSize,
      allowedMimeTypes: Object.keys(allowedFiles),
    },
  );
  if (!createError) return;

  const { data: refreshedBuckets, error: refreshError } =
    await supabase.storage.listBuckets();
  if (
    refreshError ||
    !refreshedBuckets.some((bucket) => bucket.name === bucketName)
  ) {
    throw new LessonAttachmentUploadError(
      "Could not create the public lesson attachment bucket in Supabase Storage.",
      "storage-error",
      { cause: refreshError ?? createError },
    );
  }
}

export async function uploadLessonAttachment(file: File, lessonId: string) {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  const fileType = allowedFiles[file.type as keyof typeof allowedFiles];
  if (
    !fileType ||
    !fileType.extensions.some((allowedExtension) => allowedExtension === extension) ||
    file.size === 0 ||
    file.size > maximumFileSize
  ) {
    throw new LessonAttachmentUploadError(
      "Choose a PDF, Word, PowerPoint, Excel, TXT, or CSV file up to 20 MB.",
      "invalid-file",
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!fileType.signature(bytes)) {
    throw new LessonAttachmentUploadError(
      "The selected file does not match its declared document type.",
      "invalid-file",
    );
  }

  const supabase = getStorageClient();
  await ensureBucket(supabase);
  const storagePath = `${lessonId}/${randomUUID()}${extension}`;
  const { error } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, Buffer.from(bytes), {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });
  if (error) {
    throw new LessonAttachmentUploadError(
      "Could not upload the lesson attachment to Supabase Storage.",
      "storage-error",
      { cause: error },
    );
  }

  return {
    storagePath,
    url: supabase.storage.from(bucketName).getPublicUrl(storagePath).data
      .publicUrl,
  };
}

export async function deleteLessonAttachment(storagePath: string) {
  const supabase = getStorageClient();
  const { error } = await supabase.storage
    .from(bucketName)
    .remove([storagePath]);
  if (error) {
    throw new LessonAttachmentUploadError(
      "Could not remove the lesson attachment from Supabase Storage.",
      "storage-error",
      { cause: error },
    );
  }
}
