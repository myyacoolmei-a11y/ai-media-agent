"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileAudio,
  FileImage,
  FileVideo2,
  Mic,
  Square,
  Upload,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn, formatFileSize } from "@/lib/utils";
import type { ProductionBrief } from "@/types/analysis";
import type { BrandStyleProfile } from "@/types/style";

type MediaChoice = "video" | "photos" | "audio";

const steps = ["上傳素材", "內容用途", "發布平台", "內容風格", "確認製作"];
const purposes = [
  "品牌介紹",
  "產品介紹",
  "活動紀錄",
  "人物訪談",
  "新聞報導",
  "社群日常",
  "自訂",
];
const platforms = ["Facebook", "Instagram", "Threads", "TikTok", "YouTube"];
const mediaSettings: Record<
  MediaChoice,
  {
    title: string;
    hint: string;
    accept: string;
    multiple: boolean;
    icon: typeof FileVideo2;
  }
> = {
  video: {
    title: "上傳影片",
    hint: "MP4、MOV、WebM，最大 500 MB",
    accept: "video/mp4,video/quicktime,video/webm",
    multiple: false,
    icon: FileVideo2,
  },
  photos: {
    title: "上傳多張照片",
    hint: "JPG、PNG、WebP，可一次選擇多張",
    accept: "image/jpeg,image/png,image/webp",
    multiple: true,
    icon: FileImage,
  },
  audio: {
    title: "錄製或上傳語音",
    hint: "MP3、WAV、M4A，或直接使用麥克風",
    accept: "audio/*",
    multiple: false,
    icon: FileAudio,
  },
};

