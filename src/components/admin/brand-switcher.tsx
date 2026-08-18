"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { Brand } from "@/types/brand";

export function BrandSwitcher({
  brands,
  activeBrandId,
}: {
  brands: Brand[];
  activeBrandId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimisticId, setOptimisticId] = useState<string | null>(null);
  const value = optimisticId ?? activeBrandId;

  async function select(brandId: string) {
    setOptimisticId(brandId);
    const response = await fetch("/api/brands/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandId }),
    });
    if (!response.ok) {
      setOptimisticId(null);
      return;
    }
    startTransition(() => {
      router.refresh();
      setOptimisticId(null);
    });
  }

  return (
    <label className="relative hidden sm:block">
      <span className="sr-only">目前品牌</span>
      <select
        value={value}
        disabled={pending}
        onChange={(event) => void select(event.target.value)}
        className="max-w-40 appearance-none rounded-full border border-white/10 bg-white/[0.04] py-2 pl-3 pr-7 text-xs text-zinc-200 outline-none hover:border-white/20"
      >
        {brands.map((brand) => (
          <option key={brand.id} value={brand.id}>
            {brand.name}
          </option>
        ))}
      </select>
    </label>
  );
}
