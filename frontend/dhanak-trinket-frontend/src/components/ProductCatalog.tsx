'use client';

import { useState, useEffect } from 'react';
import { Product, ProductCategory, getCategoryDisplayName, ProductFilterRequest } from '@/types/product';
import { productApi, formatPrice } from '@/services/productApi';

interface ProductCatalogProps {
    onError?: (message: string) => void;
}

export default function ProductCatalog({ onError }: ProductCatalogProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
    const [showInStockOnly, setShowInStockOnly] = useState(true);

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [products, searchTerm, selectedCategory, showInStockOnly]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const response = await productApi.getProducts();

            if (response.success && response.data) {
                setProducts(response.data);
            } else {
                onError?.(response.message || 'Failed to load products');
            }
        } catch (error) {
            onError?.(error instanceof Error ? error.message : 'Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const filterProducts = () => {
        let filtered = [...products];

        // Filter by category
        if (selectedCategory !== 'all') {
            const categoryName = getCategoryDisplayName(selectedCategory as ProductCategory);
            filtered = filtered.filter(product => product.category === categoryName);
        }

        // Filter by search term
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(term) ||
                product.description.toLowerCase().includes(term) ||
                product.category.toLowerCase().includes(term)
            );
        }

        // Filter by stock status
        if (showInStockOnly) {
            filtered = filtered.filter(product => product.isInStock);
        }

        setFilteredProducts(filtered);
    };

    const handleLike = async (productId: number) => {
        try {
            const response = await productApi.likeProduct(productId);
            if (response.success) {
                // Update the likes count in the local state
                setProducts(prevProducts =>
                    prevProducts.map(product =>
                        product.id === productId
                            ? { ...product, likesCount: product.likesCount + 1 }
                            : product
                    )
                );
            }
        } catch (error) {
            onError?.(error instanceof Error ? error.message : 'Failed to like product');
        }
    };

    const categories = Object.values(ProductCategory)
        .filter(value => typeof value === 'number')
        .map(value => ({
            value: value as ProductCategory,
            label: getCategoryDisplayName(value as ProductCategory)
        }));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Dhanak Trinket</h1>
                <p className="text-gray-600">Ethnic Finds, Timeless Shine</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="md:col-span-2">
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                            Search Products
                        </label>
                        <input
                            type="text"
                            id="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name, description..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {/* Category Filter */}
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                        </label>
                        <select
                            id="category"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value === 'all' ? 'all' : Number(e.target.value) as ProductCategory)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(({ value, label }) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Stock Filter */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="inStock"
                            checked={showInStockOnly}
                            onChange={(e) => setShowInStockOnly(e.target.checked)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="inStock" className="ml-2 block text-sm text-gray-700">
                            In Stock Only
                        </label>
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onLike={() => handleLike(product.id)}
                    />
                ))}
            </div>

            {/* No Products Message */}
            {filteredProducts.length === 0 && !loading && (
                <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🔍</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600">
                        {searchTerm || selectedCategory !== 'all' || !showInStockOnly
                            ? 'Try adjusting your filters to see more products.'
                            : 'No products available at the moment.'}
                    </p>
                </div>
            )}

            {/* Results Count */}
            {filteredProducts.length > 0 && (
                <div className="mt-8 text-center text-sm text-gray-600">
                    Showing {filteredProducts.length} of {products.length} products
                </div>
            )}
        </div>
    );
}

// Product Card Component
interface ProductCardProps {
    product: Product;
    onLike: () => void;
}

function ProductCard({ product, onLike }: ProductCardProps) {
    const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];

    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
            {/* Product Image */}
            <div className="relative aspect-square bg-gray-200">
                {primaryImage ? (
                    <img
                        src={primaryImage.imageUrl}
                        alt={primaryImage.altText || product.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <div className="text-4xl mb-2">📷</div>
                            <div className="text-sm">No Image</div>
                        </div>
                    </div>
                )}

                {/* Stock Status Badge */}
                {!product.isInStock && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        Sold Out
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="p-4">
                <div className="mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.category}</p>
                </div>

                {product.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                )}

                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-lg font-bold text-indigo-600">
                            {formatPrice(product.price)}
                        </span>
                        {product.stockQuantity <= 5 && product.isInStock && (
                            <p className="text-xs text-orange-600">Only {product.stockQuantity} left</p>
                        )}
                    </div>

                    <button
                        onClick={onLike}
                        className="flex items-center space-x-1 text-gray-600 hover:text-red-500 transition-colors"
                    >
                        <span className="text-lg">❤️</span>
                        <span className="text-sm">{product.likesCount}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}