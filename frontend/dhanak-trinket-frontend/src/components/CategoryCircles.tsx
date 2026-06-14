'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Category, Product } from '@/types/product';
import { productApi } from '@/services/productApi';

interface CategoryWithImage extends Category {
    thumbnailUrl?: string;
}

interface CategoryCirclesProps {
    onCategoryClick: (categoryId: number) => void;
}

export default function CategoryCircles({ onCategoryClick }: CategoryCirclesProps) {
    const [categories, setCategories] = useState<CategoryWithImage[]>([]);

    useEffect(() => {
        const load = async () => {
            const catRes = await productApi.getCategories();
            if (!catRes.success || !catRes.data) return;

            // For each category, fetch 1 product to get a thumbnail
            const enriched = await Promise.all(
                catRes.data.map(async (cat) => {
                    const prodRes = await productApi.getProducts({
                        categoryId: cat.id,
                        pageSize: 1,
                        inStockOnly: true,
                    });
                    const firstProduct = prodRes.data?.items?.[0];
                    const thumb = firstProduct?.images?.[0]?.thumbnailUrl;
                    return { ...cat, thumbnailUrl: thumb };
                })
            );
            // Only show categories that have at least one product with an image
            setCategories(enriched.filter(c => c.thumbnailUrl));
        };
        load();
    }, []);

    if (categories.length === 0) return null;

    return (
        <section className="py-8 sm:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 mb-6 text-center sm:text-left">
                    Shop by Category
                </h3>
                <div className="flex gap-5 sm:gap-0 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 sm:justify-items-center">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => onCategoryClick(cat.id)}
                            className="flex flex-col items-center gap-2 flex-shrink-0 group w-24 sm:w-full sm:max-w-[120px]"
                        >
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-gray-100 group-hover:border-amber-300 transition-colors bg-gray-50">
                                {cat.thumbnailUrl ? (
                                    <Image
                                        src={cat.thumbnailUrl}
                                        alt={cat.name}
                                        width={96}
                                        height={96}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">💍</div>
                                )}
                            </div>
                            <span className="text-xs sm:text-sm text-gray-700 font-medium uppercase tracking-wider text-center">
                                {cat.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}
