'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types/product';
import { productApi, formatPrice } from '@/services/productApi';

export default function ProductPageClient() {
    const pathname = usePathname();
    // Extract ID from /product/123/ or /product/123
    const segments = pathname.split('/').filter(Boolean);
    const productId = Number(segments[1]);

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [copied, setCopied] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const touchStartX = useRef<number | null>(null);

    // Load liked state from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('dhanak_liked_products');
        if (stored) {
            try {
                const ids: number[] = JSON.parse(stored);
                if (ids.includes(productId)) setIsLiked(true);
            } catch { /* ignore */ }
        }
    }, [productId]);

    // Fetch product detail
    useEffect(() => {
        if (!productId || isNaN(productId)) {
            setError('Invalid product');
            setLoading(false);
            return;
        }

        let cancelled = false;
        productApi.getProduct(productId).then(res => {
            if (cancelled) return;
            if (res.success && res.data) {
                const p = res.data;
                p.images.sort((a, b) => {
                    if (a.isPrimary && !b.isPrimary) return -1;
                    if (!a.isPrimary && b.isPrimary) return 1;
                    return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
                });
                setProduct(p);
            } else {
                setError('Product not found');
            }
            setLoading(false);
        }).catch(() => {
            if (!cancelled) { setError('Failed to load product'); setLoading(false); }
        });
        return () => { cancelled = true; };
    }, [productId]);

    // Update document title + meta when product loads
    useEffect(() => {
        if (!product) return;
        const title = `${product.name} — ₹${product.price} | Dhanak Trinket`;
        document.title = title;

        // Update or create meta description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', `${product.name} — ${product.categoryName}. ${product.description || 'Shop ethnic jewelry at Dhanak Trinket.'}`);

        // Update og:title
        let ogTitle = document.querySelector('meta[property="og:title"]');
        if (!ogTitle) {
            ogTitle = document.createElement('meta');
            ogTitle.setAttribute('property', 'og:title');
            document.head.appendChild(ogTitle);
        }
        ogTitle.setAttribute('content', title);

        // Update og:image with product thumbnail
        const thumbUrl = product.images[0]?.thumbnailUrl;
        if (thumbUrl) {
            let ogImage = document.querySelector('meta[property="og:image"]');
            if (!ogImage) {
                ogImage = document.createElement('meta');
                ogImage.setAttribute('property', 'og:image');
                document.head.appendChild(ogImage);
            }
            ogImage.setAttribute('content', thumbUrl);
        }

        return () => { document.title = 'Dhanak Trinket — Ethnic Finds, Timeless Shine'; };
    }, [product]);

    // Keyboard navigation
    useEffect(() => {
        if (!product) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') setCurrentIndex(i => Math.max(0, i - 1));
            if (e.key === 'ArrowRight') setCurrentIndex(i => Math.min((product.images.length || 1) - 1, i + 1));
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [product]);

    const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null || !product) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) setCurrentIndex(i => Math.min(product.images.length - 1, i + 1));
            else setCurrentIndex(i => Math.max(0, i - 1));
        }
        touchStartX.current = null;
    };

    const handleLike = async () => {
        if (isLiked || !product) return;
        const res = await productApi.likeProduct(product.id);
        if (res.success) {
            setIsLiked(true);
            setProduct({ ...product, likesCount: product.likesCount + 1 });
            const stored = localStorage.getItem('dhanak_liked_products');
            const ids: number[] = stored ? JSON.parse(stored) : [];
            ids.push(product.id);
            localStorage.setItem('dhanak_liked_products', JSON.stringify(ids));
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        const text = product ? `Check out ${product.name} on Dhanak Trinket!` : 'Check this out on Dhanak Trinket!';

        if (navigator.share) {
            try {
                await navigator.share({ title: product?.name, text, url });
            } catch { /* user cancelled */ }
        } else {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleWhatsAppShare = () => {
        const url = window.location.href;
        const text = product ? `Check out ${product.name} — ${formatPrice(product.price)} on Dhanak Trinket! ${url}` : url;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Loading product...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center px-6">
                    <p className="text-5xl mb-4">😕</p>
                    <h1 className="text-xl font-semibold text-gray-800 mb-2">{error || 'Product not found'}</h1>
                    <p className="text-sm text-gray-500 mb-6">This product may have been removed or the link is incorrect.</p>
                    <Link href="/" className="inline-block bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                        Browse Collection
                    </Link>
                </div>
            </div>
        );
    }

    const currentImage = product.images[currentIndex];
    const displaySrc = currentImage?.imageUrl ?? currentImage?.thumbnailUrl;
    const hasMultiple = product.images.length > 1;

    return (
        <div className="min-h-screen bg-white">
            {/* Top bar */}
            <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-3 sm:px-6 flex items-center justify-between h-12 sm:h-14">
                    <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors">
                        <span className="text-lg">←</span>
                        <Image src="/logo.jpg" alt="Dhanak Trinket" width={28} height={28} className="rounded-full object-cover" />
                        <span className="text-sm font-medium hidden sm:inline">Dhanak Trinket</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <button onClick={handleShare}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                            aria-label="Share">
                            {copied ? (
                                <><span>✓</span><span className="hidden sm:inline">Copied!</span></>
                            ) : (
                                <><span>↗</span><span className="hidden sm:inline">Share</span></>
                            )}
                        </button>
                        <button onClick={handleWhatsAppShare}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                            aria-label="Share on WhatsApp">
                            <span>💬</span>
                            <span className="hidden sm:inline">WhatsApp</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Product content */}
            <main className="max-w-5xl mx-auto">
                <div className="sm:grid sm:grid-cols-2 sm:gap-8 sm:p-6 lg:p-8">
                    {/* Image gallery */}
                    <div className="relative aspect-[3/4] bg-gray-50 sm:rounded-xl sm:overflow-hidden"
                        onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                        {displaySrc ? (
                            <img src={displaySrc} alt={currentImage?.altText || product.name}
                                className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <div className="text-center">
                                    <div className="text-5xl mb-2">📷</div>
                                    <div className="text-sm">No Image</div>
                                </div>
                            </div>
                        )}

                        {!product.isInStock && (
                            <>
                                <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                                <div className="absolute top-3 left-3 bg-black/85 text-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider">
                                    Sold Out
                                </div>
                            </>
                        )}

                        {hasMultiple && (
                            <>
                                <button onClick={() => setCurrentIndex(i => Math.max(0, i - 1))} disabled={currentIndex === 0}
                                    className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white disabled:opacity-30 rounded-full w-10 h-10 items-center justify-center shadow transition-colors text-lg"
                                    aria-label="Previous image">‹</button>
                                <button onClick={() => setCurrentIndex(i => Math.min(product.images.length - 1, i + 1))} disabled={currentIndex === product.images.length - 1}
                                    className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white disabled:opacity-30 rounded-full w-10 h-10 items-center justify-center shadow transition-colors text-lg"
                                    aria-label="Next image">›</button>
                            </>
                        )}

                        {hasMultiple && (
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                {product.images.map((_, idx) => (
                                    <button key={idx} onClick={() => setCurrentIndex(idx)}
                                        className={`w-2.5 h-2.5 rounded-full transition-colors ${idx === currentIndex ? 'bg-indigo-600' : 'bg-white/70 hover:bg-white'}`}
                                        aria-label={`Image ${idx + 1}`} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Thumbnail strip (desktop, multiple images) */}
                    {hasMultiple && (
                        <div className="hidden sm:flex gap-2 mt-3 sm:col-span-2 sm:col-start-1 sm:row-start-2 sm:mt-0 sm:px-0 px-3 overflow-x-auto">
                            {product.images.map((img, idx) => (
                                <button key={img.id} onClick={() => setCurrentIndex(idx)}
                                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${idx === currentIndex ? 'border-indigo-600' : 'border-transparent hover:border-gray-300'}`}>
                                    <img src={img.thumbnailUrl || img.imageUrl} alt={img.altText || `Image ${idx + 1}`}
                                        className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Product details */}
                    <div className="px-4 sm:px-0 pt-5 pb-8">
                        <div className="flex items-start justify-between gap-3 mb-1">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug font-serif">{product.name}</h1>
                        </div>

                        <p className="text-2xl sm:text-3xl font-bold text-indigo-600 mt-2">{formatPrice(product.price)}</p>

                        <div className="flex items-center gap-3 mt-3">
                            <span className="text-sm text-gray-500 uppercase tracking-wider">{product.categoryName}</span>
                            {product.productCode && (
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">#{product.productCode}</span>
                            )}
                        </div>

                        {product.isInStock ? (
                            product.stockQuantity <= 5 ? (
                                <p className="mt-4 text-sm font-medium text-orange-600">
                                    Only {product.stockQuantity} left in stock
                                </p>
                            ) : (
                                <p className="mt-4 text-sm text-green-600 font-medium">In Stock</p>
                            )
                        ) : (
                            <p className="mt-4 text-sm text-gray-500">Currently unavailable</p>
                        )}

                        {product.description && (
                            <div className="mt-5 pt-5 border-t border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-800 mb-2">Description</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                            </div>
                        )}

                        {/* Like + share actions */}
                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <button onClick={handleLike} disabled={isLiked}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${isLiked
                                    ? 'border-red-200 bg-red-50 text-red-500 cursor-default'
                                    : 'border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500'
                                    }`}>
                                <span>{isLiked ? '❤️' : '🤍'}</span>
                                <span>{isLiked ? 'Liked' : 'Like'}</span>
                                {product.likesCount > 0 && (
                                    <span className="text-xs text-gray-400">({product.likesCount})</span>
                                )}
                            </button>

                            <button onClick={handleShare}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-400 transition-colors">
                                <span>↗</span>
                                <span>{copied ? 'Link Copied!' : 'Share'}</span>
                            </button>

                            <button onClick={handleWhatsAppShare}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors">
                                <span>💬</span>
                                <span>WhatsApp</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
