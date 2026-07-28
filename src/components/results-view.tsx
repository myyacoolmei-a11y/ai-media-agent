"use client";

import {
  Check,
  Copy,
  Eye,
  Hash,
  ImageIcon,
  Pencil,
  RefreshCw,
  Save,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { mockAiResult } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function ResultsView() {
  const result = mockAiResult.content;
  const [copies, setCopies] = useState(() =>
    result.copyVariants.map((item) => ({ ...item })),
  );
  const [directions, setDirections] = useState(() =>
    result.editingDirections.map((item) => ({ ...item })),
  );
  const [selectedCopy, setSelectedCopy] = useState("short");
  const [selectedDirection, setSelectedDirection] = useState("social");
  const [editing, setEditing] = useState("");
  const [expanded, setExpanded] = useState("copy-short");
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [adjustment, setAdjustment] = useState("");

  async function copyAll() {
    const copy = copies.find((item) => item.id === selectedCopy) ?? copies[0];
    await navigator.clipboard?.writeText(
      `${result.titles[0]}\n\n${copy.content}\n\n${result.hashtags.join(" ")}`,
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  function refreshItem(kind: "copy" | "direction", id: string) {
    if (kind === "copy") {
      setCopies((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                content: `${item.content} 現在就一起看見，這份用心如何成為讓人記住的品牌故事。`,
              }
            : item,
        ),
      );
    } else {
      setDirections((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                description: `${item.description} 結尾加入一句簡單邀請，讓觀眾更容易採取下一步。`,
              }
            : item,
        ),
      );
    }
  }

  function refreshAll() {
    setIsRefreshing(true);
    window.setTimeout(() => {
      setIsRefreshing(false);
      setAdjustment("");
    }, 700);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-col justify-between gap-6 border-b border-white/[0.07] pb-9 sm:flex-row sm:items-end">
        <div>
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d3b176]/20 bg-[#d3b176]/[0.07] px-3 py-1.5 text-[11px] text-[#d3b176]">
            <Check className="size-3" />
            內容製作完成
          </span>
          <h1 className="text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">
            你的內容準備好了
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            先預覽各個版本，再選出最適合的一個。
          </p>
        </div>
        <Button variant="secondary" onClick={copyAll}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "已複製" : "複製選定內容"}
        </Button>
      </header>

      <div className="mt-8 space-y-7">
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

        <ResultSection
          number="02"
          title="三版文案"
          description="可直接預覽、修改，或換一個說法。"
        >
          <div className="space-y-3">
            {copies.map((variant) => {
              const key = `copy-${variant.id}`;
              return (
                <VersionCard
                  key={variant.id}
                  title={variant.label}
                  selected={selectedCopy === variant.id}
                  expanded={expanded === key}
                  editing={editing === key}
                  onPreview={() => setExpanded(expanded === key ? "" : key)}
                  onEdit={() => {
                    setExpanded(key);
                    setEditing(editing === key ? "" : key);
                  }}
                  onRefresh={() => refreshItem("copy", variant.id)}
                  onSelect={() => setSelectedCopy(variant.id)}
                >
                  {editing === key ? (
                    <textarea
                      value={variant.content}
                      onChange={(event) =>
                        setCopies((current) =>
                          current.map((item) =>
                            item.id === variant.id
                              ? { ...item, content: event.target.value }
                              : item,
                          ),
                        )
                      }
                      rows={5}
                      className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-zinc-200 outline-none focus:border-[#deb5bb]/35"
                    />
                  ) : (
                    <p className="text-sm leading-7 text-zinc-400">
                      {variant.content}
                    </p>
                  )}
                </VersionCard>
              );
            })}
          </div>
        </ResultSection>

        <ResultSection
          number="03"
          title="三版剪輯方向"
          description="先選擇節奏與長度，未來可交給剪輯工具繼續製作。"
        >
          <div className="space-y-3">
            {directions.map((direction) => {
              const key = `direction-${direction.id}`;
              return (
                <VersionCard
                  key={direction.id}
                  title={direction.label}
                  meta={direction.duration}
                  selected={selectedDirection === direction.id}
                  expanded={expanded === key}
                  editing={editing === key}
                  onPreview={() => setExpanded(expanded === key ? "" : key)}
                  onEdit={() => {
                    setExpanded(key);
                    setEditing(editing === key ? "" : key);
                  }}
                  onRefresh={() => refreshItem("direction", direction.id)}
                  onSelect={() => setSelectedDirection(direction.id)}
                >
                  {editing === key ? (
                    <textarea
                      value={direction.description}
                      onChange={(event) =>
                        setDirections((current) =>
                          current.map((item) =>
                            item.id === direction.id
                              ? { ...item, description: event.target.value }
                              : item,
                          ),
                        )
                      }
                      rows={3}
                      className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-zinc-200 outline-none focus:border-[#deb5bb]/35"
                    />
                  ) : (
                    <>
                      <p className="text-sm leading-7 text-zinc-400">
                        {direction.description}
                      </p>
                      <ol className="mt-5 grid gap-2 sm:grid-cols-3">
                        {direction.scenes.map((scene, index) => (
                          <li
                            key={scene}
                            className="rounded-xl bg-white/[0.03] p-3 text-xs leading-5 text-zinc-500"
                          >
                            <span className="mr-2 text-[#d3b176]">
                              {index + 1}.
                            </span>
                            {scene}
                          </li>
                        ))}
                      </ol>
                    </>
                  )}
                </VersionCard>
              );
            })}
          </div>
        </ResultSection>

        <ResultSection number="04" title="標題、Hashtag 與封面文字">
          <div className="grid gap-4 lg:grid-cols-3">
            <SuggestionCard icon={Pencil} title="標題">
              <ol className="space-y-3">
                {result.titles.map((title, index) => (
                  <li key={title} className="flex gap-3 text-xs leading-5 text-zinc-400">
                    <span className="text-zinc-700">0{index + 1}</span>
                    {title}
                  </li>
                ))}
              </ol>
            </SuggestionCard>
            <SuggestionCard icon={Hash} title="Hashtag">
              <div className="flex flex-wrap gap-2">
                {result.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/[0.04] px-2.5 py-1.5 text-[11px] text-zinc-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </SuggestionCard>
            <SuggestionCard icon={ImageIcon} title="封面文字">
              <div className="space-y-2">
                {result.coverTexts.map((text) => (
                  <div
                    key={text}
                    className="rounded-xl border border-white/[0.06] bg-[linear-gradient(135deg,rgba(222,181,187,0.08),transparent)] p-3 text-sm font-medium text-zinc-300"
                  >
                    {text}
                    <span className="text-[#d3b176]">.</span>
                  </div>
                ))}
              </div>
            </SuggestionCard>
          </div>
        </ResultSection>

        <ResultSection
          number="05"
          title="重新產生或自行修改"
          description="告訴我們想調整的方向，或直接回到上方修改文字。"
        >
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 sm:flex sm:items-end sm:gap-4">
            <label className="block flex-1">
              <span className="mb-2 block text-xs text-zinc-500">
                想改得更活潑、精簡，或更有故事感？
              </span>
              <input
                value={adjustment}
                onChange={(event) => setAdjustment(event.target.value)}
                placeholder="例如：希望語氣更親切，並縮短到兩段"
                className="h-12 w-full rounded-xl border border-white/[0.08] bg-black/20 px-4 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-[#deb5bb]/35"
              />
            </label>
            <Button
              type="button"
              variant="secondary"
              onClick={refreshAll}
              className="mt-3 w-full sm:mt-0 sm:w-auto"
            >
              <RefreshCw
                className={cn("size-4", isRefreshing && "animate-spin")}
              />
              {isRefreshing ? "重新整理中…" : "重新產生全部"}
            </Button>
          </div>
        </ResultSection>
      </div>
    </div>
  );
}

function ResultSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/[0.08] bg-[#100f10] p-5 sm:p-7">
      <div className="mb-6 flex items-start gap-4">
        <span className="pt-1 text-[10px] text-[#d3b176]">{number}</span>
        <div>
          <h2 className="text-lg font-medium tracking-[-0.02em] text-white">
            {title}
          </h2>
          {description && (
            <p className="mt-1.5 text-xs leading-5 text-zinc-600">
              {description}
            </p>
          )}
        </div>
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
  onPreview: () => void;
  onEdit: () => void;
  onRefresh: () => void;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border transition",
        selected
          ? "border-[#deb5bb]/30 bg-[#deb5bb]/[0.045]"
          : "border-white/[0.06] bg-white/[0.018]",
      )}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-zinc-200">{title}</h3>
            {meta && (
              <span className="rounded-full bg-white/[0.05] px-2 py-1 text-[10px] text-zinc-500">
                {meta}
              </span>
            )}
          </div>
          {selected && (
            <p className="mt-1 text-[10px] text-[#d3b176]">目前選擇</p>
          )}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <VersionAction
            icon={Eye}
            label="預覽"
            active={expanded && !editing}
            onClick={onPreview}
          />
          <VersionAction
            icon={editing ? Save : Pencil}
            label={editing ? "儲存" : "編輯"}
            active={editing}
            onClick={onEdit}
          />
          <VersionAction icon={RefreshCw} label="重新生成" onClick={onRefresh} />
          <VersionAction
            icon={Check}
            label="選擇此版本"
            active={selected}
            onClick={onSelect}
          />
        </div>
      </div>
      {expanded && (
        <div className="border-t border-white/[0.06] px-4 py-5 sm:px-5">
          {children}
        </div>
      )}
    </article>
  );
}

function VersionAction({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: typeof Eye;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        "flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[9px] transition sm:min-w-14",
        active
          ? "bg-[#deb5bb]/15 text-[#eccbd0]"
          : "bg-white/[0.03] text-zinc-600 hover:bg-white/[0.06] hover:text-zinc-300",
      )}
    >
      <Icon className="size-3.5" />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

function SuggestionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Pencil;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="size-3.5 text-[#d3b176]" />
        <h3 className="text-xs font-medium text-zinc-300">{title}</h3>
      </div>
      {children}
    </div>
  );
}
