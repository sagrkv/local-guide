"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { apiClient } from "@/lib/api-client";

const citySchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  tagline: z.string().max(500).optional(),
  description: z.string().optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  centerLat: z.number({ error: "Must be a number" }).min(-90).max(90),
  centerLng: z.number({ error: "Must be a number" }).min(-180).max(180),
  defaultZoom: z.number().int().min(1).max(20).optional(),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function CityCreatePage() {
  const params = useParams();
  const router = useRouter();
  const adminPrefix = params.adminPrefix as string;

  const [form, setForm] = useState({
    name: "",
    tagline: "",
    description: "",
    state: "",
    country: "",
    centerLat: "",
    centerLng: "",
    defaultZoom: "13",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  const slug = slugify(form.name);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    const parsed = citySchema.safeParse({
      name: form.name,
      tagline: form.tagline || undefined,
      description: form.description || undefined,
      state: form.state || undefined,
      country: form.country || undefined,
      centerLat: form.centerLat ? parseFloat(form.centerLat) : undefined,
      centerLng: form.centerLng ? parseFloat(form.centerLng) : undefined,
      defaultZoom: form.defaultZoom ? parseInt(form.defaultZoom, 10) : undefined,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      setSaving(true);
      const res = await apiClient.createCity(parsed.data);
      const cityId = res.data?.id;
      router.push(`/${adminPrefix}/cities/${cityId}`);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to create city");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <nav className="flex items-center gap-1.5 text-[13px]">
        <Link href={`/${adminPrefix}/cities`} className="text-gray-400 hover:text-white">
          Cities
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-gray-600" />
        <span className="text-gray-200">New City</span>
      </nav>

      <h1 className="text-xl font-semibold">Create City</h1>

      {apiError && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-400">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="border border-gray-800 rounded-lg bg-gray-900 divide-y divide-gray-800/50">
          {/* Basic Info */}
          <div className="p-4 space-y-3">
            <h2 className="text-sm font-medium text-gray-200">Basic Info</h2>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400">Name <span className="text-red-400">*</span></label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="h-8 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none"
                placeholder="e.g. Jaipur"
              />
              {errors.name && <p className="text-red-400 text-xs">{errors.name}</p>}
              {slug && (
                <p className="text-xs text-gray-500">Slug: {slug}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400">Tagline</label>
              <input
                name="tagline"
                value={form.tagline}
                onChange={handleChange}
                className="h-8 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none"
                placeholder="The Pink City"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none resize-y min-h-[80px]"
                placeholder="A brief description of the city..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400">State</label>
                <input
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className="h-8 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none"
                  placeholder="Rajasthan"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400">Country</label>
                <input
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  className="h-8 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none"
                  placeholder="India"
                />
              </div>
            </div>
          </div>

          {/* Map Center */}
          <div className="p-4 space-y-3">
            <h2 className="text-sm font-medium text-gray-200">Map Center</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400">Latitude <span className="text-red-400">*</span></label>
                <input
                  name="centerLat"
                  value={form.centerLat}
                  onChange={handleChange}
                  type="number"
                  step="any"
                  className="h-8 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none"
                  placeholder="26.9124"
                />
                {errors.centerLat && <p className="text-red-400 text-xs">{errors.centerLat}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400">Longitude <span className="text-red-400">*</span></label>
                <input
                  name="centerLng"
                  value={form.centerLng}
                  onChange={handleChange}
                  type="number"
                  step="any"
                  className="h-8 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none"
                  placeholder="75.7873"
                />
                {errors.centerLng && <p className="text-red-400 text-xs">{errors.centerLng}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400">Zoom</label>
                <input
                  name="defaultZoom"
                  value={form.defaultZoom}
                  onChange={handleChange}
                  type="number"
                  min="1"
                  max="20"
                  className="h-8 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-4">
          <Link
            href={`/${adminPrefix}/cities`}
            className="h-8 px-3 inline-flex items-center rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 text-[13px] transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md bg-white text-gray-900 hover:bg-gray-100 text-[13px] font-medium transition-colors disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create City"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
