"use client";

// Statement upload over XHR, because fetch can't report upload progress.
import { API_URL, ApiError, authHeader, parseApiError } from "@/lib/api";
import type { Statement } from "@/lib/models";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Checks a file before sending it; returns the same errors the API would. */
export function checkFile(file: File): ApiError | null {
  if (!/\.(pdf|csv)$/i.test(file.name)) {
    return new ApiError(422, "unsupported_file", "FinSight reads PDF and CSV statements. Export one from your bank app.");
  }
  if (file.size === 0) return new ApiError(400, "empty_file", "That file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) {
    return new ApiError(413, "file_too_large", "Statements can be up to 4 MB. Try a shorter period.");
  }
  return null;
}

/** Sends the file; `onSent` fires when the last byte is out and the server starts reading. */
export async function sendStatement(
  file: File,
  onProgress: (share: number) => void,
  onSent: () => void,
): Promise<Statement> {
  const headers = await authHeader();
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/statements`);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.upload.onload = onSent;
    xhr.onload = () => (xhr.status === 201 ? resolve(JSON.parse(xhr.responseText)) : reject(parseApiError(xhr.status, xhr.responseText)));
    xhr.onerror = () => reject(new ApiError(0, "offline", "We couldn't reach FinSight. Check your connection and try again."));
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}
