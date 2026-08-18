"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import type { BrandMemberRow } from "@/lib/brands/members";
import type { Brand, BrandAccessRole } from "@/types/brand";

const roleLabels: Record<BrandAccessRole, string> = {
  super_admin: "Super Admin",
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
};

export function BrandManagement({
  brands,
  members,
}: {
  brands: Brand[];
  members: BrandMemberRow[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [brandId, setBrandId] = useState(brands[0]?.id ?? "");
  const [role, setRole] = useState<BrandAccessRole>("editor");

  async function createBrand(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch("/api/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug }),
    });
    const payload = (await response.json()) as { error?: string };
    setSaving(false);
    if (!response.ok) {
      setError(payload.error ?? "無法新增品牌。");
      return;
    }
    setName("");
    setSlug("");
    router.refresh();
  }

  async function grantAccess(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch("/api/brands/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, brandId, role, isDefault: true }),
    });
    const payload = (await response.json()) as { error?: string };
    setSaving(false);
    if (!response.ok) {
      setError(payload.error ?? "無法更新帳號權限。");
      return;
    }
    setEmail("");
    router.refresh();
  }

  async function revoke(member: BrandMemberRow) {
    setSaving(true);
    setError("");
    const response = await fetch("/api/brands/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: member.user_id, brandId: member.brand_id }),
    });
    const payload = (await response.json()) as { error?: string };
    setSaving(false);
    if (!response.ok) {
      setError(payload.error ?? "無法移除權限。");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-6">
        <h2 className="text-sm font-medium">現有品牌</h2>
        <div className="mt-4 space-y-2">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="flex items-center justify-between rounded-2xl border border-white/[0.06] px-4 py-3"
            >
              <div>
                <p className="text-sm text-zinc-200">{brand.name}</p>
                <p className="mt-1 text-[11px] text-zinc-600">{brand.slug}</p>
              </div>
              <span className="text-[11px] text-zinc-600">
                {brand.is_active ? "啟用" : "停用"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-6">
        <h2 className="text-sm font-medium">新增品牌</h2>
        <form onSubmit={createBrand} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="品牌名稱"
            className="h-11 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm outline-none"
            required
          />
          <input
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="slug，例如 fengbao"
            className="h-11 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm outline-none"
            required
          />
          <Button type="submit" disabled={saving} size="sm">
            新增
          </Button>
        </form>
      </section>

      <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-6">
        <h2 className="text-sm font-medium">帳號權限</h2>
        <form onSubmit={grantAccess} className="mt-4 grid gap-3 sm:grid-cols-[1.2fr_1fr_140px_auto]">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="登入 Email"
            className="h-11 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm outline-none"
            required
          />
          <select
            value={brandId}
            onChange={(event) => setBrandId(event.target.value)}
            className="h-11 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm outline-none"
          >
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
          <select
            value={role}
            onChange={(event) =>
              setRole(event.target.value as BrandAccessRole)
            }
            className="h-11 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm outline-none"
          >
            {(Object.keys(roleLabels) as BrandAccessRole[]).map((value) => (
              <option key={value} value={value}>
                {roleLabels[value]}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={saving} size="sm">
            授權
          </Button>
        </form>

        <div className="mt-5 space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-zinc-200">
                  {member.email ?? member.user_id}
                </p>
                <p className="mt-1 text-[11px] text-zinc-600">
                  {member.brand_name} · {roleLabels[member.role]}
                </p>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => void revoke(member)}
                className="text-xs text-zinc-600 hover:text-white"
              >
                移除
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
