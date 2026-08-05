"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

export function AdminFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [tier, setTier] = useState(searchParams.get("tier") || "");

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);

    if (query) params.set("query", query);
    else params.delete("query");

    if (status) params.set("status", status);
    else params.delete("status");

    if (tier) params.set("tier", tier);
    else params.delete("tier");

    router.push(`/admin/expedientes?${params.toString()}`);
  }, [query, status, tier, router, searchParams]);

  const handleClear = () => {
    setQuery("");
    setStatus("");
    setTier("");
    router.push("/admin/expedientes");
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
      <input
        type="text"
        placeholder="Buscar por usuario o país..."
        className="px-3 py-2 border border-line rounded text-sm focus:outline-none focus:border-brand"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select
        className="px-3 py-2 border border-line rounded text-sm focus:outline-none focus:border-brand bg-white"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="">Todos los Estados</option>
        <option value="draft">Borrador</option>
        <option value="collecting_documents">Reuniendo documentos</option>
        <option value="under_review">En revisión</option>
      </select>
      <select
        className="px-3 py-2 border border-line rounded text-sm focus:outline-none focus:border-brand bg-white"
        value={tier}
        onChange={(e) => setTier(e.target.value)}
      >
        <option value="">Todos los Niveles</option>
        <option value="FREE">Gratuito</option>
        <option value="PREMIUM">Premium</option>
      </select>
      <div className="flex gap-2">
        <button type="submit" className="px-4 py-2 bg-ink text-white font-medium rounded text-sm hover:bg-ink/80 transition">
          Filtrar
        </button>
        <button type="button" onClick={handleClear} className="px-4 py-2 bg-surface text-ink border border-line font-medium rounded text-sm hover:bg-soft transition">
          Limpiar
        </button>
      </div>
    </form>
  );
}
