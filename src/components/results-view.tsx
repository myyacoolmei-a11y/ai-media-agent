"use client";

import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Eye,
  Hash,
  ImageIcon,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn, formatDuration } from "@/lib/utils";
import type {
  AnalysisProjectResponse,
  GeneratedContent,
} from "@/types/analysis";

export function ResultsView({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [data, setData] = useState<AnalysisProjectResponse | null>(null);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [expanded, setExpanded] = useState("copy-short");
  const [editing, setEditing] = useState("");
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [adjustment, setAdjustment] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as
          | AnalysisProjectResponse
          | { error?: string };
        if (!response.ok) {
          throw new Error("error" in payload ? payload.error : "無法讀取結果。");
        }
        const projectData = payload as AnalysisProjectResponse;
        if (projectData.project.status === "processing") {
          router.replace(`/projects/${projectId}/processing`);
          return;
        }
        setData(projectData);
        setResult(projectData.result);
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "無法讀取分析結果。",
        );
      }
    }
    void load();
  }, [projectId, router]);

  async function patchProject(body: object) {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      throw new Error(payload.error || "儲存失敗。");
    }
  }

  async function saveChanges(key: string) {
    if (!result) return;
    setSaving(key);
    setError("");
    try {
      await patchProject({ action: "save-result", result });
      setEditing("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "儲存失敗。");
    } finally {
      setSaving("");
    }
  }

  async function selectVersions(
    copyVersion: "short" | "story" | "professional",
    editingVersion: "quick" | "social" | "full",
    coverText?: string,
  ) {
    setSaving("selection");
    setError("");
    try {
      await patchProject({
        action: "select-versions",
        copyVersion,
        editingVersion,
        coverText,
      });
      setData((current) =>
        current
          ? {
              ...current,
              project: {
                ...current.project,
                selectedCopyVersion: copyVersion,
                selectedEditingVersion: editingVersion,
                selectedCoverText: coverText ?? current.project.selectedCoverText,
              },
            }
          : current,
      );
    } catch (selectError) {
      setError(
        selectError instanceof Error ? selectError.message : "選擇版本失敗。",
      );
    } finally {
      setSaving("");
    }
  }

  async function regenerate(instruction: string) {
    setSaving("regenerate");
    setError("");
    try {
      const response = await fetch(`/api/projects/${projectId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "無法重新產生內容。");
      }
      router.push(`/projects/${projectId}/processing`);
    } catch (regenerateError) {
      setError(
        regenerateError instanceof Error
          ? regenerateError.message
          : "無法重新產生內容。",
      );
      setSaving("");
    }
  }

  async function adoptSegment(
    scriptId: string,
    segment: GeneratedContent["editingScripts"][number]["segments"][number],
  ) {
    setSaving(`segment-${scriptId}-${segment.startSeconds}`);
    setError("");
    try {
      await patchProject({
        action: "record-feedback",
        feedbackType: "segment_adopted",
        originalSuggestion: segment,
        userAction: "採用片段",
        finalChoice: segment,
      });
    } catch (segmentError) {
      setError(
        segmentError instanceof Error ? segmentError.message : "片段偏好儲存失敗。",
      );
    } finally {
      setSaving("");
    }
  }

  async function copySelected() {
    if (!result || !data) return;
    const selected =
      result.copyVariants.find(
        (variant) => variant.id === data.project.selectedCopyVersion,
      ) ?? result.copyVariants[0];
    await navigator.clipboard?.writeText(
      `${result.titles[0]}\n\n${selected.content}\n\n${result.hashtags.join(" ")}`,
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  if (!data && !error) {
    return (
      <div className="grid min-h-96 place-items-center text-zinc-500">
        <LoaderCircle className="size-6 animate-spin" />
      </div>
    );
  }

  if (error && !data) {
    return <ErrorPanel message={error} />;
  }

  if (!data || data.project.status === "failed" || !result) {
    return (
      <ErrorPanel
        message={
          data?.project.error ||
          "這次沒有產生可用結果。請確認 AI API 與 Supabase 設定。"
        }
      />
    );
  }

  const selectedCopy =
    data.project.selectedCopyVersion ?? result.copyVariants[0].id;
  const selectedEditing =
    data.project.selectedEditingVersion ?? result.editingScripts[0].id;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-col justify-between gap-6 border-b border-white/[0.07] pb-9 sm:flex-row sm:items-end">
        <div>
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d3b176]/20 bg-[#d3b176]/[0.07] px-3 py-1.5 text-[11px] text-[#d3b176]">
            <Check className="size-3" />
            本次使用：{data.project.styleProfileName}風格
          </span>
          <h1 className="text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">
            你的內容準備好了
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            結果來自本次上傳影片、逐字稿與製作需求。
          </p>
        </div>
        <Button variant="secondary" onClick={copySelected}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "已複製" : "複製選定內容"}
        </Button>
      </header>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-300/20 bg-red-300/[0.06] p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <section className="mt-8 rounded-[28px] border border-[#d3b176]/15 bg-[#d3b176]/[0.035] p-5 sm:p-7">
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#d3b176]">
            本次製作需求
          </p>
          <h2 className="mt-2 text-xl font-medium text-white">
            AI 對任務的理解
          </h2>
        </div>
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <BriefItem label="使用者原始需求" value={data.project.brief.originalRequest} />
          <BriefItem label="發布平台" value={data.project.brief.platforms.join("、")} />
          <BriefItem label="內容用途" value={data.project.brief.purpose} />
          <BriefItem label="風格" value={data.project.brief.style} />
          <BriefItem label="希望的影片長度" value={data.project.brief.targetDuration} />
          <BriefItem
            label="原片長度"
            value={
              data.media?.durationSeconds != null
                ? formatDuration(data.media.durationSeconds)
                : "未取得"
            }
          />
          <div className="sm:col-span-2">
            <BriefItem
              label="補充說明"
              value={data.project.brief.additionalNotes || "無"}
            />
          </div>
          <div className="sm:col-span-2">
            <BriefItem
              label="AI 理解後的任務摘要"
              value={data.project.aiTaskSummary || result.taskSummary}
              highlight
            />
          </div>
          <div className="sm:col-span-2">
            <BriefItem
              label="本次如何套用風格"
              value={result.styleApplicationSummary}
              highlight
            />
          </div>
        </div>
        <details className="mt-6 border-t border-white/[0.07] pt-5">
          <summary className="cursor-pointer text-xs text-zinc-500">
            查看真實逐字稿
          </summary>
          <p className="mt-4 whitespace-pre-wrap text-xs leading-6 text-zinc-500">
            {data.transcript?.text || "此影片沒有可辨識語音。"}
          </p>
        </details>
      </section>

      <div className="mt-7 space-y-7">
        <ResultSection number="01" title="內容摘要">
          <div className="grid gap-3 sm:grid-cols-3">
            {result.summary.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 text-sm leading-6 text-zinc-400"
              >
                <span className="mb-3 block size-1.5 rounded-full bg-[#d3b176]" />
                {item}
              </div>
            ))}
          </div>
        </ResultSection>

        <ResultSection number="02" title="三版文案">
          <div className="space-y-3">
            {result.copyVariants.map((variant) => {
              const key = `copy-${variant.id}`;
              const selected = selectedCopy === variant.id;
              return (
                <VersionCard
                  key={variant.id}
                  title={variant.label}
                  selected={selected}
                  expanded={expanded === key}
                  editing={editing === key}
                  saving={saving === key}
                  onPreview={() => setExpanded(expanded === key ? "" : key)}
                  onEdit={() => {
                    setExpanded(key);
                    if (editing === key) void saveChanges(key);
                    else setEditing(key);
                  }}
                  onRefresh={() =>
                    regenerate(`重新產生${variant.label}，其餘內容也保持一致。`)
                  }
                  onSelect={() =>
                    selectVersions(variant.id, selectedEditing)
                  }
                >
                  {editing === key ? (
                    <textarea
                      value={variant.content}
                      onChange={(event) =>
                        setResult((current) =>
                          current
                            ? {
                                ...current,
                                copyVariants: current.copyVariants.map((item) =>
                                  item.id === variant.id
                                    ? { ...item, content: event.target.value }
                                    : item,
                                ),
                              }
                            : current,
                        )
                      }
                      rows={7}
                      className="w-full resize-y rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-zinc-200 outline-none focus:border-[#deb5bb]/35"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-400">
                      {variant.content}
                    </p>
                  )}
                </VersionCard>
              );
            })}
          </div>
        </ResultSection>

        <ResultSection number="03" title="三版剪輯腳本">
          <div className="space-y-3">
            {result.editingScripts.map((script) => {
              const key = `script-${script.id}`;
              const selected = selectedEditing === script.id;
              return (
                <VersionCard
                  key={script.id}
                  title={script.label}
                  meta={`原片 ${formatDuration(Math.round(script.sourceVideoDurationSeconds))}`}
                  selected={selected}
                  expanded={expanded === key}
                  editing={editing === key}
                  saving={saving === key}
                  onPreview={() => setExpanded(expanded === key ? "" : key)}
                  onEdit={() => {
                    setExpanded(key);
                    if (editing === key) void saveChanges(key);
                    else setEditing(key);
                  }}
                  onRefresh={() =>
                    regenerate(`重新產生${script.label}，時間點必須來自原片。`)
                  }
                  onSelect={() => selectVersions(selectedCopy, script.id)}
                >
                  <ScriptDetails
                    script={script}
                    editing={editing === key}
                    onAdopt={(segment) => adoptSegment(script.id, segment)}
                    onChange={(nextScript) =>
                      setResult((current) =>
                        current
                          ? {
                              ...current,
                              editingScripts: current.editingScripts.map((item) =>
                                item.id === script.id ? nextScript : item,
                              ),
                            }
                          : current,
                      )
                    }
                  />
                </VersionCard>
              );
            })}
          </div>
        </ResultSection>

        <ResultSection number="04" title="標題、Hashtag 與封面文字">
          <div className="grid gap-4 lg:grid-cols-3">
            <SuggestionCard icon={Pencil} title="標題">
              {result.titles.map((title, index) => (
                <label key={index} className="mb-3 flex gap-3">
                  <span className="text-zinc-700">0{index + 1}</span>
                  <input
                    value={title}
                    onChange={(event) =>
                      setResult((current) =>
                        current
                          ? {
                              ...current,
                              titles: current.titles.map((item, titleIndex) =>
                                titleIndex === index ? event.target.value : item,
                              ),
                            }
                          : current,
                      )
                    }
                    className="min-w-0 flex-1 border-b border-white/[0.07] bg-transparent pb-2 text-xs leading-5 text-zinc-400 outline-none focus:border-[#deb5bb]/30"
                  />
                </label>
              ))}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={saving === "titles"}
                onClick={() => saveChanges("titles")}
                className="mt-2 w-full"
              >
                <Save className="size-3.5" />
                儲存標題修改
              </Button>
            </SuggestionCard>
            <SuggestionCard icon={Hash} title="Hashtag">
              <div className="flex flex-wrap gap-2">
                {result.hashtags.map((tag) => (
                  <span key={tag} className="rounded-full bg-white/[0.04] px-2.5 py-1.5 text-[11px] text-zinc-500">
                    {tag}
                  </span>
                ))}
              </div>
            </SuggestionCard>
            <SuggestionCard icon={ImageIcon} title="封面文字">
              {result.coverTexts.map((text) => (
                <button
                  type="button"
                  key={text}
                  onClick={() => selectVersions(selectedCopy, selectedEditing, text)}
                  className={cn(
                    "mb-2 w-full rounded-xl border p-3 text-left text-sm",
                    data.project.selectedCoverText === text
                      ? "border-[#deb5bb]/30 bg-[#deb5bb]/10 text-white"
                      : "border-white/[0.06] text-zinc-300",
                  )}
                >
                  {text}
                  {data.project.selectedCoverText === text && (
                    <span className="ml-2 text-[9px] text-[#d3b176]">已選擇</span>
                  )}
                </button>
              ))}
            </SuggestionCard>
          </div>
        </ResultSection>

        <ResultSection number="05" title="重新產生或自行修改">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 sm:flex sm:items-end sm:gap-4">
            <label className="block flex-1">
              <span className="mb-2 block text-xs text-zinc-500">
                輸入調整方向，系統會使用相同影片、逐字稿與需求重新分析。
              </span>
              <input
                value={adjustment}
                onChange={(event) => setAdjustment(event.target.value)}
                placeholder="例如：語氣更親切，並減少專業術語"
                className="h-12 w-full rounded-xl border border-white/[0.08] bg-black/20 px-4 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-[#deb5bb]/35"
              />
            </label>
            <Button
              type="button"
              variant="secondary"
              disabled={saving === "regenerate"}
              onClick={() => regenerate(adjustment)}
              className="mt-3 w-full sm:mt-0 sm:w-auto"
            >
              <RefreshCw className={cn("size-4", saving === "regenerate" && "animate-spin")} />
              重新產生全部
            </Button>
          </div>
        </ResultSection>
      </div>
    </div>
  );
}

type EditingScript = GeneratedContent["editingScripts"][number];

function ScriptDetails({
  script,
  editing,
  onAdopt,
  onChange,
}: {
  script: EditingScript;
  editing: boolean;
  onAdopt: (segment: EditingScript["segments"][number]) => void;
  onChange: (script: EditingScript) => void;
}) {
  if (editing) {
    return (
      <div className="space-y-4">
        <ScriptInput label="開頭鉤子" value={script.hook} onChange={(value) => onChange({ ...script, hook: value })} />
        {script.segments.map((segment, index) => (
          <div key={index} className="rounded-2xl border border-white/[0.07] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs text-[#d3b176]">段落 {index + 1}</p>
              <div className="flex gap-1">
                <button
                  type="button"
                  aria-label="片段上移"
                  disabled={index === 0}
                  onClick={() => moveSegment(script, index, index - 1, onChange)}
                  className="grid size-7 place-items-center rounded-lg text-zinc-600 hover:bg-white/5 hover:text-white disabled:opacity-20"
                >
                  <ArrowUp className="size-3" />
                </button>
                <button
                  type="button"
                  aria-label="片段下移"
                  disabled={index === script.segments.length - 1}
                  onClick={() => moveSegment(script, index, index + 1, onChange)}
                  className="grid size-7 place-items-center rounded-lg text-zinc-600 hover:bg-white/5 hover:text-white disabled:opacity-20"
                >
                  <ArrowDown className="size-3" />
                </button>
                <button
                  type="button"
                  aria-label="拒絕並移除此片段"
                  onClick={() =>
                    onChange({
                      ...script,
                      segments: script.segments.filter(
                        (_, segmentIndex) => segmentIndex !== index,
                      ),
                    })
                  }
                  className="grid size-7 place-items-center rounded-lg text-red-300/50 hover:bg-red-300/10 hover:text-red-300"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ScriptInput label="開始秒數" type="number" value={String(segment.startSeconds)} onChange={(value) => updateSegment(script, index, { startSeconds: Number(value) }, onChange)} />
              <ScriptInput label="結束秒數" type="number" value={String(segment.endSeconds)} onChange={(value) => updateSegment(script, index, { endSeconds: Number(value) }, onChange)} />
              <ScriptInput label="畫面說明" value={segment.visualDescription} onChange={(value) => updateSegment(script, index, { visualDescription: value }, onChange)} />
              <ScriptInput label="字幕文字" value={segment.subtitle} onChange={(value) => updateSegment(script, index, { subtitle: value }, onChange)} />
              <ScriptInput label="轉場建議" value={segment.transition} onChange={(value) => updateSegment(script, index, { transition: value }, onChange)} />
            </div>
          </div>
        ))}
        <ScriptInput label="剪輯節奏" value={script.editingPace} onChange={(value) => onChange({ ...script, editingPace: value })} />
        <ScriptInput label="字幕樣式" value={script.subtitleStyle} onChange={(value) => onChange({ ...script, subtitleStyle: value })} />
        <ScriptInput label="背景音樂氣氛" value={script.backgroundMusicMood} onChange={(value) => onChange({ ...script, backgroundMusicMood: value })} />
        <ScriptInput label="結尾行動呼籲" value={script.callToAction} onChange={(value) => onChange({ ...script, callToAction: value })} />
        <ScriptInput label="封面標題" value={script.coverTitle} onChange={(value) => onChange({ ...script, coverTitle: value })} />
        <ScriptInput label="Logo 位置" value={script.logoPosition} onChange={(value) => onChange({ ...script, logoPosition: value })} />
      </div>
    );
  }

  return (
    <div>
      {script.insufficientMaterial && (
        <div className="mb-5 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-3 text-xs leading-5 text-amber-200">
          素材不足：{script.insufficiencyReason}
        </div>
      )}
      <DetailRow label="影片總長度" value={formatDuration(Math.round(script.sourceVideoDurationSeconds))} />
      <DetailRow label="開頭鉤子" value={script.hook} />
      <div className="my-5 space-y-3">
        {script.segments.map((segment, index) => (
          <div key={`${segment.startSeconds}-${index}`} className="rounded-2xl border border-white/[0.06] bg-black/15 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-[#d3b176]">段落 {index + 1}</span>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-zinc-600">
                  {formatDuration(Math.round(segment.startSeconds))} — {formatDuration(Math.round(segment.endSeconds))}
                </span>
                <button
                  type="button"
                  onClick={() => onAdopt(segment)}
                  className="text-[10px] text-zinc-600 hover:text-[#d3b176]"
                >
                  採用此片段
                </button>
              </div>
            </div>
            <DetailRow label="畫面說明" value={segment.visualDescription} />
            <DetailRow label="字幕文字" value={segment.subtitle} />
            <DetailRow label="轉場建議" value={segment.transition} />
          </div>
        ))}
      </div>
      <DetailRow label="背景音樂氣氛" value={script.backgroundMusicMood} />
      <DetailRow label="剪輯節奏" value={script.editingPace} />
      <DetailRow label="字幕樣式" value={script.subtitleStyle} />
      <DetailRow label="結尾行動呼籲" value={script.callToAction} />
      <DetailRow label="封面標題" value={script.coverTitle} />
      <DetailRow label="Logo 位置" value={script.logoPosition} />
    </div>
  );
}

function updateSegment(
  script: EditingScript,
  index: number,
  values: Partial<EditingScript["segments"][number]>,
  onChange: (script: EditingScript) => void,
) {
  onChange({
    ...script,
    segments: script.segments.map((segment, segmentIndex) =>
      segmentIndex === index ? { ...segment, ...values } : segment,
    ),
  });
}

function moveSegment(
  script: EditingScript,
  from: number,
  to: number,
  onChange: (script: EditingScript) => void,
) {
  const segments = [...script.segments];
  const [segment] = segments.splice(from, 1);
  if (!segment) return;
  segments.splice(to, 0, segment);
  onChange({ ...script, segments });
}

function ScriptInput({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  type?: "text" | "number";
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] text-zinc-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-white/[0.08] bg-black/20 px-3 text-xs text-zinc-200 outline-none focus:border-[#deb5bb]/35"
      />
    </label>
  );
}

function BriefItem({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-zinc-600">{label}</p>
      <p className={cn("mt-1.5 text-sm leading-6", highlight ? "text-[#e8d3d6]" : "text-zinc-300")}>{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3 grid gap-1 sm:grid-cols-[120px_1fr]">
      <span className="text-[11px] text-zinc-600">{label}</span>
      <span className="text-xs leading-5 text-zinc-400">{value}</span>
    </div>
  );
}

function ResultSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-white/[0.08] bg-[#100f10] p-5 sm:p-7">
      <div className="mb-6 flex items-center gap-4">
        <span className="text-[10px] text-[#d3b176]">{number}</span>
        <h2 className="text-lg font-medium text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function VersionCard({
  title,
  meta,
  selected,
  expanded,
  editing,
  saving,
  onPreview,
  onEdit,
  onRefresh,
  onSelect,
  children,
}: {
  title: string;
  meta?: string;
  selected: boolean;
  expanded: boolean;
  editing: boolean;
  saving: boolean;
  onPreview: () => void;
  onEdit: () => void;
  onRefresh: () => void;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <article className={cn("overflow-hidden rounded-2xl border", selected ? "border-[#deb5bb]/30 bg-[#deb5bb]/[0.045]" : "border-white/[0.06]")}>
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-zinc-200">{title}</h3>
          <p className="mt-1 text-[10px] text-zinc-600">{selected ? "目前選擇" : meta}</p>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <VersionAction icon={Eye} label="預覽" active={expanded && !editing} onClick={onPreview} />
          <VersionAction icon={saving ? LoaderCircle : editing ? Save : Pencil} label={editing ? "儲存" : "編輯"} active={editing} onClick={onEdit} />
          <VersionAction icon={RefreshCw} label="重新生成" onClick={onRefresh} />
          <VersionAction icon={Check} label="選擇此版本" active={selected} onClick={onSelect} />
        </div>
      </div>
      {expanded && <div className="border-t border-white/[0.06] px-4 py-5 sm:px-5">{children}</div>}
    </article>
  );
}

function VersionAction({ icon: Icon, label, active = false, onClick }: { icon: typeof Eye; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[9px]", active ? "bg-[#deb5bb]/15 text-[#eccbd0]" : "bg-white/[0.03] text-zinc-600 hover:text-zinc-300")}>
      <Icon className="size-3.5" />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

function SuggestionCard({ icon: Icon, title, children }: { icon: typeof Pencil; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="size-3.5 text-[#d3b176]" />
        <h3 className="text-xs text-zinc-300">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-red-300/20 bg-red-300/[0.06] p-7 text-center">
      <AlertCircle className="mx-auto size-7 text-red-300" />
      <h1 className="mt-4 text-xl font-medium text-white">無法顯示真實分析結果</h1>
      <p className="mt-3 text-sm leading-6 text-red-100/70">{message}</p>
    </div>
  );
}
