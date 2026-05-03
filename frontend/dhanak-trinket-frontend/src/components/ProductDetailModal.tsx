'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/types/product';
import { productApi, formatPrice } from '@/services/productApi';

interface ProductDetailModalProps {
    product: Product;   // from the list — has name/price/description/thumbnailUrl
    onClose: () => void;
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
    // Full-image SAS URL fetched lazily on open (not available in list response)
    const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState(true);

    // Fetch product detail on mount to get the fresh SAS URL for the full image
    useEffect(() => {
        let cancelled = false;
        productApi.getProduct(product.id).then(res => {
            if (cancelled) return;
            const primaryImg = res.data?.images.find(i => i.isPrimary) ?? res.data?.images[0];
            setFullImageUrl(primaryImg?.imageUrl ?? null);
            setImageLoading(false);
        }).catch(() => {
            if (!cancelled) setImageLoading(false);
        });
        return () => { cancelled = true; };
    }, [product.id]);

    // Close on Escape key
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    // Show thumbnail from the list data while the full image loads
    const primaryImg = product.images.find(i => i.isPrimary) ?? product.images[0];
    const displaySrc = fullImageUrl ?? primaryImg?.thumbnailUrl ?? primaryImg?.imageUrl;

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
                            alt={primaryImg?.altText || product.name}
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

                    <p className="text-sm text-gray-500 mb-3">{product.category}</p>

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

