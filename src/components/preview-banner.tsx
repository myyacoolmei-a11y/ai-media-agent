import { isPreviewDemo } from "@/lib/preview";

export function PreviewBanner() {
  if (!isPreviewDemo()) return null;

  return (
    <div className="bg-[#d3b176] px-4 py-1.5 text-center text-[11px] font-medium leading-5 text-black">
      Preview 示範站 · 顯示測試報導，不會寫入 production
    </div>
  );
}
