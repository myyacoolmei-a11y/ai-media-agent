export function mapMediaError(error: unknown, fallback = "圖片上傳失敗。") {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : error &&
            typeof error === "object" &&
            "message" in error &&
            typeof (error as { message: unknown }).message === "string"
          ? (error as { message: string }).message
        : "";
  const lower = raw.toLowerCase();

  if (
    /row-level security|permission denied|not allowed|unauthorized|jwt|rls|policy|403|storage 權限/i.test(
      raw,
    )
  ) {
    return "圖片上傳失敗：Storage 權限不足";
  }
  if (
    /mime|unsupported|not supported|invalid type|檔案格式|415|heic|heif/i.test(
      lower,
    )
  ) {
    return "圖片上傳失敗：檔案格式不支援";
  }
  if (/處理失敗|decode|bitmap|canvas|無法讀取/i.test(raw)) {
    return "圖片處理失敗，請重新選擇圖片";
  }
  if (raw.startsWith("圖片上傳失敗：") || raw.startsWith("圖片處理失敗")) {
    return raw;
  }
  if (raw.trim()) return `圖片上傳失敗：${raw}`;
  return fallback;
}
