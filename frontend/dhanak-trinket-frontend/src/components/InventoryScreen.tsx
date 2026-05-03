'use client';

import { useState, useEffect, useCallback } from 'react';
import { Product, SaleDto } from '@/types/product';
import { productApi } from '@/services/productApi';
import MarkAsSoldModal from '@/components/MarkAsSoldModal';
import { formatPrice } from '@/services/productApi';

export default function InventoryScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [soldModalProduct, setSoldModalProduct] = useState<Product | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const showToast = (type: 'success' | 'error', text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 5000);
    };

    const loadProducts = useCallback(async () => {
        setLoading(true);
        const res = await productApi.getProducts({ inStockOnly: false, pageSize: 100 });
        if (res.success && res.data) setProducts(res.data);
        setLoading(false);
    }, []);

    useEffect(() => { loadProducts(); }, [loadProducts]);

    // After a sale is recorded, decrement stock count client-side immediately
    // (no extra network call needed)
    const handleSaleSuccess = (sale: SaleDto) => {
        setProducts(prev => prev.map(p => {
            if (p.id !== sale.productId) return p;
            const newStock = Math.max(0, p.stockQuantity - sale.quantitySold);
            return { ...p, stockQuantity: newStock, isInStock: newStock > 0 };
        }));
        showToast('success',
            `Sale #${sale.id} recorded — ${sale.productName} × ${sale.quantitySold} = ${formatPrice(sale.totalAmount)}`
        );
        setSoldModalProduct(null);
    };

    const handleSaleError = (text: string) => {
        showToast('error', text);
    };

    return (
        <div className="space-y-4">
            {/* Toast */}
            {toast && (
                <div className={`rounded-lg px-4 py-3 text-sm flex items-start gap-3 ${
                    toast.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                    <span className="flex-1">{toast.text}</span>
                    <button onClick={() => setToast(null)} className="text-current opacity-60 hover:opacity-100">✕</button>
                </div>
            )}

            {/* Header row */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Inventory</h2>
                    <p className="text-sm text-gray-500">Click &quot;Mark as Sold&quot; to record a sale — stock updates instantly.</p>
                </div>
                <button onClick={loadProducts} disabled={loading}
                    className="text-sm text-indigo-600 hover:underline disabled:opacity-50">
                    {loading ? 'Loading…' : 'Refresh'}
                </button>
            </div>

            {/* Table */}
            {loading ? (
                <div className="text-center py-16 text-gray-400 text-sm">Loading products…</div>
            ) : products.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-sm">No products found.</div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                            <tr>
                                <th className="px-4 py-3 text-left">Product</th>
                                <th className="px-4 py-3 text-left">Category</th>
                                <th className="px-4 py-3 text-right">Price</th>
                                <th className="px-4 py-3 text-center">Stock</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {products.map(p => (
                                <tr key={p.id} className={`hover:bg-gray-50 ${!p.isInStock ? 'opacity-60' : ''}`}>
                                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[220px] truncate" title={p.name}>
                                        {p.name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">{p.category}</td>
                                    <td className="px-4 py-3 text-right text-gray-700">{formatPrice(p.price)}</td>
                                    <td className="px-4 py-3 text-center text-gray-700 font-medium">{p.stockQuantity}</td>
                                    <td className="px-4 py-3 text-center">
                                        {p.isInStock ? (
                                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">In Stock</span>
                                        ) : (
                                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Sold Out</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => setSoldModalProduct(p)}
                                            disabled={p.stockQuantity === 0}
                                            className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Mark as Sold
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Mark as Sold Modal */}
            {soldModalProduct && (
                <MarkAsSoldModal
                    product={soldModalProduct}
                    onClose={() => setSoldModalProduct(null)}
                    onSaleRecorded={handleSaleSuccess}
                    onError={handleSaleError}
                />
            )}
        </div>
    );
}
