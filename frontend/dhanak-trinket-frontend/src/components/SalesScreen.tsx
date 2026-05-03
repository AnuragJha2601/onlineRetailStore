'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Product,
    SaleType,
    SaleDto,
    BulkSaleItemRequest,
    RecordSaleRequest,
    SALE_CHANNELS,
} from '@/types/product';
import { productApi } from '@/services/productApi';
import { formatPrice, formatDate } from '@/services/productApi';

function todayISO() {
    return new Date().toISOString().split('T')[0];
}

// ─── Line item row state (frontend-only) ────────────────────────────────────
interface LineItemRow {
    key: number;  // local key for React
    description: string;
    quantity: number;
    unitPrice: string;
}

// ─── Sale Form Panel ──────────────────────────────────────────────────────────

interface SaleFormPanelProps {
    products: Product[];           // in-stock catalog products for dropdown
    onSaved: (sale: SaleDto) => void;
    onCancel: () => void;
}

function SaleFormPanel({ products, onSaved, onCancel }: SaleFormPanelProps) {
    const [saleType, setSaleType] = useState<SaleType>(SaleType.Retail);
    const [saleDate, setSaleDate] = useState(todayISO());

    // Retail fields
    const [selectedProductId, setSelectedProductId] = useState<number | 'custom'>('custom');
    const [customName, setCustomName] = useState('');
    const [qty, setQty] = useState(1);
    const [price, setPrice] = useState('');
    const [channel, setChannel] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [notes, setNotes] = useState('');

    // Bulk sale — line-items mode (default) vs summary mode
    const [bulkSummaryMode, setBulkSummaryMode] = useState(false);
    const [lineItems, setLineItems] = useState<LineItemRow[]>([
        { key: 1, description: '', quantity: 1, unitPrice: '' },
    ]);
    const [bulkDescription, setBulkDescription] = useState('');
    const [bulkTotal, setBulkTotal] = useState('');
    // shared bulk fields
    const [buyerName, setBuyerName] = useState('');
    const [buyerPhone, setBuyerPhone] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // ── helpers ──────────────────────────────────────────────────────────────
    const handleSaleTypeChange = (t: SaleType) => { setSaleType(t); setError(''); };

    const handleProductChange = (value: string) => {
        if (value === 'custom') {
            setSelectedProductId('custom');
            setPrice('');
        } else {
            const id = Number(value);
            setSelectedProductId(id);
            const p = products.find(x => x.id === id);
            if (p) setPrice(String(p.price));
        }
        setQty(1);
    };

    const addLineItem = () =>
        setLineItems(prev => [...prev, { key: Date.now(), description: '', quantity: 1, unitPrice: '' }]);

    const removeLineItem = (key: number) =>
        setLineItems(prev => prev.filter(i => i.key !== key));

    const updateLineItem = (key: number, field: keyof Omit<LineItemRow, 'key'>, value: string | number) =>
        setLineItems(prev => prev.map(i => i.key === key ? { ...i, [field]: value } : i));

    const selectedProduct = selectedProductId === 'custom'
        ? null
        : products.find(p => p.id === selectedProductId) ?? null;

    const maxQty = selectedProduct ? selectedProduct.stockQuantity : 999;
    const priceNum = parseFloat(price) || 0;
    const bulkTotalNum = parseFloat(bulkTotal) || 0;
    const lineItemsTotal = lineItems.reduce((sum, i) => sum + (i.quantity * (parseFloat(i.unitPrice) || 0)), 0);

    // ── submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        let req: RecordSaleRequest;

        if (saleType === SaleType.Retail) {
            if (selectedProductId === 'custom' && !customName.trim()) {
                setError('Enter a product name for custom items.');
                return;
            }
            if (qty < 1) { setError('Quantity must be at least 1.'); return; }
            if (priceNum <= 0) { setError('Enter a valid selling price.'); return; }
            req = {
                productId: selectedProductId === 'custom' ? undefined : selectedProductId,
                productName: selectedProduct?.name ?? customName.trim(),
                saleType,
                quantitySold: qty,
                sellingPrice: priceNum,
                saleDate: new Date(saleDate + 'T00:00:00').toISOString(),
                saleChannel: channel || undefined,
                customerName: customerName.trim() || undefined,
                customerPhone: customerPhone.trim() || undefined,
                notes: notes.trim() || undefined,
            };
        } else {
            // Bulk Sale
            if (!bulkSummaryMode) {
                if (lineItems.length === 0) { setError('Add at least one item.'); return; }
                if (lineItems.some(i => !i.description.trim())) { setError('All items need a description.'); return; }
                if (lineItems.some(i => i.quantity < 1)) { setError('All quantities must be at least 1.'); return; }
                if (lineItems.some(i => (parseFloat(i.unitPrice) || 0) <= 0)) {
                    setError('All item prices must be greater than zero.');
                    return;
                }
                req = {
                    productId: undefined,
                    productName: 'Bulk Sale',
                    saleType: SaleType.BulkSale,
                    quantitySold: 1,
                    sellingPrice: 0,
                    saleDate: new Date(saleDate + 'T00:00:00').toISOString(),
                    buyerName: buyerName.trim() || undefined,
                    buyerPhone: buyerPhone.trim() || undefined,
                    notes: notes.trim() || undefined,
                    items: lineItems.map(i => ({
                        description: i.description.trim(),
                        quantity: i.quantity,
                        unitPrice: parseFloat(i.unitPrice),
                    } satisfies BulkSaleItemRequest)),
                };
            } else {
                if (!bulkDescription.trim()) { setError('Description of items sold is required.'); return; }
                if (bulkTotalNum <= 0) { setError('Enter a valid total amount.'); return; }
                req = {
                    productId: undefined,
                    productName: 'Bulk Sale',
                    saleType: SaleType.BulkSale,
                    quantitySold: 1,
                    sellingPrice: bulkTotalNum,
                    saleDate: new Date(saleDate + 'T00:00:00').toISOString(),
                    buyerName: buyerName.trim() || undefined,
                    buyerPhone: buyerPhone.trim() || undefined,
                    notes: bulkDescription.trim() + (notes.trim() ? '\n' + notes.trim() : ''),
                };
            }
        }

        setIsSubmitting(true);
        try {
            const res = await productApi.recordSale(req);
            if (!res.success || !res.data) {
                setError(res.message || 'Failed to record sale.');
                return;
            }
            onSaved(res.data);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── render ────────────────────────────────────────────────────────────────
    return (
        <form onSubmit={handleSubmit}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">Record New Sale</h3>
                <button type="button" onClick={onCancel}
                    className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            {/* Sale Type toggle */}
            <div className="grid grid-cols-2 gap-2">
                {([SaleType.Retail, SaleType.BulkSale] as const).map(t => (
                    <button key={t} type="button" onClick={() => handleSaleTypeChange(t)}
                        className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${saleType === t
                                ? t === SaleType.Retail
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                    : 'border-amber-500 bg-amber-50 text-amber-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}>
                        {t === SaleType.Retail ? '🛍️ Retail' : '📦 Bulk Sale'}
                        <p className="text-xs font-normal mt-0.5 opacity-70">
                            {t === SaleType.Retail ? 'Single / regular sale' : 'Multiple items, one deal'}
                        </p>
                    </button>
                ))}
            </div>

            {/* Date */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input type="date" value={saleDate} max={todayISO()}
                    onChange={e => setSaleDate(e.target.value)} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none" />
            </div>

            {/* ── RETAIL fields ── */}
            {saleType === SaleType.Retail && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                        <select
                            value={selectedProductId === 'custom' ? 'custom' : String(selectedProductId)}
                            onChange={e => handleProductChange(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white">
                            <option value="custom">✦ Custom / not in catalog</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} — {formatPrice(p.price)} ({p.stockQuantity} in stock)
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedProductId === 'custom' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                            <input type="text" value={customName}
                                onChange={e => setCustomName(e.target.value)}
                                placeholder="e.g. Oxidised earrings (not in catalog)"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none" />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Qty Sold *</label>
                            <input type="number" min={1} max={maxQty} value={qty}
                                onChange={e => setQty(Number(e.target.value))} required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none" />
                            {selectedProduct && (
                                <p className="text-xs text-gray-400 mt-1">Max: {selectedProduct.stockQuantity}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹) *</label>
                            <input type="number" min={0.01} step={0.01} value={price}
                                onChange={e => setPrice(e.target.value)} required placeholder="0"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none" />
                            {selectedProduct && (
                                <p className="text-xs text-gray-400 mt-1">Catalog: {formatPrice(selectedProduct.price)}</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg px-4 py-3 flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total</span>
                        <span className="text-lg font-semibold text-gray-900">{formatPrice(qty * priceNum)}</span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sale Channel <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <select value={channel} onChange={e => setChannel(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white">
                            <option value="">— Select —</option>
                            {SALE_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Customer Name <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
                                placeholder="Optional"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                                placeholder="Optional"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none resize-none" />
                    </div>
                </>
            )}

            {/* ── BULK SALE fields ── */}
            {saleType === SaleType.BulkSale && (
                <>
                    {/* Line-items / Summary toggle */}
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setBulkSummaryMode(false)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${!bulkSummaryMode
                                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                }`}>
                            Line items
                        </button>
                        <button type="button" onClick={() => setBulkSummaryMode(true)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${bulkSummaryMode
                                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                }`}>
                            Summary only
                        </button>
                        <span className="text-xs text-gray-400">
                            {bulkSummaryMode ? 'Enter a total — no per-item breakdown' : 'List each item with qty & price'}
                        </span>
                    </div>

                    {!bulkSummaryMode ? (
                        /* ── Line items ─── */
                        <div className="space-y-2">
                            <div className="grid grid-cols-[1fr_56px_96px_28px] gap-1.5 text-xs text-gray-400 px-1">
                                <span>Description</span>
                                <span className="text-center">Qty</span>
                                <span className="text-right">Unit Price (₹)</span>
                                <span />
                            </div>

                            {lineItems.map((item, idx) => (
                                <div key={item.key}
                                    className="grid grid-cols-[1fr_56px_96px_28px] gap-1.5 items-center">
                                    <input
                                        type="text"
                                        value={item.description}
                                        onChange={e => updateLineItem(item.key, 'description', e.target.value)}
                                        placeholder={`Item ${idx + 1}`}
                                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" />
                                    <input
                                        type="number" min={1} value={item.quantity}
                                        onChange={e => updateLineItem(item.key, 'quantity', Number(e.target.value))}
                                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-amber-400 focus:outline-none" />
                                    <input
                                        type="number" min={0.01} step={0.01} value={item.unitPrice}
                                        onChange={e => updateLineItem(item.key, 'unitPrice', e.target.value)}
                                        placeholder="0.00"
                                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-right focus:ring-2 focus:ring-amber-400 focus:outline-none" />
                                    <button type="button" onClick={() => removeLineItem(item.key)}
                                        disabled={lineItems.length === 1}
                                        className="text-gray-400 hover:text-red-500 disabled:opacity-30 text-base leading-none text-center">
                                        ✕
                                    </button>
                                </div>
                            ))}

                            <button type="button" onClick={addLineItem}
                                className="text-sm text-amber-600 hover:text-amber-700 font-medium px-1">
                                + Add item
                            </button>

                            {lineItemsTotal > 0 && (
                                <div className="bg-amber-50 rounded-lg px-4 py-3 flex justify-between items-center">
                                    <span className="text-sm text-amber-700">Deal Total</span>
                                    <span className="text-lg font-semibold text-amber-900">{formatPrice(lineItemsTotal)}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ── Summary mode ─── */
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Items Sold (description) *
                                </label>
                                <textarea value={bulkDescription}
                                    onChange={e => setBulkDescription(e.target.value)}
                                    rows={3} required
                                    placeholder="e.g. 10 bangle sets, 20 jhumka pairs, 5 choker necklaces"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none resize-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (₹) *</label>
                                <input type="number" value={bulkTotal}
                                    onChange={e => setBulkTotal(e.target.value)}
                                    min={0.01} step={0.01} required placeholder="Overall deal amount"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" />
                            </div>
                            {bulkTotalNum > 0 && (
                                <div className="bg-amber-50 rounded-lg px-4 py-3 flex justify-between items-center">
                                    <span className="text-sm text-amber-700">Deal Total</span>
                                    <span className="text-lg font-semibold text-amber-900">{formatPrice(bulkTotalNum)}</span>
                                </div>
                            )}
                        </>
                    )}

                    {/* Buyer info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Buyer Name <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <input type="text" value={buyerName} onChange={e => setBuyerName(e.target.value)}
                                placeholder="Optional"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Buyer Phone <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <input type="tel" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)}
                                placeholder="Optional"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Additional Notes <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none resize-none" />
                    </div>
                </>
            )}

            <div className="flex gap-3 pt-1">
                <button type="button" onClick={onCancel}
                    className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                    className={`flex-1 py-2.5 text-white rounded-lg text-sm font-medium disabled:opacity-60 transition-colors ${saleType === SaleType.Retail
                            ? 'bg-indigo-600 hover:bg-indigo-700'
                            : 'bg-amber-600 hover:bg-amber-700'
                        }`}>
                    {isSubmitting ? 'Saving…' : 'Record Sale'}
                </button>
            </div>
        </form>
    );
}

// ─── Main Sales Screen ────────────────────────────────────────────────────────

export default function SalesScreen() {
    const [products, setProducts] = useState<Product[]>([]);   // all in-stock for dropdown
    const [sales, setSales] = useState<SaleDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const showToast = (type: 'success' | 'error', text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 5000);
    };

    const load = useCallback(async () => {
        setLoading(true);
        const [prodRes, salesRes] = await Promise.all([
            productApi.getProducts({ inStockOnly: true, pageSize: 200 }),
            productApi.getSales(),
        ]);
        if (prodRes.success && prodRes.data) setProducts(prodRes.data);
        if (salesRes.success && salesRes.data) setSales(salesRes.data);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    // Prepend new sale client-side; also remove product from dropdown if stock hits 0
    const handleSaved = (sale: SaleDto) => {
        setSales(prev => [sale, ...prev]);
        if (sale.productId) {
            setProducts(prev => {
                const updated = prev.map(p => {
                    if (p.id !== sale.productId) return p;
                    const newStock = Math.max(0, p.stockQuantity - sale.quantitySold);
                    return { ...p, stockQuantity: newStock, isInStock: newStock > 0 };
                }).filter(p => p.isInStock);   // drop from dropdown if sold out
                return updated;
            });
        }
        setShowForm(false);
        showToast('success',
            `Sale #${sale.id} recorded — ${sale.productName} → ${formatPrice(sale.totalAmount)}`
        );
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this sale? Stock will be restored for catalog items.')) return;
        const res = await productApi.deleteSale(id);
        if (res.success) {
            setSales(prev => prev.filter(s => s.id !== id));
            showToast('success', 'Sale deleted.');
            // Refresh products so stock reflects restored qty
            const prodRes = await productApi.getProducts({ inStockOnly: false, pageSize: 200 });
            if (prodRes.success && prodRes.data) setProducts(prodRes.data.filter(p => p.isInStock));
        } else {
            showToast('error', 'Failed to delete sale.');
        }
    };

    return (
        <div className="space-y-4">
            {/* Toast */}
            {toast && (
                <div className={`rounded-lg px-4 py-3 text-sm flex items-start gap-3 ${toast.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                    <span className="flex-1">{toast.text}</span>
                    <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100">✕</button>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Sales</h2>
                    <p className="text-sm text-gray-500">Record retail or bulk sales — catalog or custom items.</p>
                </div>
                {!showForm && (
                    <button onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                        + Record Sale
                    </button>
                )}
            </div>

            {/* Inline form panel */}
            {showForm && (
                <SaleFormPanel
                    products={products}
                    onSaved={handleSaved}
                    onCancel={() => setShowForm(false)}
                />
            )}

            {/* Sales list */}
            {loading ? (
                <div className="text-center py-16 text-gray-400 text-sm">Loading sales…</div>
            ) : sales.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-sm">
                    No sales recorded yet. Click <strong>+ Record Sale</strong> to get started.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                            <tr>
                                <th className="px-4 py-3 text-left">Date</th>
                                <th className="px-4 py-3 text-left">Product / Deal</th>
                                <th className="px-4 py-3 text-center">Type</th>
                                <th className="px-4 py-3 text-center">Qty</th>
                                <th className="px-4 py-3 text-right">Price</th>
                                <th className="px-4 py-3 text-right">Total</th>
                                <th className="px-4 py-3 text-left">Channel / Buyer</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {sales.map(s => (
                                <tr key={s.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                                        {formatDate(s.saleDate)}
                                    </td>
                                    <td className="px-4 py-3 text-gray-800 max-w-[200px]">
                                        <span className="font-medium">
                                            {s.saleType === 'BulkSale' && s.items.length > 0
                                                ? `Bulk Sale · ${s.items.length} item${s.items.length !== 1 ? 's' : ''}`
                                                : s.productName}
                                        </span>
                                        {s.saleType === 'BulkSale' && s.items.length > 0
                                            ? <p className="text-xs text-gray-400 truncate mt-0.5" title={s.items.map(i => i.description).join(', ')}>
                                                {s.items.map(i => i.description).join(', ')}
                                            </p>
                                            : s.notes && (
                                                <p className="text-xs text-gray-400 truncate mt-0.5" title={s.notes}>
                                                    {s.notes}
                                                </p>
                                            )
                                        }
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${s.saleType === 'BulkSale'
                                                ? 'bg-amber-50 text-amber-700'
                                                : 'bg-indigo-50 text-indigo-700'
                                            }`}>
                                            {s.saleType === 'BulkSale' ? 'Bulk Sale' : s.saleType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-gray-700">{s.quantitySold}</td>
                                    <td className="px-4 py-3 text-right text-gray-600">
                                        {s.saleType === 'BulkSale' && s.items.length > 0 ? '—' : formatPrice(s.sellingPrice)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                        {formatPrice(s.totalAmount)}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                        {s.saleType === 'BulkSale'
                                            ? (s.buyerName || s.buyerPhone || '—')
                                            : (s.saleChannel || s.customerName || '—')
                                        }
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => handleDelete(s.id)}
                                            className="text-red-400 hover:text-red-600 text-xs font-medium">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
