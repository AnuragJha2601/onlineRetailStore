const TRUST_ITEMS = [
    { icon: '🛡️', label: 'Anti Tarnish', desc: 'Long lasting shine, every day.' },
    { icon: '💧', label: 'Water Resistant', desc: 'Wear it worry-free, everywhere.' },
    { icon: '🪶', label: 'Lightweight', desc: 'Designed for comfort, all day long.' },
    { icon: '💜', label: 'Everyday Wear', desc: 'Perfect for work, brunch or date night.' },
];

export default function TrustStrip() {
    return (
        <section className="py-10 sm:py-14 bg-gradient-to-b from-amber-50/40 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 mb-8 text-center">
                    Why Dhanak?
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
                    {TRUST_ITEMS.map((item) => (
                        <div key={item.label} className="flex flex-col items-center text-center gap-2">
                            <span className="text-3xl">{item.icon}</span>
                            <p className="text-sm font-semibold text-gray-800 uppercase tracking-wider">{item.label}</p>
                            <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
