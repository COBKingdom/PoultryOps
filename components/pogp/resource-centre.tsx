
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Download, ExternalLink, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Resource = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  resource_type: string;
  external_url: string | null;
  published_at: string | null;
  created_at: string;
  has_file?: boolean;
};

const CATEGORIES = [
  { value: "all", label: "All resources" },
  { value: "starter_pack", label: "Starter Pack" },
  { value: "sales_toolkit", label: "Sales Toolkit" },
  { value: "product_training", label: "Product Training" },
  { value: "marketing_materials", label: "Marketing Materials" },
  { value: "live_sales_documents", label: "Live Sales Documents" },
  { value: "news_updates", label: "News & Updates" },
];

function categoryLabel(value: string) {
  return CATEGORIES.find((item) => item.value === value)?.label ?? value;
}

export default function ResourceCentre() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadResources = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const params = new URLSearchParams();

      if (category !== "all") params.set("category", category);
      if (search.trim()) params.set("search", search.trim());

      const response = await fetch(
        `/api/pogp/resources${params.size ? `?${params.toString()}` : ""}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to load resources.");
      }

      setResources(data.resources ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load resources.");
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  const recentResources = useMemo(
    () =>
      [...resources]
        .sort(
          (a, b) =>
            new Date(b.published_at ?? b.created_at).getTime() -
            new Date(a.published_at ?? a.created_at).getTime()
        )
        .slice(0, 3),
    [resources]
  );

  async function downloadResource(resource: Resource) {
    if (resource.resource_type === "link" && resource.external_url) {
      window.open(resource.external_url, "_blank", "noopener,noreferrer");
      return;
    }

    try {
      setDownloadingId(resource.id);
      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const response = await fetch(
        `/api/pogp/resources/${resource.id}/download`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to download this resource.");
      }

      const url =
        data.url ??
        data.signedUrl ??
        data.signed_url ??
        data.download_url;

      if (typeof url !== "string" || !url) {
        throw new Error("The download API did not return a download URL.");
      }

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to download resource.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#061f49] via-[#0b326d] to-[#0b57d0] p-6 text-white shadow-lg sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
            <BookOpen className="h-6 w-6 text-[#f5c75d]" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f5c75d]">
              Your partner toolkit
            </p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
              Everything you need to grow
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
              Access sales guides, product training and marketing materials
              to help you explain PoultryOps and turn prospects into customers.
            </p>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button
            type="button"
            onClick={() => void loadResources()}
            className="ml-3 font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_260px]">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search guides, training and materials..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-[#0b57d0]"
            />
          </div>

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
          >
            {CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {!loading && resources.length > 0 && (
        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-[#081f46]">
                Recently published
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                The latest resources available to you.
              </p>
            </div>
            <span className="text-sm text-slate-500">
              {resources.length} {resources.length === 1 ? "resource" : "resources"}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {recentResources.map((resource) => (
              <div
                key={resource.id}
                className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-[#0b57d0]">
                  {categoryLabel(resource.category)}
                </p>
                <h4 className="mt-2 font-bold text-[#081f46]">
                  {resource.title}
                </h4>
                <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600">
                  {resource.description || "Open this resource for more information."}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-4 text-lg font-bold text-[#081f46]">
          Resource library
        </h3>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Loading your resources...
          </div>
        ) : resources.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <BookOpen className="mx-auto h-9 w-9 text-slate-300" />
            <h4 className="mt-3 font-bold text-[#081f46]">
              No resources found
            </h4>
            <p className="mt-2 text-sm text-slate-500">
              Try another search or category. Newly published resources will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {resources.map((resource) => (
              <article
                key={resource.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0b57d0]">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      {categoryLabel(resource.category)}
                    </span>
                    <h4 className="mt-2 text-base font-bold text-[#081f46]">
                      {resource.title}
                    </h4>
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {resource.description || "No description provided."}
                </p>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-400">
                    {resource.resource_type === "link" ? "External link" : "Downloadable resource"}
                  </span>
                  <button
                    type="button"
                    disabled={downloadingId === resource.id}
                    onClick={() => void downloadResource(resource)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0b57d0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0849b5] disabled:opacity-50"
                  >
                    {resource.resource_type === "link" ? (
                      <ExternalLink className="h-4 w-4" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {downloadingId === resource.id
                      ? "Opening..."
                      : resource.resource_type === "link"
                        ? "Open resource"
                        : "Download"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
