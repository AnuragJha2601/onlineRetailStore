'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Product, Category, ProductFilterRequest } from '@/types/product';
import { productApi, formatPrice } from '@/services/productApi';
import ProductDetailModal from '@/components/ProductDetailModal';
import { useAuth } from '@/contexts/AuthContext';

const PAGE_SIZE = 20;

interface ProductCatalogProps {
    onError?: (message: string) => void;
    initialCategoryId?: number;
}

export default function ProductCatalog({ onError, initialCategoryId }: ProductCatalogProps) {
    const { isAdmin } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
    const [showInStockOnly, setShowInStockOnly] = useState(true);
    const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'popular'>('newest');
    const [activeNav, setActiveNav] = useState<'all' | 'new-arrivals' | 'trending' | number>('all');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    // Open modal and push product URL
    const openProduct = (product: Product) => {
        setSelectedProduct(product);
        window.history.pushState({ productId: product.id }, '', `/product/${product.id}/`);
    };

    // Close modal and restore URL
    const closeProduct = () => {
        if (selectedProduct) {
            setSelectedProduct(null);
            if (window.location.pathname.startsWith('/product/')) {
                window.history.pushState(null, '', '/');
            }
        }
    };

    // Handle browser Back button
    useEffect(() => {
        const handlePopState = () => {
            if (selectedProduct && !window.location.pathname.startsWith('/product/')) {
                setSelectedProduct(null);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [selectedProduct]);

    const [likedProductIds, setLikedProductIds] = useState<Set<number>>(() => {
        if (typeof window === 'undefined') return new Set();
        try {
            const stored = localStorage.getItem('dhanak_liked_products');
            return stored ? new Set<number>(JSON.parse(stored)) : new Set<number>();
        } catch { return new Set<number>(); }
    });

    // Build filter params from current UI state
    const buildFilters = useCallback((pageNum: number): ProductFilterRequest => {
        const filters: ProductFilterRequest = {
            page: pageNum,
            pageSize: PAGE_SIZE,
            sortBy: activeNav === 'trending' ? 'popular' : activeNav === 'new-arrivals' ? 'newest' : sortBy,
        };
        if (typeof activeNav === 'number') filters.categoryId = activeNav;
        else if (selectedCategoryId !== 'all') filters.categoryId = selectedCategoryId;
        if (searchTerm.trim()) filters.searchTerm = searchTerm.trim();
        if (showInStockOnly) filters.inStockOnly = true;
        return filters;
    }, [activeNav, selectedCategoryId, searchTerm, showInStockOnly, sortBy]);

    // Load products (page 1 = fresh load, page > 1 = append)
    const loadProducts = useCallback(async (pageNum: number, append = false) => {
        try {
            if (append) setLoadingMore(true); else setLoading(true);
            const filters = buildFilters(pageNum);
            const response = await productApi.getProducts(filters);

            if (response.success && response.data) {
                const { items, totalCount: total, hasMore: more } = response.data;
                if (append) {
                    setProducts(prev => [...prev, ...items]);
                } else {
                    setProducts(items);
                }
                setTotalCount(total);
                setHasMore(more);
                setPage(pageNum);
            } else {
                onError?.(response.message || 'Failed to load products');
            }
        } catch (error) {
            onError?.(error instanceof Error ? error.message : 'Failed to load products');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [buildFilters, onError]);

    // Initial load + categories
    useEffect(() => {
        productApi.getCategories().then(res => {
            if (res.success && res.data) setCategories(res.data);
        });
        productApi.getMaintenanceMode().then(res => {
            if (res.success && res.data) setMaintenanceMode(true);
        });
    }, []);

    // Respond to external category selection (from CategoryCircles)
    useEffect(() => {
        if (initialCategoryId !== undefined) {
            setActiveNav(initialCategoryId);
            setSelectedCategoryId(initialCategoryId);
        }
    }, [initialCategoryId]);

    // Reload page 1 when filters change
    useEffect(() => {
        loadProducts(1);
    }, [searchTerm, selectedCategoryId, showInStockOnly, sortBy, activeNav]);

    // Debounce search input
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const handleSearchChange = (value: string) => {
        setSearchInput(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setSearchTerm(value), 350);
    };

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) loadProducts(page + 1, true);
    };

    const handleLike = async (productId: number) => {
        if (likedProductIds.has(productId)) return;
        try {
            const response = await productApi.likeProduct(productId);
            if (response.success) {
                setProducts(prevProducts =>
                    prevProducts.map(product =>
                        product.id === productId
                            ? { ...product, likesCount: product.likesCount + 1 }
                            : product
                    )
                );
                const updated = new Set(likedProductIds);
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

    const handleNavClick = (nav: typeof activeNav) => {
        setActiveNav(nav);
        if (typeof nav === 'number') {
            setSelectedCategoryId(nav);
        } else {
            setSelectedCategoryId('all');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4">
            {/* Category Nav Pills */}
            <div className="overflow-x-auto scrollbar-hide -mx-2 px-2 mb-3">
                <div className="flex items-center gap-2 min-w-max">
                    <button
                        onClick={() => handleNavClick('all')}
                        className={`px-4 py-2 sm:py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeNav === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >All</button>
                    <button
                        onClick={() => handleNavClick('new-arrivals')}
                        className={`px-4 py-2 sm:py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeNav === 'new-arrivals' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >New Arrivals</button>
                    <button
                        onClick={() => handleNavClick('trending')}
                        className={`px-4 py-2 sm:py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeNav === 'trending' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >Trending</button>
                    <span className="w-px h-5 bg-gray-300" />
                    {categories.map(c => (
                        <button
                            key={c.id}
                            onClick={() => handleNavClick(c.id)}
                            className={`px-4 py-2 sm:py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeNav === c.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >{c.name}</button>
                    ))}
                </div>
            </div>

            {/* Compact Filter Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search by name or code..."
                    className="w-full sm:flex-1 sm:max-w-xs px-3 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
                />
                <div className="flex items-center gap-2">
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
                    <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer select-none whitespace-nowrap">
                        <input
                            type="checkbox"
                            checked={showInStockOnly}
                            onChange={(e) => setShowInStockOnly(e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-gray-300 text-gray-800 focus:ring-gray-400"
                        />
                        In Stock
                    </label>
                </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onLike={() => handleLike(product.id)}
                        onOpen={() => openProduct(product)}
                        isLiked={likedProductIds.has(product.id)}
                    />
                ))}
            </div>

            {/* No Products Message */}
            {products.length === 0 && !loading && (
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

            {/* Load More — hidden on curated tabs (New Arrivals / Trending show single page) */}
            {hasMore && activeNav !== 'new-arrivals' && activeNav !== 'trending' && (
                <div className="mt-8 text-center">
                    <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="px-8 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        {loadingMore ? (
                            <span className="flex items-center gap-2 justify-center">
                                <span className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                                Loading...
                            </span>
                        ) : 'Load More'}
                    </button>
                </div>
            )}

            {/* Results Count */}
            {products.length > 0 && (
                <div className="mt-4 text-center text-sm text-gray-500">
                    Showing {products.length} of {totalCount} products
                </div>
            )}

            {/* Product detail modal */}
            {selectedProduct && (
                <ProductDetailModal
                    product={selectedProduct}
                    onClose={closeProduct}
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
            className={`group cursor-pointer rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-300 ${touched ? 'is-touched' : ''}`}
            onClick={handleCardClick}
            onBlur={handleBlur}
            onMouseLeave={() => setTouched(false)}
            tabIndex={0}
        >
            {/* Image — with hover/touch zoom + swap */}
            <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
                {cardImageSrc ? (
                    <>
                        <Image
                            src={cardImageSrc}
                            alt={primaryImage?.altText || product.name}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className={`object-cover transition-all duration-700 ease-in-out ${!product.isInStock ? 'grayscale brightness-[0.85]' : ''} ${hoverImageSrc
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
                                className={`object-cover transition-all duration-700 ease-in-out ${!product.isInStock ? 'grayscale brightness-[0.85]' : ''} ${touched
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

                {/* Sold out overlay + badge */}
                {!product.isInStock && (
                    <>
                        <div className="absolute inset-0 bg-black/15 pointer-events-none" />
                        <div className="absolute top-2.5 left-2.5 bg-black/85 text-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
                            Sold Out
                        </div>
                    </>
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

            {/* Product info */}
            <div className="px-3 pt-3 pb-4">
                <p className={`text-sm line-clamp-1 font-serif ${product.isInStock ? 'text-gray-800' : 'text-gray-400'}`}>{product.name}</p>
                <p className={`text-sm font-semibold mt-1 ${product.isInStock ? 'text-gray-900' : 'text-gray-400'}`}>{formatPrice(product.price)}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 uppercase tracking-wider">{product.categoryName}</p>
            </div>
        </div>
    );
}