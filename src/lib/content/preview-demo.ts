import { storyMatchesTaxonomy } from "@/lib/content/categories";
import type { ArticleBlock } from "@/lib/content/article-blocks";
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
    title: "台中水岸空間重整，舊鐵道帶改成可夜間行走的城市廊道",
    slug: "city-transit-reform",
    summary:
      "市府宣布綠空廊道延伸段本季開放夜間照明與慢行優先時段，沿線市場、社區與轉乘點同步調整動線。",
    content:
      "台中舊鐵道沿線的綠空廊道延伸段今天公布開放時程。平日晚間七點到十點改為慢行優先，機車改走平行巷道，並在三處市場出入口增設行人燈號。\n\n交通單位表示，這不是再畫一條自行車道，而是把既有通勤、買菜與夜間活動疊在同一條廊道上。沿線里長最在意的是照明與散場動線，市府承諾先完成連續路燈，再談週末市集。\n\n後續三個月會依人流調整班距與臨停格。官員說，目標是讓這段走廊在天黑後仍走得進去，而不是只在週末拍照。",
    videoUrl: null,
    coverImage: "/demo/cover-focus.jpg",
    category: "地方/城市焦點",
    contentType: "article",
    publishedAt: "2026-08-17T01:30:00.000Z",
    articleBlocks: [
      { type: "text", data: { text: "第一段文字：廊道夜間照明先完成連續路燈，再談週末市集。" } },
      {
        type: "image",
        data: { url: "/file.svg", caption: "圖說一：沿線市場出入口" },
      },
      { type: "text", data: { text: "第二段文字：機車改走平行巷道，行人燈號在三處增設。" } },
      {
        type: "image",
        data: { url: "/globe.svg", caption: "圖說二：慢行優先時段" },
      },
      {
        type: "image",
        data: { url: "/next.svg", caption: "圖說三：舊鐵道帶現況" },
      },
      { type: "text", data: { text: "第三段文字：後續三個月依人流調整班距與臨停格。" } },
      {
        type: "image",
        data: { url: "/vercel.svg", caption: "圖說四：夜間照明示範" },
      },
      {
        type: "image",
        data: { url: "/window.svg", caption: "圖說五：散場動線" },
      },
    ],
  }),
  story({
    id: "preview-local-taichung",
    title: "逢甲周邊攤商重排動線，把排隊從騎樓移回店內",
    slug: "taichung-fengjia-queue",
    summary:
      "台中商圈自治會與攤商協議，熱門店改採預點與店內候位，週末尖峰不再整條騎樓停住。",
    content:
      "逢甲周邊幾家長年排隊的攤商，本週開始把候位移回店內或側巷。商圈自治會表示，重點不是減少客人，而是讓行人還走得過去。\n\n攤商說，預點單在傍晚六點後最有效，外帶窗口和外場分開後，騎樓不再被隊伍切成兩段。里長希望下個月把這套做法擴到另外三條巷弄。",
    videoUrl: null,
    coverImage: "/demo/cover-local-taichung.jpg",
    category: "地方/台中",
    contentType: "article",
    publishedAt: "2026-08-17T00:20:00.000Z",
  }),
  story({
    id: "preview-local-changhua",
    title: "鹿港夜間開放古街側巷，地方店家改打燈而不再封路",
    slug: "changhua-lukang-lanes",
    summary:
      "彰化鹿港把週末人潮導向兩條側巷，廟口改維持通行，店家用燈籠與短桌把人留在街區裡。",
    content:
      "鹿港公所與店家協會決定，熱門週末不再封閉主街。改成側巷照明、流動廁所與定點解說，讓遊客往裡走而不是停在牌樓前。\n\n老街店主說，封路看起來熱鬧，實際外地車把巷口堵住，附近住戶反而少出來。這次先試八週，再決定是否把平日也納入。",
    videoUrl: null,
    coverImage: "/demo/cover-local-changhua.jpg",
    category: "地方/彰化",
    contentType: "article",
    publishedAt: "2026-08-16T21:10:00.000Z",
  }),
  story({
    id: "preview-local-community",
    title: "社區診所延長夜間門診，慢性病領藥免再奔大醫院",
    slug: "community-clinic-hours",
    summary:
      "衛生單位與六家社區診所合作延長門診，讓慢性病處方箋可就近領藥，減少急診壅塞。",
    content:
      "衛生單位宣布社區診所夜間門診擴大試辦，平日延長至晚上九點，週六上午也開放慢性病追蹤。\n\n參與診所將串接雲端藥歷，民眾持有效處方箋即可領藥。官員強調這不是取代大醫院，而是把穩定病情的回診留在社區。",
    videoUrl: null,
    coverImage: "/demo/cover-society.jpg",
    category: "地方/社區",
    contentType: "article",
    publishedAt: "2026-08-16T18:40:00.000Z",
  }),
  story({
    id: "preview-local-city-2",
    title: "中區騎樓整平後，攤車改停指定格，行人重新有連續步道",
    slug: "city-arcade-walkway",
    summary:
      "城市焦點放在中區三條街的騎樓障礙物清運，攤車改停畫格，輪椅與娃娃車可以連續通行。",
    content:
      "中區這次不談再造願景，先把騎樓的固定障礙清掉。攤車改到指定格，店家招牌不得低於通行高度。\n\n里長說，城市焦點若只剩空拍圖，住的人感受不到。這三條街先走得平，再談週末市集。",
    videoUrl: null,
    coverImage: "/demo/cover-focus.jpg",
    category: "地方/城市焦點",
    contentType: "article",
    publishedAt: "2026-08-16T19:15:00.000Z",
  }),
  story({
    id: "preview-people-founder",
    title: "把工廠一角改成工作室，她用修補把訂單留在原鄉",
    slug: "founder-repair-workshop",
    summary:
      "中部創業者把閒置廠房改成維修與小量生產基地，讓附近老師傅的手藝變成可計價的服務。",
    content:
      "她沒有把工廠賣掉，而是把一條產線改成對外維修。附近做了三十年模具的師傅，現在依工單計時，而不是等大廠零星發包。\n\n「創業不是再發明一個品牌，是先讓手藝有地方接單。」她說，第一年只做修補與小量零件，反而比做自有商品更快穩定現金流。\n\n下一步是把學徒制度寫進工單系統，讓技術不會只停在同一批人身上。",
    videoUrl: null,
    coverImage: "/demo/cover-people-founder.jpg",
    category: "人物/創業人物",
    contentType: "article",
    publishedAt: "2026-08-16T14:00:00.000Z",
  }),
  story({
    id: "preview-clubs-jci",
    title: "青商會把例會改到市場後場，討論的是攤商保險而不是頒獎",
    slug: "jci-market-insurance",
    summary:
      "地方青商會本季例會移到市場會議室，主題從聯誼改成攤商意外險與工時，到場的多半是第二代。",
    content:
      "青商會這次沒有租飯店。例會改在市場後場，先聽三家攤商講尖峰工時，再討論團體保險能不能覆蓋臨時帮手。\n\n會長說，社團若只剩頒獎與拍照，年輕人不會來。他們先做一件具體的：讓會員店家用團體價投保，再把經驗寫成給其他社團複製的備忘錄。",
    videoUrl: null,
    coverImage: "/demo/cover-clubs.jpg",
    category: "地方/社團",
    contentType: "article",
    publishedAt: "2026-08-16T16:20:00.000Z",
  }),
  story({
    id: "preview-business-1",
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
    id: "preview-people-corporate",
    title: "第二代不急著換招牌，先把工廠的夜班變成可交接的流程",
    slug: "family-business-night-shift",
    summary:
      "中部零件廠的企業接班人把夜班從口頭交代改成工單與例外清單，讓老師傅的判斷寫得下來。",
    content:
      "這家工廠沒有立刻改名，也沒有對外宣布轉型。新任總經理先做的是把夜班從「問師傅」改成「看工單」。\n\n例外件進單獨料盒，隔日覆核。他說，企業要能交接，不是先換識別系統，而是讓第三班在沒有創辦人在場時也知道停哪一條線。",
    videoUrl: null,
    coverImage: "/demo/cover-world.jpg",
    category: "人物/企業人物",
    contentType: "article",
    publishedAt: "2026-08-16T11:20:00.000Z",
  }),
  story({
    id: "preview-people-local",
    title: "里長把空屋改成共煮廚房，週三晚上巷口重新有人說話",
    slug: "ward-community-kitchen",
    summary:
      "一位地方里長盤點三間空屋後，先做共煮與長輩便當，而不是再申請一座活動中心。",
    content:
      "社區最缺的不是另一個講堂，是平日晚上有地方把飯煮在一起。里長和志工把一間空屋清出來，週三開放共煮，週五送長輩便當。\n\n「人物不一定要上台。」他說，地方人物的工作是讓巷口重新有時間表。下季才要談是不是擴到隔壁里。",
    videoUrl: null,
    coverImage: "/demo/cover-lifestyle.jpg",
    category: "人物/地方人物",
    contentType: "article",
    publishedAt: "2026-08-16T10:05:00.000Z",
  }),
  story({
    id: "preview-clubs-rotary",
    title: "扶輪社與宮廟合辦夜間巡路，先補路燈再談捐款儀式",
    slug: "rotary-temple-lights",
    summary:
      "扶輪社這季不辦餐會頒獎，改與地方宮廟一起把三條暗巷的路燈補齊，並留下維修名冊。",
    content:
      "社團活動常停在捐贈畫面。這次扶輪社把預算拿去買路燈，宮廟負責找人巡檢，里辦公處列管損壞回報。\n\n社員說，公益若只剩儀式，巷子還是暗的。他們先做三條路，再決定要不要把同樣方法交給獅子會與地方協會。",
    videoUrl: null,
    coverImage: "/demo/cover-clubs.jpg",
    category: "地方/社團",
    contentType: "article",
    publishedAt: "2026-08-15T23:10:00.000Z",
  }),
  story({
    id: "preview-clubs-market",
    title: "商圈協會把週三夜市改成短攤，讓住戶先過門再談熱鬧",
    slug: "market-association-night",
    summary:
      "地方商圈協會與住戶開會後，週三夜市改短攤、十點收場，週末仍維持長攤，先把巷口讓出來。",
    content:
      "商圈要熱鬧，住戶要過門。協會這次把週三改成兩小時短攤，攤位不占騎樓，十點前收完。\n\n理事長說，社團與商圈不是對立，是把時段拆開。獅子會與地方協會也來觀摩動線。",
    videoUrl: null,
    coverImage: "/demo/cover-local-taichung.jpg",
    category: "地方/社團",
    contentType: "article",
    publishedAt: "2026-08-15T12:40:00.000Z",
  }),
  story({
    id: "preview-society-1",
    title: "夜間工地改設緩衝區，附近住戶不再被卸貨堵住巷口",
    slug: "night-construction-buffer",
    summary:
      "勞檢與區公所要求夜間工程把卸貨移入基地內，巷口恢復行人通行，噪音時段也一併重訂。",
    content:
      "一處都更工地連續三週在深夜佔用巷口卸貨，住戶陳情後，區公所與勞檢到場重劃緩衝區。\n\n建方需在基地內完成吊卸，晚上十點後禁止高噪音切割。里長說，社會新聞不一定是衝突畫面，有時是把公共空間還給走路的人。",
    videoUrl: null,
    coverImage: "/demo/cover-society.jpg",
    category: "社會",
    contentType: "article",
    publishedAt: "2026-08-16T04:20:00.000Z",
  }),
  story({
    id: "preview-lifestyle-1",
    title: "社區書店改開夜間共讀，週末人潮回到巷口",
    slug: "neighborhood-night-reading",
    summary:
      "三家獨立書店把週五、週六延長到晚上十點，用共讀桌與短講把人潮留在街區，而不是再往百貨移動。",
    content:
      "文化單位與三家獨立書店合作夜間共讀，週五、週六營業到晚上十點，並提供兩小時免費共讀席。\n\n店主表示，重點不是再賣更多新書，而是讓附近上班族有地方停留。短講主題從城市史到親子閱讀，報名幾乎每次額滿。",
    videoUrl: null,
    coverImage: "/demo/cover-lifestyle.jpg",
    category: "生活",
    contentType: "article",
    publishedAt: "2026-08-15T09:40:00.000Z",
  }),
  story({
    id: "preview-business-2",
    title: "中小企業把樣品間改成短鏈展售，買家不再只看型錄",
    slug: "sme-sample-room",
    summary:
      "傳產商會協助會員把工廠樣品間開放給中盤，讓議價發生在實體零件前，而不是只在通訊軟體傳圖。",
    content:
      "幾家機械零件廠開始每週開放樣品間兩小時。買家可以摸到公差與表面處理，訂單比較不容易在出貨後翻案。\n\n商會說，這是商業不是觀光。他們不收門票，只要求預約，讓業務與師傅同時在場。",
    videoUrl: null,
    coverImage: "/demo/cover-finance.jpg",
    category: "財經",
    contentType: "article",
    publishedAt: "2026-08-15T07:30:00.000Z",
  }),
  story({
    id: "preview-society-2",
    title: "長照接送改採共乘時段，偏遠社區週三終於有固定班",
    slug: "long-term-care-shuttle",
    summary:
      "社會局把零散接送收成固定時段共乘，偏遠里每週三有去程與回程，家屬不必再各叫一次車。",
    content:
      "過去長照交通是個案申請，車輛常常空駛。現在改成社區共乘窗，先服務洗腎與復健時段。\n\n志工說，社會支持看起來像交通，其實是讓照顧者星期三可以排其他事。",
    videoUrl: null,
    coverImage: "/demo/cover-society.jpg",
    category: "社會",
    contentType: "article",
    publishedAt: "2026-08-15T05:50:00.000Z",
  }),
  story({
    id: "preview-tech-1",
    title: "工廠導入視覺檢測，品管從抽驗改成全檢",
    slug: "factory-vision-qc",
    summary:
      "中部零件廠把鏡頭裝上產線末端，瑕疵件在包裝前就被攔下，品管人員改看例外清單而不是逐件目視。",
    content:
      "一家中部金屬零件廠完成第一階段視覺檢測上線，白班產線末端改由鏡頭做全檢，抽驗只留作校正。\n\n廠長說，過去夜班最容易漏看細紋，現在例外件會進單獨料盒，隔日再由資深技師覆核。導入後兩週，客訴退貨比前月下降。",
    videoUrl: null,
    coverImage: "/demo/cover-tech.jpg",
    category: "科技",
    contentType: "article",
    publishedAt: "2026-08-15T06:15:00.000Z",
  }),
  story({
    id: "preview-lifestyle-2",
    title: "黃昏市場留燈多兩小時，下班後還買得到熱食",
    slug: "evening-market-hours",
    summary:
      "兩處黃昏市場把收攤時間延後，讓通勤族不必在五點前趕回去，攤商則用預煮減少夜間損耗。",
    content:
      "市場自治會先試週三與週五。攤商把湯品與滷味改成可回溫的批次，而不是再進一批生鮮。\n\n生活的改變不一定在百貨，有時是市場多亮兩小時。",
    videoUrl: null,
    coverImage: "/demo/cover-local-taichung.jpg",
    category: "生活",
    contentType: "article",
    publishedAt: "2026-08-15T03:20:00.000Z",
  }),
  story({
    id: "preview-tech-2",
    title: "社區防災改看水位感測，里辦公處不再只轉傳群組訊息",
    slug: "community-flood-sensors",
    summary:
      "水利單位在易淹巷口裝水位尺與鏡頭，超過門檻才推播，里長不必整夜盯著群組截圖。",
    content:
      "過去防災靠住戶拍照上傳。現在三處低窪點有感測，超過標尺才發通知，減少無效警報。\n\n科技處說，這不是智慧城市展示，是讓值班的人睡得著，又能在真的漲水時出門。",
    videoUrl: null,
    coverImage: "/demo/cover-tech.jpg",
    category: "科技",
    contentType: "article",
    publishedAt: "2026-08-14T20:00:00.000Z",
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
    category: "影音",
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
    category: "影音",
    contentType: "video",
    publishedAt: "2026-08-14T22:40:00.000Z",
  }),
];

export function listPreviewDemoStories(options: {
  limit?: number;
  videosOnly?: boolean;
  category?: string;
  section?: string;
  topic?: string;
} = {}): PublicContentItem[] {
  const limit = options.limit ?? 30;
  let items = [...previewDemoStories].sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );
  items = items.filter((item) => storyMatchesTaxonomy(item.category, options));
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
    article_blocks: (item.articleBlocks ?? []).map(
      (block, index): ArticleBlock =>
        block.type === "text"
          ? {
              id: `${item.id}-text-${index}`,
              type: "text",
              data: { text: block.data.text },
            }
          : {
              id: `${item.id}-image-${index}`,
              type: "image",
              data: {
                url: block.data.url,
                caption: block.data.caption,
                assetId: null,
                storagePath: null,
              },
            },
    ),
  }));
}

export function getPreviewDemoContentItem(id: string) {
  return getPreviewDemoContentItems().find((item) => item.id === id) ?? null;
}
