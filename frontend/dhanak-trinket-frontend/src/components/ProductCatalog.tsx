'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product, Category, ProductFilterRequest } from '@/types/product';
import { productApi, formatPrice } from '@/services/productApi';
import ProductDetailModal from '@/components/ProductDetailModal';
import { useAuth } from '@/contexts/AuthContext';

interface ProductCatalogProps {
    onError?: (message: string) => void;
}

export default function ProductCatalog({ onError }: ProductCatalogProps) {
    const { isAdmin } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
    const [showInStockOnly, setShowInStockOnly] = useState(true);
    const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'popular'>('newest');
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
    }, [products, searchTerm, selectedCategoryId, showInStockOnly, sortBy]);

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

        // Sort
        switch (sortBy) {
            case 'newest':
                filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            case 'price-asc':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'popular':
                filtered.sort((a, b) => b.likesCount - a.likesCount);
                break;
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

    if (maintenanceMode && !isAdmin) {
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
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4">
            {/* Compact Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="flex-1 min-w-[100px] max-w-xs px-3 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
                />
                <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
                >
                    <option value="all">All</option>
                    {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
                >
                    <option value="newest">Newest</option>
                    <option value="popular">Popular</option>
                    <option value="price-asc">Price: Low → High</option>
                    <option value="price-desc">Price: High → Low</option>
                </select>
                <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={showInStockOnly}
                        onChange={(e) => setShowInStockOnly(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-gray-800 focus:ring-gray-400"
                    />
                    In Stock
                </label>
            </div>

            {/* Products Grid — tight gap, mobile-first 2-col */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[3px] sm:gap-1">
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
    const secondImage = product.images.find(img => img !== primaryImage);
    const cardImageSrc = primaryImage?.thumbnailUrl || primaryImage?.imageUrl;
    const hoverImageSrc = secondImage?.thumbnailUrl || secondImage?.imageUrl;
    const [touched, setTouched] = useState(false);

    const handleCardClick = (e: React.MouseEvent) => {
        // On touch devices: first tap zooms, second tap opens
        if ('ontouchstart' in window) {
            if (!touched) {
                e.preventDefault();
                setTouched(true);
                return;
            }
        }
        onOpen();
    };

    // Reset touch state when tapping outside (blur)
    const handleBlur = () => { setTouched(false); };

    return (
        <div
            className={`group cursor-pointer ${touched ? 'is-touched' : ''}`}
            onClick={handleCardClick}
            onBlur={handleBlur}
            onMouseLeave={() => setTouched(false)}
            tabIndex={0}
        >
            {/* Image — edge to edge, with hover/touch zoom + swap */}
            <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
                {cardImageSrc ? (
                    <>
                        <Image
                            src={cardImageSrc}
                            alt={primaryImage?.altText || product.name}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className={`object-cover transition-all duration-700 ease-in-out ${hoverImageSrc
                                ? `group-hover:opacity-0 ${touched ? 'opacity-0' : ''}`
                                : `group-hover:scale-110 ${touched ? 'scale-110' : ''}`
                                }`}
                        />
                        {hoverImageSrc && (
                            <Image
                                src={hoverImageSrc}
                                alt={secondImage?.altText || product.name}
                                fill
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                className={`object-cover transition-all duration-700 ease-in-out ${touched
                                    ? 'opacity-100 scale-110'
                                    : 'opacity-0 group-hover:opacity-100 group-hover:scale-110'
                                    }`}
                            />
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <span className="text-3xl">📷</span>
                    </div>
                )}

                {/* Sold out badge */}
                {!product.isInStock && (
                    <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                        Sold Out
                    </div>
                )}

                {/* Like button — always visible on mobile, hover-reveal on desktop */}
                <button
                    onClick={(e) => { e.stopPropagation(); onLike(); }}
                    disabled={isLiked}
                    className={`absolute top-2 right-2 flex items-center gap-1 px-1.5 h-7 rounded-full bg-white/80 backdrop-blur-sm transition-all ${isLiked || product.likesCount > 0
                        ? 'opacity-100'
                        : 'sm:opacity-0 sm:group-hover:opacity-100 opacity-100'
                        } ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                    aria-label={isLiked ? 'Already liked' : 'Like'}
                >
                    <span className="text-sm">{isLiked ? '❤️' : '🤍'}</span>
                    {product.likesCount > 0 && (
                        <span className="text-[11px] font-medium text-gray-600">{product.likesCount}</span>
                    )}
                </button>
            </div>

            {/* Minimal info — name + price */}
            <div className="px-1 pt-2.5 pb-4">
                <p className="text-[13px] text-gray-700 line-clamp-1 font-serif">{product.name}</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{formatPrice(product.price)}</p>
            </div>
        </div>
    );
}