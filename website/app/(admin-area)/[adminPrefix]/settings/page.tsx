'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface Region {
  id: string;
  name: string;
  cities: string[];
  state: string | null;
  country: string;
  isActive: boolean;
  _count: { scrapeJobs: number };
}

interface Tag {
  id: string;
  name: string;
  color: string;
  _count: { leads: number };
}

export default function SettingsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'regions' | 'tags'>('regions');

  // Region form
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [regionForm, setRegionForm] = useState({
    name: '',
    cities: '',
    state: '',
  });

  // Tag form
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagForm, setTagForm] = useState({ name: '', color: '#6366f1' });

  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [regionsData, tagsData] = await Promise.all([
        apiClient.getRegions(),
        apiClient.getTags(),
      ]);
      setRegions(regionsData);
      setTags(tagsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Region handlers
  const handleSaveRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regionForm.name || !regionForm.cities) return;

    setSaving(true);
    const cities = regionForm.cities.split(',').map((c) => c.trim()).filter(Boolean);

    try {
      if (editingRegion) {
        await apiClient.updateRegion(editingRegion.id, {
          name: regionForm.name,
          cities,
          state: regionForm.state || undefined,
        });
      } else {
        await apiClient.createRegion({
          name: regionForm.name,
          cities,
          state: regionForm.state || undefined,
        });
      }
      setShowRegionModal(false);
      setEditingRegion(null);
      setRegionForm({ name: '', cities: '', state: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to save region:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEditRegion = (region: Region) => {
    setEditingRegion(region);
    setRegionForm({
      name: region.name,
      cities: region.cities.join(', '),
      state: region.state || '',
    });
    setShowRegionModal(true);
  };

  const handleDeleteRegion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this region?')) return;
    try {
      await apiClient.deleteRegion(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete region:', error);
    }
  };

  const handleToggleRegion = async (id: string) => {
    try {
      await apiClient.toggleRegion(id);
      fetchData();
    } catch (error) {
      console.error('Failed to toggle region:', error);
    }
  };

  // Tag handlers
  const handleSaveTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagForm.name) return;

    setSaving(true);
    try {
      await apiClient.createTag(tagForm);
      setShowTagModal(false);
      setTagForm({ name: '', color: '#6366f1' });
      fetchData();
    } catch (error) {
      console.error('Failed to save tag:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;
    try {
      await apiClient.deleteTag(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-400 mt-1">Manage regions and tags</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('regions')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'regions'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Scraping Regions
        </button>
        <button
          onClick={() => setActiveTab('tags')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'tags'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Lead Tags
        </button>
      </div>

      {/* Regions Tab */}
      {activeTab === 'regions' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold">Scraping Regions</h2>
            <button
              onClick={() => {
                setEditingRegion(null);
                setRegionForm({ name: '', cities: '', state: '' });
                setShowRegionModal(true);
              }}
              className="px-3 py-1.5 bg-accent text-background text-sm font-medium rounded-lg hover:bg-accent-light transition-colors"
            >
              Add Region
            </button>
          </div>
          <div className="divide-y divide-gray-700">
            {regions.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                No regions configured yet
              </div>
            ) : (
              regions.map((region) => (
                <div key={region.id} className="p-4 hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-white">{region.name}</h3>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            region.isActive ? 'bg-green-500' : 'bg-gray-500'
                          }`}
                        />
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        {region.cities.join(', ')}
                      </p>
                      {region.state && (
                        <p className="text-sm text-gray-500">{region.state}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {region._count.scrapeJobs} jobs
                      </span>
                      <button
                        onClick={() => handleToggleRegion(region.id)}
                        className={`px-2 py-1 text-xs rounded ${
                          region.isActive
                            ? 'bg-gray-700 text-gray-300'
                            : 'bg-green-500/20 text-green-400'
                        }`}
                      >
                        {region.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleEditRegion(region)}
                        className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRegion(region.id)}
                        className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tags Tab */}
      {activeTab === 'tags' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold">Lead Tags</h2>
            <button
              onClick={() => setShowTagModal(true)}
              className="px-3 py-1.5 bg-accent text-background text-sm font-medium rounded-lg hover:bg-accent-light transition-colors"
            >
              Add Tag
            </button>
          </div>
          <div className="p-4">
            {tags.length === 0 ? (
              <p className="text-center text-gray-400 py-4">No tags created yet</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-white">{tag.name}</span>
                    <span className="text-xs text-gray-400">({tag._count.leads})</span>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="ml-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Region Modal */}
      {showRegionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">
              {editingRegion ? 'Edit Region' : 'Add Region'}
            </h2>
            <form onSubmit={handleSaveRegion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Region Name
                </label>
                <input
                  type="text"
                  value={regionForm.name}
                  onChange={(e) => setRegionForm({ ...regionForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent"
                  placeholder="e.g., Bangalore Tech Hub"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cities (comma separated)
                </label>
                <textarea
                  value={regionForm.cities}
                  onChange={(e) => setRegionForm({ ...regionForm, cities: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent resize-none"
                  rows={3}
                  placeholder="Bangalore, Whitefield, Electronic City"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  State (optional)
                </label>
                <input
                  type="text"
                  value={regionForm.state}
                  onChange={(e) => setRegionForm({ ...regionForm, state: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent"
                  placeholder="Karnataka"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRegionModal(false);
                    setEditingRegion(null);
                  }}
                  className="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-accent text-background font-medium rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Region'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">Add Tag</h2>
            <form onSubmit={handleSaveTag} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tag Name
                </label>
                <input
                  type="text"
                  value={tagForm.name}
                  onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent"
                  placeholder="e.g., Hot Lead"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={tagForm.color}
                    onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <div className="flex gap-2">
                    {['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setTagForm({ ...tagForm, color })}
                        className={`w-6 h-6 rounded-full border-2 ${
                          tagForm.color === color ? 'border-white' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTagModal(false)}
                  className="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-accent text-background font-medium rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Add Tag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
