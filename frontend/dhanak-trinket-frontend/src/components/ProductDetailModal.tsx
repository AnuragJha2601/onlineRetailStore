'use client';

import { useEffect } from 'react';
import { Product } from '@/types/product';
import { formatPrice } from '@/services/productApi';

interface ProductDetailModalProps {
    product: Product;
    onClose: () => void;
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
    const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];

    // Close on Escape key
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

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

                {/* Full-size image */}
                <div className="relative aspect-square bg-gray-100">
                    {primaryImage ? (
                        <img
                            src={primaryImage.imageUrl}
                            alt={primaryImage.altText || product.name}
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <div className="text-5xl mb-2">📷</div>
                                <div className="text-sm">No Image</div>
                            </div>
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
