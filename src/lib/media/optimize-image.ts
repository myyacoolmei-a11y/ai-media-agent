export function fitMaxSide(width: number, height: number, maxSide = 1920) {
  const longest = Math.max(width, height, 1);
  if (longest <= maxSide) return { width, height };
  const scale = maxSide / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function isLikelyImageFile(file: File) {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name);
}

export function isHeicFile(file: File) {
  return (
    /image\/hei(c|f)/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)
  );
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

async function decodeToImageBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, {
      imageOrientation: "from-image",
    } as ImageBitmapOptions);
  } catch (error) {
    console.error("createImageBitmap failed", error);
  }

  if (isHeicFile(file)) {
    try {
      const { heicTo } = await import("heic-to/next");
      return await heicTo({
        blob: file,
        type: "bitmap",
        options: { imageOrientation: "from-image" } as ImageBitmapOptions,
      });
    } catch (heicError) {
      console.error("HEIC conversion failed", heicError);
      throw new Error("圖片處理失敗，請重新選擇圖片");
    }
  }

  throw new Error("圖片處理失敗，請重新選擇圖片");
}

export async function optimizeArticleImage(file: File): Promise<File> {
  if (!isLikelyImageFile(file)) {
    throw new Error("圖片上傳失敗：檔案格式不支援");
  }

  const bitmap = await decodeToImageBitmap(file);
  const fitted = fitMaxSide(bitmap.width, bitmap.height, 1920);
  const alreadySmall =
    !isHeicFile(file) &&
    file.size <= 350 * 1024 &&
    fitted.width === bitmap.width &&
    fitted.height === bitmap.height &&
    /image\/(jpeg|jpg|png|webp)/i.test(file.type);

  if (alreadySmall) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = fitted.width;
  canvas.height = fitted.height;
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) {
    bitmap.close();
    throw new Error("圖片處理失敗，請重新選擇圖片");
  }
  context.drawImage(bitmap, 0, 0, fitted.width, fitted.height);
  bitmap.close();

  const tryTypes = ["image/webp", "image/jpeg"] as const;
  let best: { blob: Blob; type: (typeof tryTypes)[number] } | null = null;

  for (const type of tryTypes) {
    for (const quality of [0.82, 0.78, 0.72, 0.66]) {
      const blob = await canvasToBlob(canvas, type, quality);
      if (!blob || blob.size === 0) continue;
      if (!best || blob.size < best.blob.size) {
        best = { blob, type };
      }
      if (blob.size <= 1024 * 1024) {
        best = { blob, type };
        break;
      }
    }
    if (best && best.blob.size <= 1024 * 1024) break;
  }

  if (!best) {
    throw new Error("圖片處理失敗，請重新選擇圖片");
  }

  if (
    !isHeicFile(file) &&
    best.blob.size >= file.size &&
    /image\/(jpeg|jpg|png|webp)/i.test(file.type)
  ) {
    return file;
  }

  const extension = best.type === "image/webp" ? ".webp" : ".jpg";
  const name = file.name.replace(/\.[^.]+$/, "") + extension;
  return new File([best.blob], name, {
    type: best.type,
    lastModified: Date.now(),
  });
}
