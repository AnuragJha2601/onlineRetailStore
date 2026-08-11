'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    AdminProduct,
    InvoiceDto,
    SaveInvoiceRequest,
    InvoiceItemRequest,
    INVOICE_PDF_COLUMNS,
} from '@/types/product';
import { productApi, formatPrice, formatDate } from '@/services/productApi';

function todayISO() {
    return new Date().toISOString().split('T')[0];
}

function ceilPrice(cost: number, margin: number): number {
    if (cost <= 0) return 0;
    return Math.ceil(cost * (1 + margin / 100));
}

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

// ─── Line item row (frontend state) ─────────────────────────────────────────
interface LineRow {
    key: number;
    itemName: string;
    productId?: number;
    cost: string;
    margin: string;
    price: string;
    quantity: number;
}

function newRow(margin = ''): LineRow {
    return { key: Date.now() + Math.random(), itemName: '', cost: '', margin, price: '', quantity: 1 };
}

function rowsFromInvoice(inv: InvoiceDto): LineRow[] {
    return inv.items.map((it) => {
        const margin = it.marginPercent ?? (it.costPrice > 0 ? round2(((it.unitPrice - it.costPrice) / it.costPrice) * 100) : 0);
        return {
            key: Date.now() + Math.random(),
            itemName: it.itemName,
            productId: it.productId,
            cost: String(it.costPrice),
            margin: String(margin),
            price: String(it.unitPrice),
            quantity: it.quantity,
        };
    });
}

// ─── Bill Editor ─────────────────────────────────────────────────────────────

interface BillEditorProps {
    editing: InvoiceDto | null;
    products: AdminProduct[];
    onSaved: () => void;
    onCancel: () => void;
    onToast: (type: 'success' | 'error', text: string) => void;
}

