'use client';

import { useEffect, useState } from 'react';
import { Product, ProductImage } from '@/types/product';
import { productApi, formatPrice } from '@/services/productApi';

interface ProductDetailModalProps {
    product: Product;   // from the list — has name/price/description/thumbnailUrl
    onClose: () => void;
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
    const [allImages, setAllImages] = useState<ProductImage[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imageLoading, setImageLoading] = useState(true);

    // Fetch product detail on mount to get fresh SAS URLs for all images
    useEffect(() => {
        let cancelled = false;
        productApi.getProduct(product.id).then(res => {
            if (cancelled) return;
            const images = res.data?.images ?? [];
            // Sort: primary first, then by displayOrder
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

    // Close on Escape, arrow keys for navigation
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') setCurrentIndex(i => Math.max(0, i - 1));
            if (e.key === 'ArrowRight') setCurrentIndex(i => Math.min((allImages.length || 1) - 1, i + 1));
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose, allImages.length]);

    // While loading, show thumbnail from list data
    const primaryImg = product.images.find(i => i.isPrimary) ?? product.images[0];
    const currentImage = allImages[currentIndex];
    const displaySrc = currentImage?.imageUrl ?? primaryImg?.thumbnailUrl ?? primaryImg?.imageUrl;
    const hasMultiple = allImages.length > 1;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={onClose}
        >
            <div
                className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-10 bg-white/80 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 shadow transition-colors"
                    aria-label="Close"
                >
                    ✕
                </button>

                {/* Image area */}
                <div className="relative aspect-square bg-gray-100">
                    {displaySrc ? (
                        <img
                            src={displaySrc}
                            alt={currentImage?.altText || product.name}
                            className={`w-full h-full object-contain transition-opacity duration-300 ${imageLoading ? 'opacity-60' : 'opacity-100'}`}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <div className="text-5xl mb-2">📷</div>
                                <div className="text-sm">No Image</div>
                            </div>
                        </div>
                    )}

                    {/* Loading overlay while full image fetches */}
                    {imageLoading && displaySrc && (
                        <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none">
                            <span className="text-xs text-white bg-black/40 px-2 py-0.5 rounded-full">Loading full image…</span>
                        </div>
                    )}

                    {/* Left/Right navigation arrows */}
                    {hasMultiple && (
                        <>
                            <button
                                onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                                disabled={currentIndex === 0}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white disabled:opacity-30 rounded-full w-9 h-9 flex items-center justify-center shadow transition-colors"
                                aria-label="Previous image"
                            >
                                ‹
                            </button>
                            <button
                                onClick={() => setCurrentIndex(i => Math.min(allImages.length - 1, i + 1))}
                                disabled={currentIndex === allImages.length - 1}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white disabled:opacity-30 rounded-full w-9 h-9 flex items-center justify-center shadow transition-colors"
                                aria-label="Next image"
                            >
                                ›
                            </button>
                        </>
                    )}

                    {/* Dot indicators */}
                    {hasMultiple && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {allImages.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`w-2 h-2 rounded-full transition-colors ${idx === currentIndex ? 'bg-indigo-600' : 'bg-white/70 hover:bg-white'}`}
                                    aria-label={`Image ${idx + 1}`}
                                />
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
    );
}

