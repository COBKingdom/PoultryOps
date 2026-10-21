
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/layout/app-shell";

type ResourceCategory =
  | "starter_pack"
  | "sales_toolkit"
  | "product_training"
  | "marketing_materials"
  | "live_sales_documents"
  | "news_updates";

type ResourceStatus = "draft" | "published" | "archived";
type ResourceType = "document" | "link";

type Resource = {
  id: string;
  title: string;
  description: string | null;
  category: ResourceCategory;
  resource_type: ResourceType;
  external_url: string | null;
  status: ResourceStatus;
  published_at: string | null;
  created_at: string;
  has_file?: boolean;
};

const CATEGORIES: { value: ResourceCategory; label: string }[] = [
  { value: "starter_pack", label: "Starter Pack" },
  { value: "sales_toolkit", label: "Sales Toolkit" },
  { value: "product_training", label: "Product Training" },
  { value: "marketing_materials", label: "Marketing Materials" },
  { value: "live_sales_documents", label: "Live Sales Documents" },
  { value: "news_updates", label: "News & Updates" },
];

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "starter_pack" as ResourceCategory,
  resource_type: "document" as ResourceType,
  external_url: "",
  status: "draft" as ResourceStatus,
};

export default function POGPResourcesAdminPage() {
  const router = useRouter();

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const getAuthHeaders = useCallback(async (): Promise<HeadersInit> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Your session has expired. Please sign in again.");
    }

    return { Authorization: `Bearer ${session.access_token}` };
  }, []);

  const loadResources = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const headers = await getAuthHeaders();
      const response = await fetch("/api/admin/pogp/resources?status=all", {
        headers,
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to load resources.");
      }

      setResources(data.resources ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load resources."
      );
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  function openCreateForm() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setSelectedFile(null);
    setMessage("");
    setError("");
    setShowForm(true);
  }

  function openEditForm(resource: Resource) {
    setEditing(resource);
    setForm({
      title: resource.title,
      description: resource.description ?? "",
      category: resource.category,
      resource_type: resource.resource_type,
      external_url: resource.external_url ?? "",
      status: resource.status,
    });
    setSelectedFile(null);
    setMessage("");
    setError("");
    setShowForm(true);
  }

  async function uploadSelectedFile(): Promise<string | null> {
    if (!selectedFile) return null;

    const headers = await getAuthHeaders();
    const body = new FormData();
    body.append("file", selectedFile);

    const response = await fetch("/api/admin/pogp/resources/upload", {
      method: "POST",
      headers,
      body,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "File upload failed.");
    }


const path =
  data.file?.storage_path ??
  data.storage_path ??
  data.storagePath ??
  data.path ??
  data.data?.path;


    if (typeof path !== "string" || !path) {
      throw new Error(
        "The upload response did not contain a storage path. No resource was saved. Please check the upload API response."
      );
    }

    return path;
  }

  async function saveResource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (!form.title.trim()) {
        throw new Error("Please enter a resource title.");
      }

      if (form.resource_type === "link") {
        let parsedUrl: URL;
        try {
          parsedUrl = new URL(form.external_url.trim());
        } catch {
          throw new Error("Enter a valid external URL, including https://.");
        }

        if (!["https:", "http:"].includes(parsedUrl.protocol)) {
          throw new Error("Only HTTP and HTTPS links are supported.");
        }
      }

      let storagePath: string | null = null;

      if (form.resource_type === "document") {
        if (selectedFile) {
          storagePath = await uploadSelectedFile();
        } else if (editing?.resource_type === "document") {
          // Keep the current file when editing without selecting a replacement.
          // The API retains the existing path if storage_path is omitted.
          storagePath = null;
        } else {
          throw new Error("Please select a file to upload.");
        }
      }

      const headers = await getAuthHeaders();
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        resource_type: form.resource_type,
        external_url:
          form.resource_type === "link" ? form.external_url.trim() : null,
        status: form.status,
      };

      if (storagePath) payload.storage_path = storagePath;

      // If changing from a file to a link, explicitly clear the file path.
      if (form.resource_type === "link") payload.storage_path = null;

      const isEditing = Boolean(editing);
      const url = isEditing
        ? `/api/admin/pogp/resources/${editing!.id}`
        : "/api/admin/pogp/resources";

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to save resource.");
      }

      setShowForm(false);
      setEditing(null);
      setSelectedFile(null);
      setForm({ ...EMPTY_FORM });
      setMessage(isEditing ? "Resource updated successfully." : "Resource created successfully.");
      await loadResources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save resource.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(resource: Resource, status: ResourceStatus) {
    const action =
      status === "published"
        ? "publish"
        : status === "archived"
          ? "archive"
          : "save as a draft";

    if (!window.confirm(`Are you sure you want to ${action} "${resource.title}"?`)) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/pogp/resources/${resource.id}`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Unable to ${action} this resource.`);
      }

      setMessage(`Resource ${status} successfully.`);
      await loadResources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update resource.");
    }
  }

  async function deleteResource(resource: Resource) {
    if (
      !window.confirm(
        `Delete "${resource.title}" permanently? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/pogp/resources/${resource.id}`, {
        method: "DELETE",
        headers,
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to delete resource.");
      }

      setMessage("Resource deleted from the library.");
      await loadResources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete resource.");
    }
  }

  const filteredResources = resources.filter((resource) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      resource.title.toLowerCase().includes(query) ||
      (resource.description ?? "").toLowerCase().includes(query);
    const matchesStatus =
      statusFilter === "all" || resource.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || resource.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const counts = {
    all: resources.length,
    draft: resources.filter((r) => r.status === "draft").length,
    published: resources.filter((r) => r.status === "published").length,
    archived: resources.filter((r) => r.status === "archived").length,
  };

  return (
    <AppShell>
      <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto max-w-7xl">
          <button
            type="button"
            onClick={() => router.push("/admin/pogp")}
            className="mb-5 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Back to POGP Management
          </button>

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-700">
                PoultryOps · POGP
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                Resource Management
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
                Create, organise and publish resources for your Growth Partners.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateForm}
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              + Add Resource
            </button>
          </div>

          {message && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {message}
            </div>
          )}

          {error && !showForm && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "All Resources", value: counts.all },
              { label: "Published", value: counts.published },
              { label: "Drafts", value: counts.draft },
              { label: "Archived", value: counts.archived },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search resources..."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
              Loading resources...
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <h2 className="text-lg font-semibold text-slate-900">
                No resources found
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Add your first resource or change your search filters.
              </p>
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              >
                + Add Resource
              </button>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredResources.map((resource) => {
                const categoryLabel =
                  CATEGORIES.find((c) => c.value === resource.category)?.label ??
                  resource.category;

                return (
                  <article
                    key={resource.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {categoryLabel}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          resource.status === "published"
                            ? "bg-emerald-50 text-emerald-700"
                            : resource.status === "archived"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {resource.status}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                        {resource.resource_type === "link" ? "External link" : "File"}
                      </span>
                    </div>

                    <h2 className="mt-4 text-lg font-bold text-slate-950">
                      {resource.title}
                    </h2>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {resource.description || "No description provided."}
                    </p>
                    <p className="mt-3 text-xs text-slate-400">
                      Added {new Date(resource.created_at).toLocaleDateString()}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        onClick={() => openEditForm(resource)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>

                      {resource.status !== "published" && (
                        <button
                          type="button"
                          onClick={() => void changeStatus(resource, "published")}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                          Publish
                        </button>
                      )}

                      {resource.status !== "draft" && (
                        <button
                          type="button"
                          onClick={() => void changeStatus(resource, "draft")}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Move to Draft
                        </button>
                      )}

                      {resource.status !== "archived" && (
                        <button
                          type="button"
                          onClick={() => void changeStatus(resource, "archived")}
                          className="rounded-lg border border-amber-200 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50"
                        >
                          Archive
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => void deleteResource(resource)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4 py-8">
            <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">
                    {editing ? "Edit Resource" : "Add Resource"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Resources marked Published are visible to active partners.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowForm(false)}
                  className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
                >
                  Close
                </button>
              </div>

              <form onSubmit={saveResource} className="space-y-5 p-5 sm:p-6">
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Resource title *
                  </label>
                  <input
                    required
                    maxLength={180}
                    value={form.title}
                    onChange={(event) =>
                      setForm({ ...form, title: event.target.value })
                    }
                    placeholder="e.g. PoultryOps Partner Starter Guide"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    maxLength={3000}
                    value={form.description}
                    onChange={(event) =>
                      setForm({ ...form, description: event.target.value })
                    }
                    placeholder="Explain what this resource helps partners do."
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Category *
                    </label>
                    <select
                      value={form.category}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          category: event.target.value as ResourceCategory,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Resource type *
                    </label>
                    <select
                      value={form.resource_type}
                      onChange={(event) => {
                        setForm({
                          ...form,
                          resource_type: event.target.value as ResourceType,
                        });
                        setSelectedFile(null);
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                    >
                      <option value="document">Upload a file</option>
                      <option value="link">External link</option>
                    </select>
                  </div>
                </div>

                {form.resource_type === "document" ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Resource file
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.mp4,.webm"
                      onChange={(event) =>
                        setSelectedFile(event.target.files?.[0] ?? null)
                      }
                      className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Maximum file size: 20 MB. Supported formats include PDF, Office documents, images and video.
                    </p>
                    {editing?.resource_type === "document" && !selectedFile && (
                      <p className="mt-2 text-xs font-medium text-blue-700">
                        The existing file will be retained unless you choose a replacement.
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      External URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={form.external_url}
                      onChange={(event) =>
                        setForm({ ...form, external_url: event.target.value })
                      }
                      placeholder="https://..."
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Publication status
                  </label>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value as ResourceStatus,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  >
                    <option value="draft">Draft — only admins manage it</option>
                    <option value="published">Published — available to partners</option>
                    <option value="archived">Archived — hidden from partners</option>
                  </select>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setShowForm(false)}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Saving..." : editing ? "Save Changes" : "Create Resource"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}
