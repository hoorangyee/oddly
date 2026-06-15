"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass } from "./ui";

export function GoToOrg() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const s = slug.trim().toLowerCase();
        if (s) router.push(`/${s}`);
      }}
      className="flex items-center gap-2"
    >
      <input
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="조직 slug (예: demo)"
        className={inputClass}
      />
      <button
        type="submit"
        className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
      >
        입장
      </button>
    </form>
  );
}
