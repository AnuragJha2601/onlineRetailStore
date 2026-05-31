'use client';

import { useState, useEffect } from 'react';
import { AdminProduct, UpdateProductRequest, Category, SubCategory, ProductImage } from '@/types/product';
import { productApi } from '@/services/productApi';

interface EditProductModalProps {
    product: AdminProduct;
    onClose: () => void;
    onSaved: (updated: AdminProduct) => void;
}

export default function EditProductModal({ product, onClose, onSaved }: EditProductModalProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newSubCategoryName, setNewSubCategoryName] = useState('');
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [showNewSubCategory, setShowNewSubCategory] = useState(false);

    const [form, setForm] = useState<UpdateProductRequest>({
        productCode: product.productCode ?? '',
        name: product.name,
        description: product.description,
        categoryId: product.categoryId,
        subCategoryId: product.subCategoryId ?? undefined,
        price: product.price,
        pariFestPrice: product.pariFestPrice ?? undefined,
        wholesalePrice: product.wholesalePrice ?? undefined,
        stockQuantity: product.stockQuantity,
        isInStock: product.isInStock,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [images, setImages] = useState<ProductImage[]>(product.images || []);
    const [newImages, setNewImages] = useState<File[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);

    // Load categories on mount
    useEffect(() => {
        productApi.getCategories().then(res => {
            if (res.success && res.data) setCategories(res.data);
        });
    }, []);

    // Load sub-categories when category changes
    useEffect(() => {
        if (form.categoryId > 0) {
            productApi.getSubCategories(form.categoryId).then(res => {
                if (res.success && res.data) setSubCategories(res.data);
                else setSubCategories([]);
            });
        } else {
            setSubCategories([]);
        }
    }, [form.categoryId]);

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        const res = await productApi.createCategory({ name: newCategoryName.trim() });
        if (res.success && res.data) {
            setCategories(prev => [...prev.filter(c => c.id !== res.data!.id), res.data!].sort((a, b) => a.name.localeCompare(b.name)));
            setForm(prev => ({ ...prev, categoryId: res.data!.id }));
            setNewCategoryName('');
            setShowNewCategory(false);
        }
    };

    const handleAddSubCategory = async () => {
        if (!newSubCategoryName.trim() || !form.categoryId) return;
        const res = await productApi.createSubCategory({ name: newSubCategoryName.trim(), categoryId: form.categoryId });
        if (res.success && res.data) {
            setSubCategories(prev => [...prev.filter(s => s.id !== res.data!.id), res.data!].sort((a, b) => a.name.localeCompare(b.name)));
            setForm(prev => ({ ...prev, subCategoryId: res.data!.id }));
            setNewSubCategoryName('');
            setShowNewSubCategory(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setForm(prev => {
            const updated = {
                ...prev,
                [name]: type === 'checkbox' ? checked
                    : type === 'number' ? (value === '' ? undefined : Number(value))
                        : (name === 'categoryId' || name === 'subCategoryId') ? Number(value)
                            : value,
            };
            return updated;
        });
    };

    const handleDeleteImage = async (imageId: number) => {
        if (!confirm('Delete this image?')) return;
        const res = await productApi.deleteProductImage(product.id, imageId);
        if (res.success) {
            setImages(prev => {
                const remaining = prev.filter(i => i.id !== imageId);
                // If we deleted the primary, promote the first remaining
                const deleted = prev.find(i => i.id === imageId);
                if (deleted?.isPrimary && remaining.length > 0) {
                    remaining[0] = { ...remaining[0], isPrimary: true };
                }
                return remaining;
            });
        }
    };

    const handleSetPrimary = async (imageId: number) => {
        const res = await productApi.setPrimaryImage(product.id, imageId);
        if (res.success) {
            setImages(prev => prev.map(i => ({ ...i, isPrimary: i.id === imageId })));
        }
    };

    const handleUploadNewImages = async () => {
        if (newImages.length === 0) return;
        setUploadingImages(true);
        for (const file of newImages) {
            await productApi.uploadProductImage(product.id, file);
        }
        // Refresh images from server
        const res = await productApi.getProduct(product.id);
        if (res.success && res.data) {
            setImages(res.data.images);
        }
        setNewImages([]);
        setUploadingImages(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const res = await productApi.updateProduct(product.id, form);
            if (!res.success) throw new Error(res.message || 'Update failed');
            // Merge returned base product with admin pricing fields we sent
            const updated: AdminProduct = {
                ...(res.data!),
                pariFestPrice: form.pariFestPrice,
                wholesalePrice: form.wholesalePrice,
            };
            onSaved(updated);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">Edit Product</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-4 space-y-4 flex-1">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>
                    )}

                    {/* Code + Name */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Code</label>
                            <input name="productCode" value={form.productCode ?? ''} onChange={handleChange}
                                maxLength={5} placeholder="B01"
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                            <input name="name" value={form.name} onChange={handleChange} required
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                        <textarea name="description" value={form.description} onChange={handleChange} rows={2}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
                        <div className="flex gap-2">
                            <select name="categoryId" value={form.categoryId} onChange={handleChange}
                                className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400">
                                <option value={0} disabled>Select</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <button type="button" onClick={() => setShowNewCategory(!showNewCategory)}
                                className="px-2 py-1.5 text-xs bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">+</button>
                        </div>
                        {showNewCategory && (
                            <div className="flex gap-2 mt-1">
                                <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
                                    placeholder="New category" className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md" />
                                <button type="button" onClick={handleAddCategory}
                                    className="px-2 py-1 text-xs bg-indigo-600 text-white rounded-md">Add</button>
                            </div>
                        )}
                    </div>

                    {/* Sub-Category */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Sub-Category</label>
                        <div className="flex gap-2">
                            <select name="subCategoryId" value={form.subCategoryId ?? ''}
                                onChange={e => setForm(prev => ({ ...prev, subCategoryId: e.target.value ? Number(e.target.value) : undefined }))}
                                disabled={!form.categoryId}
                                className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-100">
                                <option value="">None</option>
                                {subCategories.map(sc => (
                                    <option key={sc.id} value={sc.id}>{sc.name}</option>
                                ))}
                            </select>
                            {form.categoryId > 0 && (
                                <button type="button" onClick={() => setShowNewSubCategory(!showNewSubCategory)}
                                    className="px-2 py-1.5 text-xs bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">+</button>
                            )}
                        </div>
                        {showNewSubCategory && (
                            <div className="flex gap-2 mt-1">
                                <input type="text" value={newSubCategoryName} onChange={e => setNewSubCategoryName(e.target.value)}
                                    placeholder="New sub-category" className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md" />
                                <button type="button" onClick={handleAddSubCategory}
                                    className="px-2 py-1 text-xs bg-indigo-600 text-white rounded-md">Add</button>
                            </div>
                        )}
                    </div>

                    {/* Pricing grid */}
                    <div>
                        <p className="text-xs font-medium text-gray-600 mb-2">Pricing</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">MRP / Retail (₹) *</label>
                                <input type="number" name="price" value={form.price} onChange={handleChange}
                                    required min="0.01" step="0.01"
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">PariFest Price (₹)</label>
                                <input type="number" name="pariFestPrice" value={form.pariFestPrice ?? ''} onChange={handleChange}
                                    min="0.01" step="0.01" placeholder="—"
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Wholesale Price (₹)</label>
                                <input type="number" name="wholesalePrice" value={form.wholesalePrice ?? ''} onChange={handleChange}
                                    min="0.01" step="0.01" placeholder="—"
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                            </div>
                        </div>
                    </div>

                    {/* Stock */}
                    <div className="grid grid-cols-2 gap-3 items-end">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Stock Qty *</label>
                            <input type="number" name="stockQuantity" value={form.stockQuantity} onChange={handleChange}
                                required min="0"
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        </div>
                        <div className="flex items-center gap-2 pb-1.5">
                            <input type="checkbox" id="isInStock" name="isInStock" checked={form.isInStock} onChange={handleChange}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                            <label htmlFor="isInStock" className="text-sm text-gray-700">Available for sale</label>
                        </div>
                    </div>

                    {/* Images */}
                    <div>
                        <p className="text-xs font-medium text-gray-600 mb-2">Images ({images.length}/5)</p>
                        <div className="grid grid-cols-4 gap-2">
                            {images.map(img => (
                                <div key={img.id}
                                    onClick={() => !img.isPrimary && handleSetPrimary(img.id)}
                                    className={`relative group rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${img.isPrimary ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-400'}`}>
                                    <img src={img.thumbnailUrl || img.imageUrl} alt={img.altText} className="w-full aspect-square object-cover" />
                                    {img.isPrimary && (
                                        <span className="absolute top-0.5 left-0.5 bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded">Primary</span>
                                    )}
                                    <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.id); }}
                                        className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all">
                                        ✕
                                    </button>
                                </div>
                            ))}

                            {/* Add image button */}
                            {images.length < 5 && (
                                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                                    {uploadingImages ? (
                                        <span className="text-xs text-gray-500">Uploading…</span>
                                    ) : (
                                        <>
                                            <span className="text-xl text-gray-400">+</span>
                                            <span className="text-[9px] text-gray-500">Add</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        disabled={uploadingImages}
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            e.target.value = '';
                                            setUploadingImages(true);
                                            await productApi.uploadProductImage(product.id, file);
                                            const res = await productApi.getProduct(product.id);
                                            if (res.success && res.data) setImages(res.data.images);
                                            setUploadingImages(false);
                                        }}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">Click an image to set as primary. Hover to delete.</p>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button type="submit" form="" disabled={saving}
                        onClick={handleSubmit}
                        className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