function BillEditor({ editing, products, onSaved, onCancel, onToast }: BillEditorProps) {
    const [customerName, setCustomerName] = useState(editing?.customerName ?? '');
    const [customerPhone, setCustomerPhone] = useState(editing?.customerPhone ?? '');
    const [invoiceDate, setInvoiceDate] = useState(editing?.invoiceDate?.split('T')[0] ?? todayISO());
    const [shipping, setShipping] = useState(editing ? String(editing.shipping) : '');
    const [notes, setNotes] = useState(editing?.notes ?? '');
    const [defaultMargin, setDefaultMargin] = useState('');
    const [rows, setRows] = useState<LineRow[]>(editing ? rowsFromInvoice(editing) : [newRow()]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const lastMargin = () => {
        const withMargin = [...rows].reverse().find((r) => r.margin !== '');
        return withMargin?.margin ?? defaultMargin ?? '';
    };

    const addRow = () => setRows((prev) => [...prev, newRow(defaultMargin || lastMargin())]);
    const removeRow = (key: number) => setRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.key !== key)));

    const applyMarginToAll = () => {
        const m = parseFloat(defaultMargin);
        if (isNaN(m)) return;
        setRows((prev) => prev.map((r) => {
            const cost = parseFloat(r.cost) || 0;
            return { ...r, margin: String(m), price: cost > 0 ? String(ceilPrice(cost, m)) : r.price };
        }));
    };

    const updateRow = (key: number, patch: Partial<LineRow>) =>
        setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

    const onCostChange = (key: number, value: string) => {
        const cost = parseFloat(value) || 0;
        setRows((prev) => prev.map((r) => {
            if (r.key !== key) return r;
            const margin = parseFloat(r.margin);
            const price = !isNaN(margin) && cost > 0 ? String(ceilPrice(cost, margin)) : r.price;
            return { ...r, cost: value, price };
        }));
    };

    const onMarginChange = (key: number, value: string) => {
        const margin = parseFloat(value);
        setRows((prev) => prev.map((r) => {
            if (r.key !== key) return r;
            const cost = parseFloat(r.cost) || 0;
            const price = !isNaN(margin) && cost > 0 ? String(ceilPrice(cost, margin)) : r.price;
            return { ...r, margin: value, price };
        }));
    };

    const onPriceChange = (key: number, value: string) => {
        const price = parseFloat(value) || 0;
        setRows((prev) => prev.map((r) => {
            if (r.key !== key) return r;
            const cost = parseFloat(r.cost) || 0;
            const margin = cost > 0 ? String(round2(((price - cost) / cost) * 100)) : r.margin;
            return { ...r, price: value, margin };
        }));
    };

    const onNameChange = (key: number, value: string) => {
        const match = products.find((p) => p.name.toLowerCase() === value.trim().toLowerCase());
        updateRow(key, { itemName: value, productId: match?.id });
    };

    // ── Live totals ──
    const subtotal = rows.reduce((s, r) => s + (parseFloat(r.price) || 0) * r.quantity, 0);
    const totalCost = rows.reduce((s, r) => s + (parseFloat(r.cost) || 0) * r.quantity, 0);
    const shippingNum = parseFloat(shipping) || 0;
    const grandTotal = subtotal + shippingNum;
    const totalProfit = subtotal - totalCost;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!customerName.trim()) { setError('Customer name is required.'); return; }
        if (rows.some((r) => !r.itemName.trim())) { setError('Every item needs a name.'); return; }
        if (rows.some((r) => r.quantity < 1)) { setError('Every quantity must be at least 1.'); return; }
        if (rows.some((r) => (parseFloat(r.price) || 0) <= 0)) { setError('Every item needs a price greater than zero.'); return; }

        const items: InvoiceItemRequest[] = rows.map((r) => ({
            itemName: r.itemName.trim(),
            productId: r.productId,
            costPrice: parseFloat(r.cost) || 0,
            marginPercent: r.margin === '' ? undefined : parseFloat(r.margin),
            unitPrice: parseFloat(r.price) || 0,
            quantity: r.quantity,
        }));

        const req: SaveInvoiceRequest = {
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim() || undefined,
            invoiceDate: new Date(invoiceDate + 'T00:00:00').toISOString(),
            shipping: shippingNum,
            notes: notes.trim() || undefined,
            items,
        };

        setIsSubmitting(true);
        const res = editing
            ? await productApi.updateInvoice(editing.id, req)
            : await productApi.createInvoice(req);
        setIsSubmitting(false);

        if (res.success) {
            onToast('success', res.message || 'Bill saved.');
            onSaved();
        } else {
            setError(res.message || 'Failed to save bill.');
        }
    };

    const inputCls = 'w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-purple-400 focus:outline-none';

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                    {editing ? `Edit Bill ${editing.invoiceNumber}` : 'New Bill'}
                </h3>
            </div>

            {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}

            {/* ── Header ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                    <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                        className={inputCls} placeholder="Customer name" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                        className={inputCls} placeholder="Optional" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)}
                        className={inputCls} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Default Margin % <span className="text-gray-400 font-normal">(applies to new items)</span>
                    </label>
                    <div className="flex gap-2">
                        <input type="number" inputMode="decimal" value={defaultMargin}
                            onChange={(e) => setDefaultMargin(e.target.value)} className={inputCls} placeholder="e.g. 18" />
                        <button type="button" onClick={applyMarginToAll}
                            className="whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-lg border border-purple-300 text-purple-700 hover:bg-purple-50">
                            Apply to all
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Line items ── */}
            <div className="space-y-2">
                <datalist id="billing-products">
                    {products.map((p) => <option key={p.id} value={p.name} />)}
                </datalist>

                {/* desktop column headers */}
                <div className="hidden sm:grid sm:grid-cols-[1fr_84px_78px_90px_60px_96px_32px] gap-2 text-xs text-gray-400 px-1">
                    <span>Item</span>
                    <span className="text-right">Cost ₹</span>
                    <span className="text-right">Margin %</span>
                    <span className="text-right">Price ₹</span>
                    <span className="text-center">Qty</span>
                    <span className="text-right">Total</span>
                    <span />
                </div>

                {rows.map((r, idx) => {
                    const lineTotal = (parseFloat(r.price) || 0) * r.quantity;
                    return (
                        <div key={r.key}
                            className="border border-gray-200 rounded-lg p-3 space-y-2 sm:space-y-0 sm:border-0 sm:rounded-none sm:p-0 sm:grid sm:grid-cols-[1fr_84px_78px_90px_60px_96px_32px] sm:gap-2 sm:items-center">
                            <div className="flex items-center justify-between gap-2 sm:block">
                                <span className="text-xs text-gray-500 sm:hidden">Item</span>
                                <input type="text" list="billing-products" value={r.itemName}
                                    onChange={(e) => onNameChange(r.key, e.target.value)}
                                    placeholder={`Item ${idx + 1}`} className={inputCls + ' max-w-[62%] sm:max-w-none'} />
                            </div>
                            <div className="flex items-center justify-between gap-2 sm:block">
                                <span className="text-xs text-gray-500 sm:hidden">Cost ₹</span>
                                <input type="number" inputMode="decimal" value={r.cost}
                                    onChange={(e) => onCostChange(r.key, e.target.value)}
                                    placeholder="0" className={inputCls + ' sm:text-right max-w-[52%] sm:max-w-none'} />
                            </div>
                            <div className="flex items-center justify-between gap-2 sm:block">
                                <span className="text-xs text-gray-500 sm:hidden">Margin %</span>
                                <input type="number" inputMode="decimal" value={r.margin}
                                    onChange={(e) => onMarginChange(r.key, e.target.value)}
                                    placeholder="%" className={inputCls + ' sm:text-right max-w-[52%] sm:max-w-none'} />
                            </div>
                            <div className="flex items-center justify-between gap-2 sm:block">
                                <span className="text-xs text-gray-500 sm:hidden">Price ₹</span>
                                <input type="number" inputMode="decimal" value={r.price}
                                    onChange={(e) => onPriceChange(r.key, e.target.value)}
                                    placeholder="0" className={inputCls + ' sm:text-right max-w-[52%] sm:max-w-none font-medium'} />
                            </div>
                            <div className="flex items-center justify-between gap-2 sm:block">
                                <span className="text-xs text-gray-500 sm:hidden">Qty</span>
                                <input type="number" inputMode="numeric" min={1} value={r.quantity}
                                    onChange={(e) => updateRow(r.key, { quantity: Math.max(1, Number(e.target.value)) })}
                                    className={inputCls + ' sm:text-center max-w-[40%] sm:max-w-none'} />
                            </div>
                            <div className="flex items-center justify-between gap-2 sm:block">
                                <span className="text-xs text-gray-500 sm:hidden">Line total</span>
                                <span className="text-sm font-semibold text-gray-800 sm:text-right sm:block">{formatPrice(lineTotal)}</span>
                            </div>
                            <div className="flex justify-end sm:block">
                                <button type="button" onClick={() => removeRow(r.key)} disabled={rows.length === 1}
                                    className="text-gray-400 hover:text-red-500 disabled:opacity-30 text-base leading-none">✕</button>
                            </div>
                        </div>
                    );
                })}

                <button type="button" onClick={addRow}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium px-1">+ Add item</button>
            </div>

            {/* ── Totals ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* internal panel */}
                <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 order-2 sm:order-1">
                    <p className="text-[11px] font-medium text-rose-600 mb-1">Internal — not on customer bill</p>
                    <div className="flex justify-between text-sm text-rose-800"><span>Total Cost</span><span>{formatPrice(totalCost)}</span></div>
                    <div className="flex justify-between text-sm font-semibold text-rose-900"><span>Total Profit</span><span>{formatPrice(totalProfit)}</span></div>
                </div>

                {/* customer totals */}
                <div className="bg-purple-50 rounded-lg p-3 order-1 sm:order-2 space-y-1">
                    <div className="flex justify-between text-sm text-gray-700"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                    <div className="flex justify-between items-center text-sm text-gray-700">
                        <span>Shipping</span>
                        <input type="number" inputMode="decimal" value={shipping} onChange={(e) => setShipping(e.target.value)}
                            placeholder="0" className="w-24 border border-gray-300 rounded-lg px-2 py-1 text-sm text-right focus:ring-2 focus:ring-purple-400 focus:outline-none" />
                    </div>
                    <div className="flex justify-between text-base font-bold text-purple-900 pt-1 border-t border-purple-200">
                        <span>Grand Total</span><span>{formatPrice(grandTotal)}</span>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:outline-none resize-none" />
            </div>

            <div className="flex gap-3">
                <button type="button" onClick={onCancel}
                    className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
                    {isSubmitting ? 'Saving…' : editing ? 'Update Bill' : 'Save Bill'}
                </button>
            </div>
        </form>
    );
}

