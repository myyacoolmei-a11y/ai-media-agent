export const META_SETUP_STEPS = [
  {
    title: "建立 Meta 應用程式",
    body: "打開 https://developers.facebook.com/apps ，建立應用程式，類型選「商務」。設定 → 基本，複製 App ID 與 App 密鑰。對應 Railway：META_APP_ID、META_APP_SECRET。",
  },
  {
    title: "加入 Facebook 與 Instagram 產品",
    body: "在應用程式裡加入「Facebook 登入」與「Instagram」。開發模式只允許管理員／開發人員／測試人員發文；對外發文需通過審核並切成 Live。",
  },
  {
    title: "準備粉絲專頁與 Instagram 專業帳號",
    body: "要發文的 Facebook 粉絲專頁必須已存在。Instagram 需是專業帳號（商業或創作者），並在 Meta 商業設定裡連結到同一個粉絲專頁。",
  },
  {
    title: "用 Graph API Explorer 拿 Page Token",
    body: "打開 https://developers.facebook.com/tools/explorer/ ，右上角選剛建立的 App。權限至少勾 pages_show_list、pages_read_engagement、pages_manage_posts、instagram_basic、instagram_content_publish、business_management。產生 User Token 後呼叫 GET /me/accounts，回傳的 id 是 META_PAGE_ID，access_token 是該頁的 Page Access Token。",
  },
  {
    title: "換成長期 Page Access Token",
    body: "短效 token 很快會過期。先用 App ID／Secret 把 User Token 換成長期 token，再 GET /{page-id}?fields=access_token。把長期 Page Access Token 填進 Railway：META_PAGE_ACCESS_TOKEN。不要加 NEXT_PUBLIC_ 前綴，不要寫進程式碼。",
  },
  {
    title: "取得 Instagram Business Account ID",
    body: "用同一個 Page Token 呼叫 GET /{page-id}?fields=instagram_business_account。回傳的 instagram_business_account.id 填進 Railway：META_INSTAGRAM_ACCOUNT_ID。",
  },
  {
    title: "填進 Railway production Variables",
    body: "到 Railway 專案 sweet-wisdom → ai-media-agent → production → Variables，設定 META_APP_ID、META_APP_SECRET、META_PAGE_ID、META_PAGE_ACCESS_TOKEN、META_INSTAGRAM_ACCOUNT_ID。建議同時設定 PUBLIC_SITE_URL 為正式網站網址，Facebook 貼文才會帶正確文章連結。填完後重新部署，不要用 placeholder。",
  },
];
