import { META_SETUP_STEPS } from "@/lib/social/meta-setup";

export function MetaSetupGuide() {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#d3b176]">
        Meta
      </p>
      <h2 className="mt-2 text-lg font-medium">Facebook / Instagram 連線步驟</h2>
      <p className="mt-2 max-w-2xl text-xs leading-6 text-zinc-500">
        目前 Railway 還沒有 Meta credentials，不會假裝發文成功。請依序取得後填進
        production Variables。
      </p>
      <ol className="mt-5 space-y-4">
        {META_SETUP_STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-white/10 text-[11px] text-[#d3b176]">
              {index + 1}
            </span>
            <div>
              <p className="text-sm text-white">{step.title}</p>
              <p className="mt-1 text-[12px] leading-6 text-zinc-500">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
