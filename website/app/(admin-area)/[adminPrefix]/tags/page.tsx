"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
  _count?: { pois: number };
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState("#6366f1");
  const [formSaving, setFormSaving] = useState(false);

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getTags();
      setTags(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tags");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormName("");
    setFormColor("#6366f1");
  };

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setFormName(tag.name);
    setFormColor(tag.color ?? "#6366f1");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    try {
      setFormSaving(true);
      setError("");
      if (editingId) {
        await apiClient.updateTag(editingId, { name: formName, color: formColor });
      } else {
        await apiClient.createTag({ name: formName, color: formColor });
      }
      resetForm();
      await fetchTags();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save tag");
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tag?")) return;
    try {
      setError("");
      await apiClient.deleteTag(id);
      await fetchTags();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete tag");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tags</h1>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md bg-white text-gray-900 hover:bg-gray-100 text-[13px] font-medium transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Tag
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-400">{error}</div>
      )}

      {showForm && (
        <div className="border border-gray-800 rounded-lg bg-gray-900 p-4 space-y-3">
          <h2 className="text-sm font-medium text-gray-200">
            {editingId ? "Edit Tag" : "New Tag"}
          </h2>
          <div className="flex items-end gap-3">
            <div className="space-y-1 flex-1 min-w-[180px]">
              <label className="text-xs font-medium text-gray-400">Name</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-8 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none"
                placeholder="Tag name"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400">Color</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="h-8 w-10 rounded border border-gray-700 bg-transparent cursor-pointer"
                />
                <input
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="h-8 w-[90px] rounded-md border border-gray-700 bg-gray-950 px-2 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={formSaving || !formName.trim()}
              className="h-7 px-3 rounded-md bg-white text-gray-900 hover:bg-gray-100 text-[13px] font-medium transition-colors disabled:opacity-50"
            >
              {formSaving ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
            <button
              onClick={resetForm}
              className="h-7 px-3 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 text-[13px] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent border-t-transparent" />
        </div>
      )}

      {!loading && (
        <div className="border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900/50 border-b border-gray-800">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Color</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Usage</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {tags.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-[13px] text-gray-500">
                    No tags yet
                  </td>
                </tr>
              )}
              {tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-3 py-2 text-[13px] text-gray-200">{tag.name}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-3 w-3 rounded-full inline-block"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-[13px] text-gray-400 font-mono">{tag.color}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-[13px] text-gray-400">
                    {tag._count?.pois ?? 0} POIs
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => startEdit(tag)}
                        className="h-7 px-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 text-[13px] transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tag.id)}
                        className="h-7 px-2 rounded-md text-red-400/60 hover:text-red-400 hover:bg-red-500/10 text-[13px] transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}
