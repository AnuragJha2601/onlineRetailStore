'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Product } from '@/types/product';
import { productApi, formatPrice } from '@/services/productApi';
import ProductDetailModal from '@/components/ProductDetailModal';

interface ProductCarouselProps {
    title: string;
    sortBy: 'newest' | 'popular';
    pageSize?: number;
}

export default function ProductCarousel({ title, sortBy, pageSize = 10 }: ProductCarouselProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const load = async () => {
            const res = await productApi.getProducts({
                sortBy,
                pageSize,
                inStockOnly: true,
            });
            if (res.success && res.data) {
                setProducts(res.data.items);
            }
        };
        load();
    }, [sortBy, pageSize]);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        const amount = scrollRef.current.clientWidth * 0.7;
        scrollRef.current.scrollBy({
            left: direction === 'left' ? -amount : amount,
            behavior: 'smooth',
        });
    };

    const openProduct = (product: Product) => {
        setSelectedProduct(product);
        window.history.pushState({ productId: product.id }, '', `/product/${product.id}/`);
    };

    const closeProduct = () => {
        setSelectedProduct(null);
        if (window.location.pathname.startsWith('/product/')) {
            window.history.pushState(null, '', '/');
        }
    };

    if (products.length === 0) return null;

    return (
        <section className="py-8 sm:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header with arrows */}
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                        {title}
                    </h3>
                    <div className="hidden sm:flex gap-1.5">
                        <button
                            onClick={() => scroll('left')}
                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-400 transition-colors"
                            aria-label="Scroll left"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-400 transition-colors"
                            aria-label="Scroll right"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Scrollable row */}
                <div
                    ref={scrollRef}
                    className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory"
                >
                    {products.map((product) => {
                        const img = product.images.find(i => i.isPrimary) || product.images[0];
                        const src = img?.thumbnailUrl || img?.imageUrl;
                        return (
                            <div
                                key={product.id}
                                className="flex-shrink-0 w-[44vw] sm:w-[220px] snap-start cursor-pointer group"
                                onClick={() => openProduct(product)}
                            >
                                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-50">
                                    {src ? (
                                        <Image
                                            src={src}
                                            alt={product.name}
                                            fill
                                            sizes="(max-width: 640px) 44vw, 220px"
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">📷</div>
                                    )}
                                </div>
                                <div className="mt-2 px-0.5">
                                    <p className="text-sm text-gray-800 font-serif line-clamp-1">{product.name}</p>
                                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{formatPrice(product.price)}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal */}
            {selectedProduct && (
                <ProductDetailModal product={selectedProduct} onClose={closeProduct} />
            )}
        </section>
    );
}
