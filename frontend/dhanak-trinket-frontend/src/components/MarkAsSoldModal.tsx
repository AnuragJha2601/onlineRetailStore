'use client';

import { useState } from 'react';
import { Product, RecordSaleRequest, SaleType, SALE_CHANNELS } from '@/types/product';
import { productApi } from '@/services/productApi';

interface MarkAsSoldModalProps {
    product: Product;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

export default function MarkAsSoldModal({ product, onClose, onSuccess, onError }: MarkAsSoldModalProps) {
    const today = new Date().toISOString().split('T')[0];

    const [saleType, setSaleType] = useState<SaleType>(SaleType.Retail);
    const [quantitySold, setQuantitySold] = useState(1);
    const [sellingPrice, setSellingPrice] = useState(product.price);
    const [saleDate, setSaleDate] = useState(today);
    const [saleChannel, setSaleChannel] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [buyerName, setBuyerName] = useState('');
    const [buyerPhone, setBuyerPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const maxQty = product.stockQuantity || 1;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const request: RecordSaleRequest = {
                productId: product.id,
                productName: product.name,
                saleType,
                quantitySold,
                sellingPrice,
                saleDate: new Date(saleDate).toISOString(),
                saleChannel: saleChannel || undefined,
                notes: notes || undefined,
                ...(saleType === SaleType.Retail
                    ? { customerName: customerName || undefined, customerPhone: customerPhone || undefined }
                    : { buyerName: buyerName || undefined, buyerPhone: buyerPhone || undefined }),
            };

            const result = await productApi.recordSale(request);
            if (result.success) {
                onSuccess(`Sale recorded! ${product.name} — ${quantitySold} × ₹${sellingPrice.toFixed(0)} = ₹${(quantitySold * sellingPrice).toFixed(0)}`);
                onClose();
            } else {
                onError(result.message || 'Failed to record sale.');
            }
        } catch {
            onError('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Mark as Sold</h2>
                        <p className="text-sm text-gray-500 mt-0.5">{product.name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
                    {/* Sale Type Toggle */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sale Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setSaleType(SaleType.Retail)}
                                className={`py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                                    saleType === SaleType.Retail
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                            >
                                🛍️ Retail
                                <p className="text-xs font-normal mt-0.5 opacity-70">Single / regular sale</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSaleType(SaleType.Wholesale)}
                                className={`py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                                    saleType === SaleType.Wholesale
                                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                            >
                                📦 Wholesale
                                <p className="text-xs font-normal mt-0.5 opacity-70">Bulk deal</p>
                            </button>
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Sale <span className="text-red-500">*</span></label>
                        <input
                            type="date"
                            value={saleDate}
                            onChange={e => setSaleDate(e.target.value)}
                            required
                            max={today}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Quantity + Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Qty Sold <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                min={1}
                                max={maxQty}
                                value={quantitySold}
                                onChange={e => setQuantitySold(Number(e.target.value))}
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <p className="text-xs text-gray-400 mt-1">In stock: {product.stockQuantity}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹) <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                min={0.01}
                                step={0.01}
                                value={sellingPrice}
                                onChange={e => setSellingPrice(Number(e.target.value))}
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <p className="text-xs text-gray-400 mt-1">Catalog: ₹{product.price}</p>
                        </div>
                    </div>

                    {/* Total preview */}
                    <div className="bg-gray-50 rounded-lg px-4 py-3 flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total</span>
                        <span className="text-lg font-semibold text-gray-900">₹{(quantitySold * sellingPrice).toFixed(0)}</span>
                    </div>

                    {/* Sale Channel */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sale Channel</label>
                        <select
                            value={saleChannel}
                            onChange={e => setSaleChannel(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">— Select (optional) —</option>
                            {SALE_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Retail: customer info */}
                    {saleType === SaleType.Retail && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                    placeholder="Optional"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={customerPhone}
                                    onChange={e => setCustomerPhone(e.target.value)}
                                    placeholder="Optional"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Wholesale: buyer info */}
                    {saleType === SaleType.Wholesale && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Name</label>
                                <input
                                    type="text"
                                    value={buyerName}
                                    onChange={e => setBuyerName(e.target.value)}
                                    placeholder="Optional"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Phone</label>
                                <input
                                    type="tel"
                                    value={buyerPhone}
                                    onChange={e => setBuyerPhone(e.target.value)}
                                    placeholder="Optional"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={2}
                            placeholder="Any notes about this sale (optional)"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                        >
                            {isSubmitting ? 'Saving…' : 'Record Sale'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
