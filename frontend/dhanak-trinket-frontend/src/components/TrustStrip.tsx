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

export default function TrustStrip() {
    return (
        <section className="py-14 sm:py-20 bg-gradient-to-b from-amber-50/50 to-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section heading */}
                <div className="text-center mb-10 sm:mb-14">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-700/70 mb-3">
                        Why Women Choose
                    </h3>
                    <p className="font-serif text-2xl sm:text-3xl text-gray-800 tracking-wide">
                        Dhanak Trinket
                    </p>
                    <div className="mt-4 mx-auto w-16 h-px bg-amber-300/60" />
                </div>

                {/* Tagline */}
                <p className="text-center text-gray-500 text-sm sm:text-base leading-relaxed max-w-lg mx-auto mb-10 sm:mb-14 italic">
                    Crafted to become part of your everyday moments.
                </p>

                {/* Feature grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 max-w-2xl mx-auto">
                    {FEATURES.map((item, i) => (
                        <div key={item.title} className="flex items-start gap-4">
                            {/* Decorative number */}
                            <span className="flex-shrink-0 w-8 h-8 rounded-full border border-amber-300/50 flex items-center justify-center text-xs text-amber-700/60 font-medium">
                                {i + 1}
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-1">
                                    {item.title}
                                </p>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom divider */}
                <div className="mt-12 sm:mt-16 mx-auto w-24 h-px bg-amber-200/40" />
            </div>
        </section>
    );
}
