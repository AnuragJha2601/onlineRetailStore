'use client';

import { useEffect, useState, useRef } from 'react';
import { Product, ProductImage } from '@/types/product';
import { productApi, formatPrice } from '@/services/productApi';

interface ProductDetailModalProps {
    product: Product;
    onClose: () => void;
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
    const [allImages, setAllImages] = useState<ProductImage[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imageLoading, setImageLoading] = useState(true);
    const touchStartX = useRef<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        productApi.getProduct(product.id).then(res => {
            if (cancelled) return;
            const images = res.data?.images ?? [];
            images.sort((a, b) => {
                if (a.isPrimary && !b.isPrimary) return -1;
                if (!a.isPrimary && b.isPrimary) return 1;
                return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
            });
            setAllImages(images);
            setImageLoading(false);
        }).catch(() => {
            if (!cancelled) setImageLoading(false);
        });
        return () => { cancelled = true; };
    }, [product.id]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') setCurrentIndex(i => Math.max(0, i - 1));
            if (e.key === 'ArrowRight') setCurrentIndex(i => Math.min((allImages.length || 1) - 1, i + 1));
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose, allImages.length]);

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    // Swipe gestures for image gallery
    const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) setCurrentIndex(i => Math.min((allImages.length || 1) - 1, i + 1));
            else setCurrentIndex(i => Math.max(0, i - 1));
        }
        touchStartX.current = null;
    };

    const primaryImg = product.images.find(i => i.isPrimary) ?? product.images[0];
    const currentImage = allImages[currentIndex];
    const displaySrc = currentImage?.imageUrl ?? primaryImg?.thumbnailUrl ?? primaryImg?.imageUrl;
    const hasMultiple = allImages.length > 1;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 sm:flex sm:items-center sm:justify-center sm:p-4"
            onClick={onClose}>
            {/* Mobile: full-screen sheet / Desktop: centered modal */}
            <div
                className="relative bg-white w-full h-full sm:h-auto sm:max-w-lg sm:rounded-2xl sm:shadow-2xl sm:max-h-[90vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Mobile sticky header */}
                <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-100 sm:hidden">
                    <button onClick={onClose} className="text-gray-600 text-sm font-medium">← Back</button>
                    <span className="text-xs text-gray-400 truncate max-w-[55%]">{product.name}</span>
                    <div className="w-10" />
                </div>

                {/* Desktop close button */}
                <button onClick={onClose}
                    className="hidden sm:flex absolute top-3 right-3 z-20 bg-white/80 hover:bg-white rounded-full w-8 h-8 items-center justify-center text-gray-600 hover:text-gray-900 shadow transition-colors"
                    aria-label="Close">
                    ✕
                </button>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
                    {/* Image area with swipe support */}
                    <div className="relative aspect-[3/4] bg-gray-100"
                        onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                        {displaySrc ? (
                            <img src={displaySrc} alt={currentImage?.altText || product.name}
                                className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-60' : 'opacity-100'}`} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <div className="text-center">
                                    <div className="text-5xl mb-2">📷</div>
                                    <div className="text-sm">No Image</div>
                                </div>
                            </div>
                        )}

                        {imageLoading && displaySrc && (
                            <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none">
                                <span className="text-xs text-white bg-black/40 px-2 py-0.5 rounded-full">Loading full image…</span>
                            </div>
                        )}

                        {/* Desktop arrows */}
                        {hasMultiple && (
                            <>
                                <button onClick={() => setCurrentIndex(i => Math.max(0, i - 1))} disabled={currentIndex === 0}
                                    className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white disabled:opacity-30 rounded-full w-9 h-9 items-center justify-center shadow transition-colors"
                                    aria-label="Previous image">‹</button>
                                <button onClick={() => setCurrentIndex(i => Math.min(allImages.length - 1, i + 1))} disabled={currentIndex === allImages.length - 1}
                                    className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white disabled:opacity-30 rounded-full w-9 h-9 items-center justify-center shadow transition-colors"
                                    aria-label="Next image">›</button>
                            </>
                        )}

                        {/* Dot indicators */}
                        {hasMultiple && (
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                {allImages.map((_, idx) => (
                                    <button key={idx} onClick={() => setCurrentIndex(idx)}
                                        className={`w-2 h-2 rounded-full transition-colors ${idx === currentIndex ? 'bg-indigo-600' : 'bg-white/70 hover:bg-white'}`}
                                        aria-label={`Image ${idx + 1}`} />
                                ))}
                            </div>
                        )}

                        {!product.isInStock && (
                            <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                Sold Out
                            </div>
                        )}
                    </div>

                    {/* Product details */}
                    <div className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <h2 className="text-xl font-bold text-gray-900 leading-snug">{product.name}</h2>
                            <span className="text-xl font-bold text-indigo-600 whitespace-nowrap">
                                {formatPrice(product.price)}
                            </span>
                        </div>

                        <p className="text-sm text-gray-500 mb-3">{product.categoryName}</p>

                        {product.description && (
                            <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>
                        )}

                        {product.isInStock && product.stockQuantity <= 5 && (
                            <p className="mt-3 text-xs font-medium text-orange-600">
                                Only {product.stockQuantity} left in stock
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

