"use client";

import { supabaseConfig } from "@/lib/supabase/config";

export function uploadToSignedUrlWithProgress(
  path: string,
  token: string,
  file: File,
  onProgress: (percent: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const encodedPath = path
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");
    const url = `${supabaseConfig.url}/storage/v1/object/upload/sign/content-media/${encodedPath}?token=${encodeURIComponent(token)}`;
    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", file);
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("apikey", supabaseConfig.anonKey);
    xhr.setRequestHeader("Authorization", `Bearer ${supabaseConfig.anonKey}`);
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.max(1, Math.round((event.loaded / event.total) * 100)));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
        return;
      }
      reject(new Error(xhr.responseText || `上傳失敗（${xhr.status}）`));
    };
    xhr.onerror = () => reject(new Error("上傳中斷，請再試一次。"));
    xhr.send(body);
  });
}
