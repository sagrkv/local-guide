"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";

interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string;
  emoji?: string;
  icon?: string;
  isGlobal: boolean;
  cityId?: string;
  _count?: { pois: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Inline form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState("#6366f1");
  const [formEmoji, setFormEmoji] = useState("");
  const [formIsGlobal, setFormIsGlobal] = useState(true);
  const [formSaving, setFormSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.getCategories({ limit: 100 });
      setCategories(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormName("");
    setFormColor("#6366f1");
    setFormEmoji("");
    setFormIsGlobal(true);
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setFormName(cat.name);
    setFormColor(cat.color ?? "#6366f1");
    setFormEmoji(cat.emoji ?? "");
    setFormIsGlobal(cat.isGlobal);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    try {
      setFormSaving(true);
      setError("");
      const payload = {
        name: formName,
        color: formColor,
        emoji: formEmoji || undefined,
        isGlobal: formIsGlobal,
      };

      if (editingId) {
        await apiClient.updateCategory(editingId, payload);
      } else {
        await apiClient.createCategory(payload);
      }
      resetForm();
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? This will fail if POIs are assigned.")) return;
    try {
      setError("");
      await apiClient.deleteCategory(id);
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Categories</h1>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md bg-white text-gray-900 hover:bg-gray-100 text-[13px] font-medium transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Category
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-400">{error}</div>
      )}

      {/* Inline Form */}
      {showForm && (
        <div className="border border-gray-800 rounded-lg bg-gray-900 p-4 space-y-3">
          <h2 className="text-sm font-medium text-gray-200">
            {editingId ? "Edit Category" : "New Category"}
          </h2>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 flex-1 min-w-[180px]">
              <label className="text-xs font-medium text-gray-400">Name</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-8 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none"
                placeholder="Category name"
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
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400">Emoji</label>
              <input
                value={formEmoji}
                onChange={(e) => setFormEmoji(e.target.value)}
                className="h-8 w-[60px] rounded-md border border-gray-700 bg-gray-950 px-2 text-[13px] text-gray-200 text-center focus:border-gray-500 focus:outline-none"
                placeholder="🏛️"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400">Scope</label>
              <select
                value={formIsGlobal ? "global" : "city"}
                onChange={(e) => setFormIsGlobal(e.target.value === "global")}
                className="h-8 w-[100px] rounded-md border border-gray-700 bg-gray-900 px-2 text-[13px] text-gray-300 focus:border-gray-500 focus:outline-none"
              >
                <option value="global">Global</option>
                <option value="city">City</option>
              </select>
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

      {/* Table */}
      {!loading && (
        <div className="border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900/50 border-b border-gray-800">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Color</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Emoji</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Scope</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">POIs</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {categories.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-[13px] text-gray-500">
                    No categories yet
                  </td>
                </tr>
              )}
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-3 py-2 text-[13px] text-gray-200">{cat.name}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-3 w-3 rounded-sm inline-block"
                        style={{ backgroundColor: cat.color ?? "#6366f1" }}
                      />
                      <span className="text-[13px] text-gray-400 font-mono">{cat.color}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-[13px]">{cat.emoji || "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${cat.isGlobal ? "bg-blue-500/10 text-blue-400" : "bg-gray-500/10 text-gray-400"}`}>
                      {cat.isGlobal ? "Global" : "City"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[13px] text-gray-400">{cat._count?.pois ?? 0}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => startEdit(cat)}
                        className="h-7 px-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 text-[13px] transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
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
