"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

export function CourseImagePicker({
  currentImageUrl,
  required,
}: {
  currentImageUrl: string | null;
  required: boolean;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    const file = event.currentTarget.files?.[0] ?? null;
    const nextPreviewUrl = file ? URL.createObjectURL(file) : null;
    previewUrlRef.current = nextPreviewUrl;
    setPreviewUrl(nextPreviewUrl);
    setSelectedFile(file);
  }

  const shownImage = previewUrl ?? currentImageUrl;

  return (
    <div className="admin-course-image-picker admin-form-wide">
      <label>
        Course image
        <input
          accept="image/png,image/jpeg,image/webp"
          name="imageFile"
          onChange={handleFileChange}
          required={required}
          type="file"
        />
      </label>
      <p>
        PNG, JPEG, or WebP · maximum 4 MB.
        {currentImageUrl &&
          (selectedFile
            ? " The selected image will replace the current one."
            : " Choose a file to replace the current image.")}
      </p>
      {shownImage && (
        <Image
          alt={selectedFile ? "Selected course image preview" : "Current course image"}
          className="admin-course-image-preview"
          height={120}
          src={shownImage}
          unoptimized
          width={180}
        />
      )}
    </div>
  );
}