// ─── PDF column picker ───────────────────────────────────────────────────────

interface ColumnPickerProps {
    invoice: InvoiceDto;
    onClose: () => void;
    onToast: (type: 'success' | 'error', text: string) => void;
}

function ColumnPicker({ invoice, onClose, onToast }: ColumnPickerProps) {
    const [selected, setSelected] = useState<string[]>(
        INVOICE_PDF_COLUMNS.filter((c) => !c.internal).map((c) => c.key)
    );
    const [downloading, setDownloading] = useState(false);

    const toggle = (key: string) => {
        if (key === 'item') return; // always included
        setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    };

    const hasInternal = selected.some((k) => INVOICE_PDF_COLUMNS.find((c) => c.key === k)?.internal);

    const handleDownload = async () => {
        setDownloading(true);
        const ordered = INVOICE_PDF_COLUMNS.filter((c) => selected.includes(c.key)).map((c) => c.key);
        const blob = await productApi.downloadInvoicePdf(invoice.id, ordered);
        setDownloading(false);
        if (!blob) { onToast('error', 'Failed to generate PDF.'); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${invoice.invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        onToast('success', 'PDF downloaded.');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Export {invoice.invoiceNumber}</h3>
                <p className="text-xs text-gray-500 mb-3">Choose columns for the PDF.</p>
                <div className="space-y-2 mb-4">
                    {INVOICE_PDF_COLUMNS.map((c) => (
                        <label key={c.key} className={`flex items-center gap-2 text-sm ${c.key === 'item' ? 'opacity-60' : ''}`}>
                            <input type="checkbox" checked={selected.includes(c.key)} disabled={c.key === 'item'}
                                onChange={() => toggle(c.key)} className="rounded" />
                            <span>{c.label}</span>
                            {c.internal && <span className="text-[10px] font-medium text-rose-600 uppercase">internal — don&apos;t share</span>}
                        </label>
                    ))}
                </div>
                {hasInternal && (
                    <p className="text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2 mb-3">
                        This PDF will include cost/profit. Don&apos;t send it to the customer.
                    </p>
                )}
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button onClick={handleDownload} disabled={downloading}
                        className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
                        {downloading ? 'Generating…' : 'Download PDF'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Billing Screen ─────────────────────────────────────────────────────

export default function BillingScreen() {
    const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'edit'>('list');
    const [editing, setEditing] = useState<InvoiceDto | null>(null);
    const [search, setSearch] = useState('');
    const [showDeleted, setShowDeleted] = useState(false);
    const [pdfFor, setPdfFor] = useState<InvoiceDto | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const showToast = (type: 'success' | 'error', text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 3000);
    };

    const loadInvoices = useCallback(async () => {
        setLoading(true);
        const res = await productApi.getInvoices({ search: search.trim() || undefined, includeDeleted: showDeleted });
        if (res.success && res.data) setInvoices(res.data);
        setLoading(false);
    }, [search, showDeleted]);

    useEffect(() => { loadInvoices(); }, [loadInvoices]);

    useEffect(() => {
        productApi.getAdminProducts({ pageSize: 500 }).then((res) => {
            if (res.success && res.data) setProducts(res.data);
        });
    }, []);

    const handleNew = () => { setEditing(null); setView('edit'); };
    const handleEdit = (inv: InvoiceDto) => { setEditing(inv); setView('edit'); };
    const handleSaved = () => { setView('list'); setEditing(null); loadInvoices(); };

    const handleDelete = async (inv: InvoiceDto) => {
        if (!confirm(`Delete bill ${inv.invoiceNumber}? It stays recoverable via "Show deleted".`)) return;
        const res = await productApi.deleteInvoice(inv.id);
        if (res.success) { showToast('success', res.message || 'Deleted.'); loadInvoices(); }
        else showToast('error', res.message || 'Failed to delete.');
    };

    const handleRestore = async (inv: InvoiceDto) => {
        const res = await productApi.restoreInvoice(inv.id);
        if (res.success) { showToast('success', res.message || 'Restored.'); loadInvoices(); }
        else showToast('error', res.message || 'Failed to restore.');
    };

    if (view === 'edit') {
        return (
            <>
                {toast && <Toast toast={toast} />}
                <BillEditor editing={editing} products={products}
                    onSaved={handleSaved} onCancel={() => { setView('list'); setEditing(null); }} onToast={showToast} />
            </>
        );
    }

    return (
        <div className="space-y-4">
            {toast && <Toast toast={toast} />}

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search bill no. or customer…"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:outline-none" />
                <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} className="rounded" />
                    Show deleted
                </label>
                <button onClick={handleNew}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap">
                    + New Bill
                </button>
            </div>

            {loading ? (
                <p className="text-sm text-gray-500">Loading bills…</p>
            ) : invoices.length === 0 ? (
                <p className="text-sm text-gray-500">No bills yet. Click “New Bill” to create one.</p>
            ) : (
                <>
                    {/* Desktop table */}
                    <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">Bill No.</th>
                                    <th className="px-4 py-3 text-left">Date</th>
                                    <th className="px-4 py-3 text-left">Customer</th>
                                    <th className="px-4 py-3 text-center">Items</th>
                                    <th className="px-4 py-3 text-right">Grand Total</th>
                                    <th className="px-4 py-3 text-right">Profit</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {invoices.map((inv) => (
                                    <tr key={inv.id} className={inv.isDeleted ? 'bg-gray-50 text-gray-400' : ''}>
                                        <td className="px-4 py-3 font-medium">
                                            {inv.invoiceNumber}
                                            {inv.isDeleted && <span className="ml-2 text-[10px] uppercase bg-gray-200 text-gray-500 rounded px-1.5 py-0.5">Deleted</span>}
                                        </td>
                                        <td className="px-4 py-3">{formatDate(inv.invoiceDate)}</td>
                                        <td className="px-4 py-3">{inv.customerName}</td>
                                        <td className="px-4 py-3 text-center">{inv.items.length}</td>
                                        <td className="px-4 py-3 text-right font-medium">{formatPrice(inv.grandTotal)}</td>
                                        <td className="px-4 py-3 text-right text-green-700">{formatPrice(inv.totalProfit)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2 text-xs">
                                                {inv.isDeleted ? (
                                                    <button onClick={() => handleRestore(inv)} className="text-green-600 hover:underline">Restore</button>
                                                ) : (
                                                    <>
                                                        <button onClick={() => handleEdit(inv)} className="text-indigo-600 hover:underline">Edit</button>
                                                        <button onClick={() => setPdfFor(inv)} className="text-purple-600 hover:underline">PDF</button>
                                                        <button onClick={() => handleDelete(inv)} className="text-red-500 hover:underline">Delete</button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="sm:hidden space-y-3">
                        {invoices.map((inv) => (
                            <div key={inv.id} className={`bg-white rounded-xl shadow-sm border p-4 ${inv.isDeleted ? 'border-gray-200 opacity-70' : 'border-gray-100'}`}>
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-gray-800">{inv.invoiceNumber}</span>
                                    {inv.isDeleted
                                        ? <span className="text-[10px] uppercase bg-gray-200 text-gray-500 rounded px-1.5 py-0.5">Deleted</span>
                                        : <span className="text-sm font-bold text-purple-900">{formatPrice(inv.grandTotal)}</span>}
                                </div>
                                <div className="mt-1 text-sm text-gray-600">{inv.customerName}</div>
                                <div className="text-xs text-gray-400">{formatDate(inv.invoiceDate)} · {inv.items.length} item{inv.items.length !== 1 ? 's' : ''} · Profit {formatPrice(inv.totalProfit)}</div>
                                <div className="mt-3 flex gap-2">
                                    {inv.isDeleted ? (
                                        <button onClick={() => handleRestore(inv)} className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-green-300 text-green-700">Restore</button>
                                    ) : (
                                        <>
                                            <button onClick={() => handleEdit(inv)} className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-indigo-300 text-indigo-700">Edit</button>
                                            <button onClick={() => setPdfFor(inv)} className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-purple-300 text-purple-700">PDF</button>
                                            <button onClick={() => handleDelete(inv)} className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-red-300 text-red-600">Delete</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {pdfFor && <ColumnPicker invoice={pdfFor} onClose={() => setPdfFor(null)} onToast={showToast} />}
        </div>
    );
}

function Toast({ toast }: { toast: { type: 'success' | 'error'; text: string } }) {
    return (
        <div className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-2 text-sm text-white shadow-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {toast.text}
        </div>
    );
}
