'use client';

import { useState, useEffect, useCallback } from 'react';
import { Category, SubCategory } from '@/types/product';
import { productApi } from '@/services/productApi';

interface CategoryWithSubs extends Category {
    subCategories: SubCategory[];
    expanded: boolean;
}

export default function CategoriesScreen() {
    const [categories, setCategories] = useState<CategoryWithSubs[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // New category form
    const [newCatName, setNewCatName] = useState('');
    const [addingCat, setAddingCat] = useState(false);

    // New sub-category form
    const [addingSubFor, setAddingSubFor] = useState<number | null>(null);
    const [newSubName, setNewSubName] = useState('');
    const [addingSub, setAddingSub] = useState(false);

    // Rename state
    const [renamingCat, setRenamingCat] = useState<number | null>(null);
    const [renameCatName, setRenameCatName] = useState('');
    const [renamingSub, setRenamingSub] = useState<number | null>(null);
    const [renameSubName, setRenameSubName] = useState('');

    const showSuccess = (msg: string) => {
        setSuccess(msg);
        setError(null);
        setTimeout(() => setSuccess(null), 4000);
    };

    const showError = (msg: string) => {
        setError(msg);
        setSuccess(null);
        setTimeout(() => setError(null), 6000);
    };

    const loadCategories = useCallback(async () => {
        setLoading(true);
        const res = await productApi.getCategories();
        if (!res.success || !res.data) {
            showError(res.message || 'Failed to load categories');
            setLoading(false);
            return;
        }

        const catsWithSubs: CategoryWithSubs[] = [];
        for (const cat of res.data) {
            const subRes = await productApi.getSubCategories(cat.id);
            catsWithSubs.push({
                ...cat,
                subCategories: subRes.data || [],
                expanded: true,
            });
        }
        setCategories(catsWithSubs);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    // ─── Category CRUD ─────────────────────────────────────────────────────

    const handleAddCategory = async () => {
        if (!newCatName.trim()) return;
        setAddingCat(true);
        const res = await productApi.createCategory({ name: newCatName.trim() });
        setAddingCat(false);
        if (res.success) {
            showSuccess(`Category "${res.data?.name}" created`);
            setNewCatName('');
            await loadCategories();
        } else {
            showError(res.message || 'Failed to create category');
        }
    };

    const handleRenameCategory = async (id: number) => {
        if (!renameCatName.trim()) return;
        const res = await productApi.updateCategory(id, { name: renameCatName.trim() });
        if (res.success) {
            showSuccess(`Renamed to "${res.data?.name}"`);
            setRenamingCat(null);
            await loadCategories();
        } else {
            showError(res.message || 'Failed to rename category');
        }
    };

    const handleDeleteCategory = async (id: number, name: string) => {
        if (!confirm(`Delete category "${name}"? This cannot be undone.`)) return;
        const res = await productApi.deleteCategory(id);
        if (res.success) {
            showSuccess(`Category "${name}" deleted`);
            await loadCategories();
        } else {
            showError(res.message || 'Failed to delete category');
        }
    };

    // ─── Sub-Category CRUD ─────────────────────────────────────────────────

    const handleAddSubCategory = async (categoryId: number) => {
        if (!newSubName.trim()) return;
        setAddingSub(true);
        const res = await productApi.createSubCategory({ name: newSubName.trim(), categoryId });
        setAddingSub(false);
        if (res.success) {
            showSuccess(`Sub-category "${res.data?.name}" created`);
            setNewSubName('');
            setAddingSubFor(null);
            await loadCategories();
        } else {
            showError(res.message || 'Failed to create sub-category');
        }
    };

    const handleRenameSubCategory = async (id: number, categoryId: number) => {
        if (!renameSubName.trim()) return;
        const res = await productApi.updateSubCategory(id, { name: renameSubName.trim(), categoryId });
        if (res.success) {
            showSuccess(`Renamed to "${res.data?.name}"`);
            setRenamingSub(null);
            await loadCategories();
        } else {
            showError(res.message || 'Failed to rename sub-category');
        }
    };

    const handleDeleteSubCategory = async (id: number, name: string) => {
        if (!confirm(`Delete sub-category "${name}"? This cannot be undone.`)) return;
        const res = await productApi.deleteSubCategory(id);
        if (res.success) {
            showSuccess(`Sub-category "${name}" deleted`);
            await loadCategories();
        } else {
            showError(res.message || 'Failed to delete sub-category');
        }
    };

    const toggleExpand = (catId: number) => {
        setCategories(prev =>
            prev.map(c => c.id === catId ? { ...c, expanded: !c.expanded } : c)
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Manage Categories</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                    Create, rename, or remove categories and sub-categories. Categories with products cannot be deleted.
                </p>
            </div>

            {/* Alerts */}
            {error && (
                <div className="mb-4 rounded-lg px-4 py-3 text-sm bg-red-50 border border-red-200 text-red-700 flex items-start gap-3">
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError(null)} className="opacity-60 hover:opacity-100">✕</button>
                </div>
            )}
            {success && (
                <div className="mb-4 rounded-lg px-4 py-3 text-sm bg-green-50 border border-green-200 text-green-800 flex items-start gap-3">
                    <span className="flex-1">{success}</span>
                    <button onClick={() => setSuccess(null)} className="opacity-60 hover:opacity-100">✕</button>
                </div>
            )}

            {/* Add Category */}
            <div className="mb-6 flex gap-2">
                <input
                    type="text"
                    placeholder="New category name..."
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                    className="flex-1 max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                    onClick={handleAddCategory}
                    disabled={addingCat || !newCatName.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {addingCat ? 'Adding...' : 'Add Category'}
                </button>
            </div>

            {/* Category Tree */}
            {categories.length === 0 ? (
                <p className="text-gray-500 text-sm">No categories yet. Create one above.</p>
            ) : (
                <div className="space-y-3">
                    {categories.map(cat => (
                        <div key={cat.id} className="border border-gray-200 rounded-lg bg-white">
                            {/* Category Row */}
                            <div className="flex items-center gap-2 px-4 py-3">
                                <button
                                    onClick={() => toggleExpand(cat.id)}
                                    className="text-gray-400 hover:text-gray-600 w-5 text-center"
                                    title={cat.expanded ? 'Collapse' : 'Expand'}
                                >
                                    {cat.expanded ? '▼' : '▶'}
                                </button>

                                {renamingCat === cat.id ? (
                                    <div className="flex-1 flex gap-2">
                                        <input
                                            type="text"
                                            value={renameCatName}
                                            onChange={e => setRenameCatName(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') handleRenameCategory(cat.id);
                                                if (e.key === 'Escape') setRenamingCat(null);
                                            }}
                                            className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleRenameCategory(cat.id)}
                                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setRenamingCat(null)}
                                            className="text-sm text-gray-500 hover:text-gray-700"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="flex-1 font-medium text-gray-900">{cat.name}</span>
                                        <span className="text-xs text-gray-400">
                                            {cat.subCategories.length} sub
                                        </span>
                                        <button
                                            onClick={() => { setRenamingCat(cat.id); setRenameCatName(cat.name); }}
                                            className="text-sm text-gray-400 hover:text-indigo-600"
                                            title="Rename"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                            className="text-sm text-gray-400 hover:text-red-600"
                                            title="Delete"
                                        >
                                            🗑️
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Sub-categories */}
                            {cat.expanded && (
                                <div className="border-t border-gray-100 bg-gray-50 px-4 py-2">
                                    {cat.subCategories.length === 0 && addingSubFor !== cat.id && (
                                        <p className="text-xs text-gray-400 py-1 pl-7">No sub-categories</p>
                                    )}

                                    {cat.subCategories.map(sub => (
                                        <div key={sub.id} className="flex items-center gap-2 py-1.5 pl-7">
                                            {renamingSub === sub.id ? (
                                                <div className="flex-1 flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={renameSubName}
                                                        onChange={e => setRenameSubName(e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') handleRenameSubCategory(sub.id, cat.id);
                                                            if (e.key === 'Escape') setRenamingSub(null);
                                                        }}
                                                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => handleRenameSubCategory(sub.id, cat.id)}
                                                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setRenamingSub(null)}
                                                        className="text-sm text-gray-500 hover:text-gray-700"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="text-sm text-gray-700 flex-1">{sub.name}</span>
                                                    <button
                                                        onClick={() => { setRenamingSub(sub.id); setRenameSubName(sub.name); }}
                                                        className="text-xs text-gray-400 hover:text-indigo-600"
                                                        title="Rename"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSubCategory(sub.id, sub.name)}
                                                        className="text-xs text-gray-400 hover:text-red-600"
                                                        title="Delete"
                                                    >
                                                        🗑️
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    ))}

                                    {/* Add sub-category */}
                                    {addingSubFor === cat.id ? (
                                        <div className="flex gap-2 py-1.5 pl-7">
                                            <input
                                                type="text"
                                                placeholder="Sub-category name..."
                                                value={newSubName}
                                                onChange={e => setNewSubName(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') handleAddSubCategory(cat.id);
                                                    if (e.key === 'Escape') { setAddingSubFor(null); setNewSubName(''); }
                                                }}
                                                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => handleAddSubCategory(cat.id)}
                                                disabled={addingSub || !newSubName.trim()}
                                                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
                                            >
                                                {addingSub ? 'Adding...' : 'Add'}
                                            </button>
                                            <button
                                                onClick={() => { setAddingSubFor(null); setNewSubName(''); }}
                                                className="text-sm text-gray-500 hover:text-gray-700"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => { setAddingSubFor(cat.id); setNewSubName(''); }}
                                            className="text-xs text-indigo-600 hover:text-indigo-800 py-1.5 pl-7"
                                        >
                                            + Add sub-category
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
