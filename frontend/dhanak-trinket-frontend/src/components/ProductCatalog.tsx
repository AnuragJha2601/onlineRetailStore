'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product, Category, ProductFilterRequest } from '@/types/product';
import { productApi, formatPrice } from '@/services/productApi';
import ProductDetailModal from '@/components/ProductDetailModal';

interface ProductCatalogProps {
    onError?: (message: string) => void;
}

export default function ProductCatalog({ onError }: ProductCatalogProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
    const [showInStockOnly, setShowInStockOnly] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [likedProductIds, setLikedProductIds] = useState<Set<number>>(() => {
        if (typeof window === 'undefined') return new Set();
        try {
            const stored = localStorage.getItem('dhanak_liked_products');
            return stored ? new Set<number>(JSON.parse(stored)) : new Set<number>();
        } catch { return new Set<number>(); }
    });

    useEffect(() => {
        loadProducts();
        productApi.getCategories().then(res => {
            if (res.success && res.data) setCategories(res.data);
        });
        productApi.getMaintenanceMode().then(res => {
            if (res.success && res.data) setMaintenanceMode(true);
        });
    }, []);

    useEffect(() => {
        filterProducts();
    }, [products, searchTerm, selectedCategoryId, showInStockOnly]);

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
        if (selectedCategoryId !== 'all') {
            filtered = filtered.filter(product => product.categoryId === selectedCategoryId);
        }

        // Filter by search term
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(term) ||
                product.description.toLowerCase().includes(term) ||
                product.categoryName.toLowerCase().includes(term) ||
                (product.productCode?.toLowerCase().includes(term) ?? false)
            );
        }

        // Filter by stock status
        if (showInStockOnly) {
            filtered = filtered.filter(product => product.isInStock);
        }

        setFilteredProducts(filtered);
    };

    const handleLike = async (productId: number) => {
        if (likedProductIds.has(productId)) return;   // already liked from this browser
        try {
            const response = await productApi.likeProduct(productId);
            if (response.success) {
                setProducts(prevProducts =>
                    prevProducts.map(product =>
                        product.id === productId
                            ? { ...product, likesCount: product.likesCount + 1 }
                            : product
                    )
                ); const updated = new Set(likedProductIds);
                updated.add(productId);
                setLikedProductIds(updated);
                try { localStorage.setItem('dhanak_liked_products', JSON.stringify([...updated])); } catch { /* ignore */ }
            }
        } catch (error) {
            onError?.(error instanceof Error ? error.message : 'Failed to like product');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (maintenanceMode) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <div className="text-6xl mb-6">✨</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">We&apos;re Getting Ready!</h2>
                    <p className="text-gray-600 max-w-md mb-2">
                        Dhanak Trinket is currently being updated with fresh new collections. We&apos;ll be back shortly with beautiful finds for you.
                    </p>
                    <p className="text-sm text-gray-400">Check back soon!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
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
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
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
                        onOpen={() => setSelectedProduct(product)}
                        isLiked={likedProductIds.has(product.id)}
                    />
                ))}
            </div>

            {/* No Products Message */}
            {filteredProducts.length === 0 && !loading && (
                <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🔍</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600">
                        {searchTerm || selectedCategoryId !== 'all' || !showInStockOnly
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

            {/* Product detail modal */}
            {selectedProduct && (
                <ProductDetailModal
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                />
            )}
        </div>
    );
}

// Product Card Component
interface ProductCardProps {
    product: Product;
    onLike: () => void;
    onOpen: () => void;
    isLiked?: boolean;
}

function ProductCard({ product, onLike, onOpen, isLiked = false }: ProductCardProps) {
    const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
    // Use thumbnail for the card; fall back to full image if no thumbnail yet
    const cardImageSrc = primaryImage?.thumbnailUrl || primaryImage?.imageUrl;

    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
            {/* Product Image — clickable to open detail modal */}
            <button
                type="button"
                onClick={onOpen}
                className="block w-full relative aspect-square bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label={`View ${product.name}`}
            >
                {cardImageSrc ? (
                    <Image
                        src={cardImageSrc}
                        alt={primaryImage?.altText || product.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-contain"
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
            </button>

            {/* Product Info */}
            <div className="p-4">
                <div className="mb-2">
                    <div className="flex items-start justify-between gap-1">
                        <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                        {product.productCode && (
                            <span className="flex-shrink-0 font-mono text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded mt-0.5">
                                {product.productCode}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-600">{product.categoryName}</p>
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
                        disabled={isLiked}
                        title={isLiked ? 'Already liked' : 'Like this product'}
                        className={`flex items-center space-x-1 transition-colors ${isLiked
                            ? 'text-red-500 cursor-default'
                            : 'text-gray-400 hover:text-red-500'
                            }`}
                    >
                        <span className="text-lg">{isLiked ? '❤️' : '🤍'}</span>
                        <span className="text-sm">{product.likesCount}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}