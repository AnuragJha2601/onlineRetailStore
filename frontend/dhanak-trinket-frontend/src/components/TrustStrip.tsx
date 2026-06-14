'use client';

import Image from 'next/image';
import { useState } from 'react';

const FEATURES = [
    {
        title: 'Timeless Design',
        desc: 'Elegant pieces you\'ll wear beyond seasons.',
    },
    {
        title: 'Comfort First',
        desc: 'Lightweight enough for long celebrations.',
    },
    {
        title: 'Made to Last',
        desc: 'Designed to retain their beauty over time.',
    },
    {
        title: 'Thoughtful Gifting',
        desc: 'Pieces chosen with love.',
    },
];

const LIFESTYLE_IMAGE = '/why-dhanak.png'; // place image in public/

export default function TrustStrip() {
    const [imgError, setImgError] = useState(false);
    const showImage = !imgError;

    return (
        <section className="py-6 sm:py-10 bg-gradient-to-b from-amber-50/50 to-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Split layout: image + text */}
                <div className={`flex flex-col ${showImage ? 'lg:flex-row' : ''} items-center gap-6 lg:gap-12`}>

                    {/* Lifestyle image — gracefully hidden if missing */}
                    {showImage && (
                        <div className="w-full lg:w-1/2 flex-shrink-0">
                            <div className="relative aspect-[4/3] sm:aspect-[4/5] rounded-2xl overflow-hidden bg-amber-50">
                                <Image
                                    src={LIFESTYLE_IMAGE}
                                    alt="Woman wearing Dhanak Trinket jewelry"
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 1024px) 100vw, 40vw"
                                    onError={() => setImgError(true)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Text content */}
                    <div className={`w-full ${showImage ? 'lg:w-1/2' : 'max-w-2xl mx-auto'}`}>
                        {/* Section heading */}
                        <div className={`mb-4 sm:mb-8 ${showImage ? 'text-center lg:text-left' : 'text-center'}`}>
                            <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-700/70 mb-2">
                                Why Women Choose
                            </h3>
                            <p className="font-serif text-2xl sm:text-3xl font-medium text-gray-800 tracking-wide">
                                Dhanak Trinket
                            </p>
                            <div className={`mt-3 w-16 h-px bg-amber-300/60 ${showImage ? 'mx-auto lg:mx-0' : 'mx-auto'}`} />
                        </div>

                        {/* Tagline */}
                        <p className={`text-gray-500 text-sm sm:text-base leading-relaxed max-w-lg mb-4 sm:mb-8 italic ${showImage ? 'text-center lg:text-left mx-auto lg:mx-0' : 'text-center mx-auto'}`}>
                            Designed to shine through everyday moments and celebrations alike.
                        </p>

                        {/* Feature grid */}
                        <div className="grid grid-cols-2 gap-4 sm:gap-6">
                            {FEATURES.map((item) => (
                                <div key={item.title} className="flex items-start gap-3">
                                    {/* Gold accent dot */}
                                    <span className="flex-shrink-0 mt-1 w-2 h-2 rounded-full bg-amber-400/70" />
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-0.5">
                                            {item.title}
                                        </p>
                                        <p className="text-sm text-gray-500 leading-relaxed">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom divider */}
                <div className="mt-6 sm:mt-10 mx-auto w-24 h-px bg-amber-200/40" />
            </div>
        </section>
    );
}
