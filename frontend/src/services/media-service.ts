import { ApiResponse } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export interface MediaUploadResult {
  url: string;
  originalFileName: string;
  storedFileName: string;
  contentType: string;
  sizeBytes: number;
}

/**
 * Uploads a single file to backend. Falls back to base64 DataURL if network fails.
 */
export async function uploadSingleImageApi(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE_URL}/media/upload`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data: ApiResponse<MediaUploadResult> = await res.json();
      if (data.success && data.data?.url) {
        // If relative URL returned, format with base domain or return as-is
        const url = data.data.url;
        return url.startsWith("http") ? url : `http://localhost:8080${url}`;
      }
    }
  } catch (err) {
    console.warn("Media API upload failed, falling back to local base64 DataURL:", err);
  }

  // Robust fallback: Return base64 Data URL so user can always see and use their uploaded image immediately!
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads multiple files sequentially or in parallel.
 */
export async function uploadMultipleImagesApi(files: File[]): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadSingleImageApi(file));
  return Promise.all(uploadPromises);
}
