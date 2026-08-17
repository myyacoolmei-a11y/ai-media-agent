import type { ContentItem, PublicContentItem } from "@/types/content";

const now = "2026-08-17T02:00:00.000Z";

function story(
  item: Omit<PublicContentItem, "status" | "media"> & {
    id: string;
    media?: PublicContentItem["media"];
  },
): PublicContentItem & { id: string } {
  return {
    ...item,
    status: "published",
    media: item.media ?? [],
  };
}

export const previewDemoStories: Array<PublicContentItem & { id: string }> = [
  story({
    id: "preview-focus-1",
    title: "都會交通改革上路，尖峰時刻改採彈性班距",
    slug: "city-transit-reform",
    summary:
      "交通部門宣布下一季起調整幹線班距，優先疏解早晚尖峰人潮，並同步公布轉乘補貼試辦範圍。",
    content:
      "交通部門今天公布都會幹線運輸調整方案，將在平日尖峰時段加密班次，離峰則改以彈性調度因應。\n\n方案重點包括三條跨區幹線優先實施、轉乘補貼試辦三個月，以及車站即時資訊看板升級。官員表示，目標是讓尖峰等候時間平均下降兩成。\n\n地方里長關注末班車是否提前，交通部門回應末班車時間維持不變，只調整中段班距。後續將依載客率每兩週檢討一次。",
    videoUrl: null,
    coverImage: "/demo/cover-focus.jpg",
    category: "政治",
    contentType: "article",
    publishedAt: "2026-08-17T01:30:00.000Z",
  }),
  story({
    id: "preview-news-2",
    title: "央行會議前市場觀望，出口商加速鎖匯",
    slug: "export-fx-hedge",
    summary:
      "利率決策前夕，中小型出口商提前鎖定美元部位，銀行估本週遠期外匯成交量高於月均。",
    content:
      "利率會議召開前，匯市呈現窄幅整理。多家銀行指出，電子與機械出口商本週明顯增加遠期結匯，以因應可能的匯率波動。\n\n分析師認為，即使利率維持不變，市場仍會依聲明措辭調整部位。財務主管建議企業分批鎖匯，避免單日集中成交。",
    videoUrl: null,
    coverImage: "/demo/cover-finance.jpg",
    category: "財經",
    contentType: "article",
    publishedAt: "2026-08-16T09:00:00.000Z",
  }),
  story({
    id: "preview-news-3",
    title: "社區診所延長夜間門診，慢性病領藥免再奔大醫院",
    slug: "community-clinic-hours",
    summary:
      "衛生單位與六家社區診所合作延長門診，讓慢性病處方箋可就近領藥，減少急診壅塞。",
    content:
      "衛生單位宣布社區診所夜間門診擴大試辦，平日延長至晚上九點，週六上午也開放慢性病追蹤。\n\n參與診所將串接雲端藥歷，民眾持有效處方箋即可領藥。官員強調這不是取代大醫院，而是把穩定病情的回診留在社區。",
    videoUrl: null,
    coverImage: "/demo/cover-society.jpg",
    category: "社會",
    contentType: "article",
    publishedAt: "2026-08-16T04:20:00.000Z",
  }),
  story({
    id: "preview-news-4",
    title: "氣候談判聚焦調適基金，島嶼國家要求年度檢討",
    slug: "climate-adaptation-fund",
    summary:
      "國際氣候會議進入部長級磋商，島嶼國家聯合提出調適基金應逐年檢討撥款效率。",
    content:
      "氣候談判進入部長協商，調適基金成為焦點。島嶼國家代表指出，既有撥款流程過長，無法對應極端天氣後的重建時程。\n\n會議主席建議先就年度檢討機制達成原則共識，細節交由工作組在會後九十天內提出。",
    videoUrl: null,
    coverImage: "/demo/cover-world.jpg",
    category: "國際",
    contentType: "article",
    publishedAt: "2026-08-15T11:10:00.000Z",
  }),
  story({
    id: "preview-news-5",
    title: "社區書店改開夜間共讀，週末人潮回到巷口",
    slug: "neighborhood-night-reading",
    summary:
      "三家獨立書店把週五、週六延長到晚上十點，用共讀桌與短講把人潮留在街區，而不是再往百貨移動。",
    content:
      "文化單位與三家獨立書店合作夜間共讀，週五、週六營業到晚上十點，並提供兩小時免費共讀席。\n\n店主表示，重點不是再賣更多新書，而是讓附近上班族有地方停留。短講主題從城市史到親子閱讀，報名幾乎每次額滿。\n\n里長希望下季把路燈與騎樓座位一併整理，讓散場動線更安全。",
    videoUrl: null,
    coverImage: "/demo/cover-lifestyle.jpg",
    category: "生活",
    contentType: "article",
    publishedAt: "2026-08-15T09:40:00.000Z",
  }),
  story({
    id: "preview-news-6",
    title: "工廠導入視覺檢測，品管從抽驗改成全檢",
    slug: "factory-vision-qc",
    summary:
      "中部零件廠把鏡頭裝上產線末端，瑕疵件在包裝前就被攔下，品管人員改看例外清單而不是逐件目視。",
    content:
      "一家中部金屬零件廠完成第一階段視覺檢測上線，白班產線末端改由鏡頭做全檢，抽驗只留作校正。\n\n廠長說，過去夜班最容易漏看細紋，現在例外件會進單獨料盒，隔日再由資深技師覆核。導入後兩週，客訴退貨比前月下降。\n\n下一步會把資料接到既有工單系統，讓同一瑕疵型態可以回推到模具保養週期。",
    videoUrl: null,
    coverImage: "/demo/cover-tech.jpg",
    category: "科技",
    contentType: "article",
    publishedAt: "2026-08-15T06:15:00.000Z",
  }),
  story({
    id: "preview-video-1",
    title: "夜市轉型紀實：攤商如何把排隊人潮變成可複製的服務",
    slug: "night-market-service",
    summary:
      "影音採訪三個老攤如何用動線、預點與外帶窗口，把週末尖峰變成可管理的服務流程。",
    content:
      "這支影音走進三個經營超過二十年的夜市攤位，記錄他們如何在不擴張座位的前提下提高翻桌與外帶效率。\n\n攤商說，關鍵不是再多一台機器，而是讓客人在排隊時就完成點餐。完整訪談與現場畫面見影片。",
    videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    coverImage: "/demo/cover-video-market.jpg",
    category: "生活",
    contentType: "video",
    publishedAt: "2026-08-15T08:00:00.000Z",
  }),
  story({
    id: "preview-video-2",
    title: "港口晨間作業：一艘貨櫃輪進港的九十分鐘",
    slug: "harbor-morning-shift",
    summary:
      "跟著早班調度走一趟碼頭，看引水、吊櫃與閘口如何在九十分鐘內完成一艘輪的靠泊。",
    content:
      "清晨五點，引水船先出海。這支影音以現場收音記錄一艘貨櫃輪靠泊、開艙到第一排櫃子落地的過程。\n\n港務人員表示，天氣穩定時這段流程可壓在九十分鐘內；風浪加大就得改為分段作業。",
    videoUrl: "https://www.youtube.com/watch?v=YE7VzlLtp-4",
    coverImage: "/demo/cover-video-harbor.jpg",
    category: "科技",
    contentType: "video",
    publishedAt: "2026-08-14T22:40:00.000Z",
  }),
];

export function listPreviewDemoStories(options: {
  limit?: number;
  videosOnly?: boolean;
  category?: string;
} = {}): PublicContentItem[] {
  const limit = options.limit ?? 30;
  let items = [...previewDemoStories].sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );
  if (options.category) {
    items = items.filter((item) => item.category === options.category);
  }
  if (options.videosOnly) {
    items = items.filter((item) => item.contentType === "video" || item.videoUrl);
  }
  return items.slice(0, limit);
}

export function getPreviewDemoStory(slug: string) {
  return previewDemoStories.find((item) => item.slug === slug) ?? null;
}

export function getPreviewDemoContentItems(): ContentItem[] {
  return previewDemoStories.map((item) => ({
    id: item.id,
    user_id: "11111111-1111-4111-8111-111111111111",
    project_id: null,
    style_profile_id: null,
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    content: item.content,
    video_url: item.videoUrl,
    category: item.category,
    content_type: item.contentType,
    status: "published",
    cover_asset_id: null,
    published_at: item.publishedAt,
    created_at: now,
    updated_at: item.publishedAt,
    cover_image: item.coverImage,
  }));
}

export function getPreviewDemoContentItem(id: string) {
  return getPreviewDemoContentItems().find((item) => item.id === id) ?? null;
}
