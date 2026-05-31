'use client';

import { useState, useEffect } from 'react';
import { CreateProductRequest, Category, SubCategory } from '@/types/product';
import { productApi } from '@/services/productApi';

interface ProductUploadFormProps {
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

export default function ProductUploadForm({ onSuccess, onError }: ProductUploadFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newSubCategoryName, setNewSubCategoryName] = useState('');
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [showNewSubCategory, setShowNewSubCategory] = useState(false);

    const [formData, setFormData] = useState<CreateProductRequest>({
        productCode: '',
        name: '',
        description: '',
        categoryId: 0,
        subCategoryId: undefined,
        price: 0,
        pariFestPrice: undefined,
        wholesalePrice: undefined,
        stockQuantity: 1,
        isInStock: true,
    });

    // Load categories on mount
    useEffect(() => {
        productApi.getCategories().then(res => {
            if (res.success && res.data) setCategories(res.data);
        });
    }, []);

    // Load sub-categories when category changes
    useEffect(() => {
        if (formData.categoryId > 0) {
            productApi.getSubCategories(formData.categoryId).then(res => {
                if (res.success && res.data) setSubCategories(res.data);
                else setSubCategories([]);
            });
        } else {
            setSubCategories([]);
        }
        setFormData(prev => ({ ...prev, subCategoryId: undefined }));
        setShowNewSubCategory(false);
    }, [formData.categoryId]);

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        const res = await productApi.createCategory({ name: newCategoryName.trim() });
        if (res.success && res.data) {
            setCategories(prev => [...prev.filter(c => c.id !== res.data!.id), res.data!].sort((a, b) => a.name.localeCompare(b.name)));
            setFormData(prev => ({ ...prev, categoryId: res.data!.id }));
            setNewCategoryName('');
            setShowNewCategory(false);
        }
    };

    const handleAddSubCategory = async () => {
        if (!newSubCategoryName.trim() || !formData.categoryId) return;
        const res = await productApi.createSubCategory({ name: newSubCategoryName.trim(), categoryId: formData.categoryId });
        if (res.success && res.data) {
            setSubCategories(prev => [...prev.filter(s => s.id !== res.data!.id), res.data!].sort((a, b) => a.name.localeCompare(b.name)));
            setFormData(prev => ({ ...prev, subCategoryId: res.data!.id }));
            setNewSubCategoryName('');
            setShowNewSubCategory(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        setFormData(prev => {
            const updated = {
                ...prev,
                [name]: type === 'number' ? Number(value) :
                    type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                        (name === 'categoryId' || name === 'subCategoryId') ? Number(value) : value
            };
            return updated;
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Validate file types and sizes
        const validFiles = files.filter(file => {
            const isValidType = file.type.startsWith('image/');
            const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
            return isValidType && isValidSize;
        });

        if (validFiles.length !== files.length) {
            onError?.('Some files were rejected. Please ensure all files are images under 5MB.');
        }

        setSelectedImages(validFiles);

        // Create preview URLs
        const previewUrls = validFiles.map(file => URL.createObjectURL(file));
        setImagePreviewUrls(previewUrls);
    };

    const removeImage = (index: number) => {
        const newImages = selectedImages.filter((_, i) => i !== index);
        const newPreviews = imagePreviewUrls.filter((_, i) => i !== index);

        // Clean up the removed preview URL
        URL.revokeObjectURL(imagePreviewUrls[index]);

        setSelectedImages(newImages);
        setImagePreviewUrls(newPreviews);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Create product first
            const productResponse = await productApi.createProduct(formData);

            if (!productResponse.success) {
                throw new Error(productResponse.message || 'Failed to create product');
            }

            const createdProduct = productResponse.data;
            if (!createdProduct) {
                throw new Error('Product creation returned no data');
            }

            // Upload images if any are selected
            if (selectedImages.length > 0 && createdProduct.id) {
                const imageUploadPromises = selectedImages.map(image =>
                    productApi.uploadProductImage(createdProduct.id, image)
                );

                const imageResults = await Promise.all(imageUploadPromises);
                const failedUploads = imageResults.filter(result => !result.success);

                if (failedUploads.length > 0) {
                    onError?.(`Product created but ${failedUploads.length} image(s) failed to upload.`);
                }
            }

            // Reset form
            setFormData({
                productCode: '',
                name: '',
                description: '',
                categoryId: 0,
                subCategoryId: undefined,
                price: 0,
                pariFestPrice: undefined,
                wholesalePrice: undefined,
                stockQuantity: 1,
                isInStock: true,
            });
            setSelectedImages([]);
            setImagePreviewUrls([]);

            onSuccess?.(`Product "${createdProduct.name}" created successfully!`);

        } catch (error) {
            console.error('Error creating product:', error);
            onError?.(error instanceof Error ? error.message : 'Failed to create product');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Add New Product</h2>
                <p className="text-gray-600">Upload a new product to Dhanak Trinket catalog</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Product Name */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Product Name *
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Traditional Gold Bangles Set"
                    />
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={3}
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Describe your product features, material, occasion..."
                    />
                </div>

                {/* Category and Product Code Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                            Category *
                        </label>
                        <div className="flex gap-2">
                            <select
                                id="categoryId"
                                name="categoryId"
                                required
                                value={formData.categoryId}
                                onChange={handleInputChange}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value={0} disabled>Select category</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <button type="button" onClick={() => setShowNewCategory(!showNewCategory)}
                                className="px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200" title="Add new category">+</button>
                        </div>
                        {showNewCategory && (
                            <div className="flex gap-2 mt-2">
                                <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
                                    placeholder="New category name" className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md" />
                                <button type="button" onClick={handleAddCategory}
                                    className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Add</button>
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="subCategoryId" className="block text-sm font-medium text-gray-700 mb-1">
                            Sub-Category
                        </label>
                        <div className="flex gap-2">
                            <select
                                id="subCategoryId"
                                name="subCategoryId"
                                value={formData.subCategoryId ?? ''}
                                onChange={e => setFormData(prev => ({ ...prev, subCategoryId: e.target.value ? Number(e.target.value) : undefined }))}
                                disabled={!formData.categoryId}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                            >
                                <option value="">None</option>
                                {subCategories.map(sc => (
                                    <option key={sc.id} value={sc.id}>{sc.name}</option>
                                ))}
                            </select>
                            {formData.categoryId > 0 && (
                                <button type="button" onClick={() => setShowNewSubCategory(!showNewSubCategory)}
                                    className="px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200" title="Add new sub-category">+</button>
                            )}
                        </div>
                        {showNewSubCategory && (
                            <div className="flex gap-2 mt-2">
                                <input type="text" value={newSubCategoryName} onChange={e => setNewSubCategoryName(e.target.value)}
                                    placeholder="New sub-category name" className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md" />
                                <button type="button" onClick={handleAddSubCategory}
                                    className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Add</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Product Code */}
                <div>
                    <label htmlFor="productCode" className="block text-sm font-medium text-gray-700 mb-1">
                        Product Code
                    </label>
                    <input
                        type="text"
                        id="productCode"
                        name="productCode"
                        maxLength={10}
                        value={formData.productCode ?? ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                        placeholder="e.g. BA01 — leave blank to auto-assign"
                    />
                </div>

                {/* Pricing */}
                <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Pricing</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                                MRP / Retail (₹) *
                            </label>
                            <input
                                type="number"
                                id="price"
                                name="price"
                                required
                                min="0.01"
                                step="0.01"
                                value={formData.price || ''}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="299"
                            />
                        </div>
                        <div>
                            <label htmlFor="pariFestPrice" className="block text-sm font-medium text-gray-700 mb-1">
                                PariFest Price (₹)
                            </label>
                            <input
                                type="number"
                                id="pariFestPrice"
                                name="pariFestPrice"
                                min="0.01"
                                step="0.01"
                                value={formData.pariFestPrice ?? ''}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="120"
                            />
                        </div>
                        <div>
                            <label htmlFor="wholesalePrice" className="block text-sm font-medium text-gray-700 mb-1">
                                Wholesale Price (₹)
                            </label>
                            <input
                                type="number"
                                id="wholesalePrice"
                                name="wholesalePrice"
                                min="0.01"
                                step="0.01"
                                value={formData.wholesalePrice ?? ''}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="135"
                            />
                        </div>
                    </div>
                </div>

                {/* Stock Quantity and In Stock */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                            Stock Quantity *
                        </label>
                        <input
                            type="number"
                            id="stockQuantity"
                            name="stockQuantity"
                            required
                            min="0"
                            value={formData.stockQuantity}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isInStock"
                            name="isInStock"
                            checked={formData.isInStock}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isInStock" className="ml-2 block text-sm text-gray-700">
                            Available for sale
                        </label>
                    </div>
                </div>

                {/* Image Upload */}
                <div>
                    <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-1">
                        Product Images
                    </label>
                    <input
                        type="file"
                        id="images"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Select multiple images. Max 5MB per image. JPEG, PNG, WebP supported.
                    </p>
                </div>

                {/* Image Previews */}
                {imagePreviewUrls.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Image Previews</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {imagePreviewUrls.map((url, index) => (
                                <div key={index} className="relative">
                                    <img
                                        src={url}
                                        alt={`Preview ${index + 1}`}
                                        className="w-full h-24 object-cover rounded-md border border-gray-300"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Creating...' : 'Create Product'}
                    </button>
                </div>
            </form>
        </div>
    );
}