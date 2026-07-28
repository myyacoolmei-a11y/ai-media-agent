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
import { DEMO_PROJECT_ID } from "@/lib/mock-data";
import { cn, formatFileSize } from "@/lib/utils";

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
const styles = ["專業", "親切", "活潑", "故事感", "新聞報導", "高級質感"];

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
}: {
  initialType?: MediaChoice;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [step, setStep] = useState(0);
  const [mediaType, setMediaType] = useState<MediaChoice>(initialType);
  const [files, setFiles] = useState<File[]>([]);
  const [purpose, setPurpose] = useState("");
  const [customPurpose, setCustomPurpose] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [style, setStyle] = useState("");
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
    if (step === 0) return files.length > 0;
    if (step === 1) return purpose && (purpose !== "自訂" || customPurpose.trim());
    if (step === 2) return selectedPlatforms.length > 0;
    if (step === 3) return Boolean(style);
    return true;
  }

  function nextStep() {
    if (!canContinue()) {
      setError(
        step === 0
          ? "請先加入素材"
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
    setIsSubmitting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    router.push(`/projects/${DEMO_PROJECT_ID}/processing`);
  }

  return (
    <div>
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
              title="你希望內容是什麼感覺？"
              description="先選一種主要風格，之後仍可自行修改。"
            />
            <ChoiceGrid options={styles} value={style} onChange={setStyle} />
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
              <SummaryRow label="風格" value={style} />
            </div>
            <Button
              type="button"
              size="lg"
              onClick={submit}
              disabled={isSubmitting}
              className="mt-6 w-full"
            >
              {isSubmitting ? "準備中…" : "讓 AI 幫我完成"}
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
              step === 0 ? router.push("/") : setStep((current) => current - 1)
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