export function ProjectCreateForm({
  initialType = "video",
  providerStatus,
  brandStyles,
}: {
  initialType?: MediaChoice;
  providerStatus: {
    configured: boolean;
    missing: readonly string[];
    message: string | null;
  };
  brandStyles: BrandStyleProfile[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [step, setStep] = useState(0);
  const [mediaType, setMediaType] = useState<MediaChoice>(
    initialType === "video" ? initialType : "video",
  );
  const [files, setFiles] = useState<File[]>([]);
  const [purpose, setPurpose] = useState("");
  const [customPurpose, setCustomPurpose] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedStyleId, setSelectedStyleId] = useState(
    brandStyles[0]?.id ?? "",
  );
  const [originalRequest, setOriginalRequest] = useState("");
  const [targetDuration, setTargetDuration] =
    useState<ProductionBrief["targetDuration"]>("由 AI 建議");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isRecording) return;
    const timer = window.setInterval(
      () => setRecordingSeconds((value) => value + 1),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [isRecording]);

  useEffect(
    () => () => streamRef.current?.getTracks().forEach((track) => track.stop()),
    [],
  );

  const setting = mediaSettings[mediaType];

  function selectMediaType(type: MediaChoice) {
    if (type !== "video") {
      setError("照片與語音的真實分析將在下一階段提供，本階段請上傳影片。");
      return;
    }
    setMediaType(type);
    setFiles([]);
    setError("");
  }

  function acceptFiles(nextFiles: File[]) {
    if (!nextFiles.length) return;
    const accepted = setting.multiple ? nextFiles : [nextFiles[0]];
    setFiles(accepted);
    setError("");
  }

  async function startRecording() {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setError("此瀏覽器無法直接錄音，請改用上傳音訊檔。");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const file = new File(chunksRef.current, "我的錄音.webm", {
          type: recorder.mimeType || "audio/webm",
        });
        setFiles([file]);
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      setRecordingSeconds(0);
      setIsRecording(true);
      setError("");
    } catch {
      setError("無法使用麥克風，請確認瀏覽器權限或改用上傳。");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setIsRecording(false);
  }

  function canContinue() {
    if (step === 0) return files.length > 0 && originalRequest.trim().length >= 5;
    if (step === 1) return purpose && (purpose !== "自訂" || customPurpose.trim());
    if (step === 2) return selectedPlatforms.length > 0;
    if (step === 3) return Boolean(selectedStyleId && targetDuration);
    return true;
  }

  function nextStep() {
    if (!canContinue()) {
      setError(
        step === 0
          ? "請先加入影片，並輸入至少 5 個字的製作需求"
          : step === 2
            ? "請至少選擇一個發布平台"
            : "請先完成這個選擇",
      );
      return;
    }
    setError("");
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function submit() {
    if (!providerStatus.configured || !files[0]) {
      setError(
        providerStatus.message ?? "請先加入要分析的影片。",
      );
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const brief: ProductionBrief = {
        originalRequest: originalRequest.trim(),
        purpose: purpose === "自訂" ? customPurpose.trim() : purpose,
        platforms: selectedPlatforms,
        style:
          brandStyles.find((item) => item.id === selectedStyleId)?.style_name ??
          "",
        targetDuration,
        additionalNotes: additionalNotes.trim(),
      };
      const createResponse = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          styleProfileId: selectedStyleId,
          brief,
          file: {
            name: files[0].name,
            type: files[0].type,
            size: files[0].size,
          },
        }),
      });
      const created = (await createResponse.json()) as {
        projectId?: string;
        upload?: { path: string; token: string };
        error?: string;
      };
      if (!createResponse.ok || !created.projectId || !created.upload) {
        throw new Error(created.error || "無法建立分析工作。");
      }

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("project-media")
        .uploadToSignedUrl(
          created.upload.path,
          created.upload.token,
          files[0],
          { contentType: files[0].type },
        );
      if (uploadError) {
        throw new Error(`影片上傳失敗：${uploadError.message}`);
      }

      const completeResponse = await fetch(
        `/api/projects/${created.projectId}/complete`,
        { method: "POST" },
      );
      const completed = (await completeResponse.json()) as { error?: string };
      if (!completeResponse.ok) {
        throw new Error(completed.error || "無法開始分析工作。");
      }
      router.push(`/projects/${created.projectId}/processing`);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "影片上傳失敗。",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      {!providerStatus.configured && (
        <div className="mb-7 rounded-2xl border border-red-400/25 bg-red-400/[0.07] p-4">
          <p className="text-sm font-medium text-red-200">
            尚未設定 AI API，因此無法進行真實分析。
          </p>
          <p className="mt-2 text-xs leading-5 text-red-300/60">
            缺少：{providerStatus.missing.join("、")}
          </p>
        </div>
      )}
      <div className="mb-9">
        <div className="mb-4 flex items-center justify-between text-[11px] text-zinc-600">
          <span>
            步驟 {step + 1} / {steps.length}
          </span>
          <span className="text-zinc-400">{steps[step]}</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              disabled={index > step}
              onClick={() => index < step && setStep(index)}
              className={cn(
                "h-1 rounded-full transition",
                index <= step ? "bg-[#d9aeb4]" : "bg-white/[0.07]",
              )}
            />
          ))}
        </div>
      </div>

      <div className="min-h-[410px]">
        {step === 0 && (
          <section>
            <StepTitle
              title="先加入你的素材"
              description="選擇素材類型，再從手機或電腦加入檔案。"
            />
            <div className="mb-5 grid grid-cols-3 gap-2">
              {(
                [
                  ["video", "影片", FileVideo2],
                  ["photos", "照片", FileImage],
                  ["audio", "語音", Mic],
                ] as const
              ).map(([type, label, Icon]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => selectMediaType(type)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-xs transition",
                    mediaType === type
                      ? "border-[#deb5bb]/35 bg-[#deb5bb]/10 text-white"
                      : "border-white/[0.07] bg-white/[0.02] text-zinc-500 hover:text-zinc-300",
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.5} />
                  {label}
                  {type !== "video" && (
                    <span className="text-[9px] text-zinc-700">下一階段</span>
                  )}
                </button>
              ))}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept={setting.accept}
              multiple={setting.multiple}
              className="sr-only"
              onChange={(event) =>
                acceptFiles(Array.from(event.target.files ?? []))
              }
            />
            {files.length ? (
              <div className="space-y-2">
                {files.map((file, index) => {
                  const FileIcon = setting.icon;
                  return (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-3 rounded-2xl border border-[#deb5bb]/20 bg-[#deb5bb]/[0.05] p-4"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-[#e2b8bd]">
                        <FileIcon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-zinc-200">{file.name}</p>
                        <p className="mt-1 text-[11px] text-zinc-600">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label="移除素材"
                        onClick={() =>
                          setFiles((current) =>
                            current.filter((_, fileIndex) => fileIndex !== index),
                          )
                        }
                        className="grid size-8 place-items-center rounded-full text-zinc-600 hover:bg-white/5 hover:text-white"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="w-full rounded-2xl border border-dashed border-white/10 py-3 text-xs text-zinc-500 transition hover:border-white/20 hover:text-white"
                >
                  {setting.multiple ? "繼續加入照片" : "更換檔案"}
                </button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className={cn(
                    "flex min-h-44 flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-center transition hover:border-[#deb5bb]/35 hover:bg-[#deb5bb]/[0.04]",
                    mediaType !== "audio" && "sm:col-span-2",
                  )}
                >
                  <Upload className="mb-4 size-6 text-[#e2b8bd]" />
                  <span className="text-sm font-medium text-zinc-200">
                    {setting.title}
                  </span>
                  <span className="mt-2 text-[11px] text-zinc-600">
                    {setting.hint}
                  </span>
                </button>
                {mediaType === "audio" && (
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={cn(
                      "flex min-h-44 flex-col items-center justify-center rounded-3xl border p-5 text-center transition",
                      isRecording
                        ? "border-red-300/30 bg-red-300/[0.06]"
                        : "border-white/10 bg-white/[0.02] hover:border-[#deb5bb]/35",
                    )}
                  >
                    <span
                      className={cn(
                        "mb-4 grid size-12 place-items-center rounded-full",
                        isRecording
                          ? "bg-red-300 text-black"
                          : "bg-[#deb5bb]/10 text-[#e2b8bd]",
                      )}
                    >
                      {isRecording ? (
                        <Square className="size-4 fill-current" />
                      ) : (
                        <Mic className="size-5" />
                      )}
                    </span>
                    <span className="text-sm font-medium text-zinc-200">
                      {isRecording ? "完成錄音" : "直接開始錄音"}
                    </span>
                    <span className="mt-2 text-[11px] text-zinc-600">
                      {isRecording
                        ? `錄音中 ${Math.floor(recordingSeconds / 60)}:${String(recordingSeconds % 60).padStart(2, "0")}`
                        : "適合訪談、口述與靈感"}
                    </span>
                  </button>
                )}
              </div>
            )}
            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-medium text-zinc-300">
                你希望這支影片幫你達成什麼？
              </span>
              <textarea
                value={originalRequest}
                onChange={(event) => setOriginalRequest(event.target.value)}
                rows={3}
                placeholder="例如：整理新品特色，做成一支適合 Instagram、能吸引顧客詢問的影片"
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-white outline-none placeholder:text-zinc-700 focus:border-[#deb5bb]/40"
              />
            </label>
          </section>
        )}

        {step === 1 && (
          <section>
            <StepTitle
              title="這份內容要用在哪裡？"
              description="選擇最接近的用途，內容會更符合你的需求。"
            />
            <ChoiceGrid
              options={purposes}
              value={purpose}
              onChange={setPurpose}
            />
            {purpose === "自訂" && (
              <input
                autoFocus
                value={customPurpose}
                onChange={(event) => setCustomPurpose(event.target.value)}
                placeholder="簡單說明你想製作的內容"
                className="mt-4 h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-[#deb5bb]/40"
              />
            )}
          </section>
        )}

        {step === 2 && (
          <section>
            <StepTitle
              title="準備發布到哪些平台？"
              description="可以複選，我們會一起考慮各平台的閱讀習慣。"
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {platforms.map((platform) => {
                const selected = selectedPlatforms.includes(platform);
                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() =>
                      setSelectedPlatforms((current) =>
                        selected
                          ? current.filter((item) => item !== platform)
                          : [...current, platform],
                      )
                    }
                    className={cn(
                      "flex min-h-20 items-center justify-between rounded-2xl border px-4 text-left text-sm transition",
                      selected
                        ? "border-[#deb5bb]/35 bg-[#deb5bb]/10 text-white"
                        : "border-white/[0.07] bg-white/[0.02] text-zinc-400 hover:border-white/15",
                    )}
                  >
                    {platform}
                    <span
                      className={cn(
                        "grid size-5 place-items-center rounded-full border",
                        selected
                          ? "border-[#e2b8bd] bg-[#e2b8bd] text-black"
                          : "border-white/15",
                      )}
                    >
                      {selected && <Check className="size-3" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <StepTitle
              title="套用哪一套我的風格？"
              description="AI 會優先依照這套品牌設定產生文案與剪輯腳本。"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {brandStyles.map((brandStyle) => (
                <button
                  key={brandStyle.id}
                  type="button"
                  onClick={() => setSelectedStyleId(brandStyle.id)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition",
                    selectedStyleId === brandStyle.id
                      ? "border-[#deb5bb]/35 bg-[#deb5bb]/10"
                      : "border-white/[0.07] bg-white/[0.02] hover:border-white/15",
                  )}
                >
                  <p className="text-sm font-medium text-white">
                    {brandStyle.style_name}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-600">
                    {brandStyle.brand_description}
                  </p>
                </button>
              ))}
            </div>
            <div className="mt-7">
              <p className="mb-3 text-sm font-medium text-zinc-300">
                希望的影片長度
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(["15 秒", "30 秒", "60 秒", "由 AI 建議"] as const).map(
                  (duration) => (
                    <button
                      key={duration}
                      type="button"
                      onClick={() => setTargetDuration(duration)}
                      className={cn(
                        "rounded-xl border px-3 py-3 text-xs transition",
                        targetDuration === duration
                          ? "border-[#deb5bb]/35 bg-[#deb5bb]/10 text-white"
                          : "border-white/[0.07] text-zinc-500 hover:text-white",
                      )}
                    >
                      {duration}
                    </button>
                  ),
                )}
              </div>
            </div>
          </section>
        )}

        {step === 4 && (
          <section>
            <StepTitle
              title="一切準備好了"
              description="確認設定後，就把整理與規劃交給 AI。"
            />
            <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025]">
              <SummaryRow label="素材" value={`${files.length} 個${mediaType === "photos" ? "照片" : "檔案"}`} />
              <SummaryRow
                label="用途"
                value={purpose === "自訂" ? customPurpose : purpose}
              />
              <SummaryRow label="平台" value={selectedPlatforms.join("、")} />
              <SummaryRow
                label="本次使用風格"
                value={
                  brandStyles.find((item) => item.id === selectedStyleId)
                    ?.style_name ?? ""
                }
              />
              <SummaryRow label="影片長度" value={targetDuration} />
              <SummaryRow label="製作需求" value={originalRequest} />
            </div>
            <label className="mt-5 block">
              <span className="mb-2 block text-xs text-zinc-500">
                還有其他想補充的嗎？（選填）
              </span>
              <textarea
                value={additionalNotes}
                onChange={(event) => setAdditionalNotes(event.target.value)}
                rows={3}
                placeholder="例如：不要使用過度誇張的語氣，結尾要引導私訊"
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-white outline-none placeholder:text-zinc-700 focus:border-[#deb5bb]/40"
              />
            </label>
            <Button
              type="button"
              size="lg"
              onClick={submit}
              disabled={isSubmitting || !providerStatus.configured}
              className="mt-6 w-full"
            >
              {isSubmitting ? "正在上傳影片…" : "讓 AI 幫我完成"}
              {!isSubmitting && <ArrowRight className="size-4" />}
            </Button>
          </section>
        )}
      </div>

      {error && <p className="mt-5 text-xs text-red-300">{error}</p>}
      {step < 4 && (
        <div className="mt-8 flex items-center justify-between border-t border-white/[0.07] pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              step === 0 ? router.push("/admin/assistant") : setStep((current) => current - 1)
            }
          >
            <ArrowLeft className="size-4" />
            返回
          </Button>
          <Button type="button" onClick={nextStep}>
            下一步
            <ArrowRight className="size-4" />
          </Button>
        </div>
      )}
      {step === 4 && (
        <button
          type="button"
          onClick={() => setStep(3)}
          className="mt-5 w-full text-center text-xs text-zinc-600 transition hover:text-zinc-300"
        >
          返回修改設定
        </button>
      )}
    </div>
  );
}

function StepTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-7">
      <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
    </div>
  );
}

function ChoiceGrid({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "min-h-20 rounded-2xl border px-4 text-left text-sm transition",
            value === option
              ? "border-[#deb5bb]/35 bg-[#deb5bb]/10 text-white"
              : "border-white/[0.07] bg-white/[0.02] text-zinc-400 hover:border-white/15 hover:text-white",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-white/[0.06] px-5 py-4 last:border-0">
      <span className="text-xs text-zinc-600">{label}</span>
      <span className="max-w-[70%] text-right text-sm text-zinc-200">{value}</span>
    </div>
  );
}
