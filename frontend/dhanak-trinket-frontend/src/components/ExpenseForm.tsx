'use client';

import { useState, useCallback } from 'react';
import { productApi } from '@/services/productApi';
import {
    ExpenseCategory,
    EXPENSE_CATEGORY_LABELS,
    ExpenseDto,
    CreateExpenseRequest,
} from '@/types/product';
import { formatPrice, formatDate } from '@/services/productApi';

// ─── helpers ────────────────────────────────────────────────────────────────

function todayISO(): string {
    return new Date().toISOString().split('T')[0];
}

function categoryLabel(raw: string): string {
    const match = Object.entries(EXPENSE_CATEGORY_LABELS).find(
        ([k]) => ExpenseCategory[Number(k) as ExpenseCategory] === raw || EXPENSE_CATEGORY_LABELS[Number(k) as ExpenseCategory] === raw
    );
    return match ? match[1] : raw;
}

// ─── component ──────────────────────────────────────────────────────────────

interface ExpenseFormProps {
    onExpenseAdded?: () => void;
}

export default function ExpenseForm({ onExpenseAdded }: ExpenseFormProps) {
    // form state
    const [expenseDate, setExpenseDate] = useState(todayISO());
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.InventoryPurchase);
    const [vendorName, setVendorName] = useState('');
    const [notes, setNotes] = useState('');
    const [billFile, setBillFile] = useState<File | null>(null);

    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successExpense, setSuccessExpense] = useState<ExpenseDto | null>(null);

    // expenses list
    const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
    const [listLoaded, setListLoaded] = useState(false);
    const [loadingList, setLoadingList] = useState(false);

    const loadExpenses = useCallback(async () => {
        setLoadingList(true);
        const res = await productApi.getExpenses();
        if (res.success && res.data) setExpenses(res.data.slice(0, 15));
        setLoadingList(false);
        setListLoaded(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const amountNum = parseFloat(amount);
        if (!description.trim()) { setError('Description is required.'); return; }
        if (isNaN(amountNum) || amountNum <= 0) { setError('Enter a valid amount greater than 0.'); return; }

        setIsSubmitting(true);
        try {
            const req: CreateExpenseRequest = {
                expenseDate,
                description: description.trim(),
                amount: amountNum,
                category,
                vendorName: vendorName.trim() || undefined,
                notes: notes.trim() || undefined,
            };

            const res = await productApi.createExpense(req);
            if (!res.success || !res.data) {
                setError(res.message || 'Failed to record expense.');
                return;
            }

            let expense = res.data;

            // Upload bill image if provided
            if (billFile) {
                const uploadRes = await productApi.uploadExpenseBill(expense.id, billFile);
                if (uploadRes.success && uploadRes.data) expense = uploadRes.data;
                // If upload fails, still show success — bill upload is optional
            }

            setSuccessExpense(expense);
            // Reset form
            setDescription('');
            setAmount('');
            setVendorName('');
            setNotes('');
            setBillFile(null);
            setExpenseDate(todayISO());
            setCategory(ExpenseCategory.InventoryPurchase);

            // Refresh list
            const listRes = await productApi.getExpenses();
            if (listRes.success && listRes.data) setExpenses(listRes.data.slice(0, 15));
            setListLoaded(true);

            onExpenseAdded?.();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this expense record?')) return;
        const res = await productApi.deleteExpense(id);
        if (res.success) setExpenses(prev => prev.filter(e => e.id !== id));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) { setBillFile(null); return; }
        if (f.size > 10 * 1024 * 1024) { setError('File must be under 10 MB.'); return; }
        setBillFile(f);
    };

    return (
        <div className="space-y-8">
            {/* ─── Form ────────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
                <h3 className="text-lg font-semibold text-gray-800">Record Expense</h3>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
                )}

                {successExpense && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 space-y-1">
                        <p className="font-semibold">Expense recorded ✓</p>
                        <p>{successExpense.description} — {formatPrice(successExpense.amount)}</p>
                        {successExpense.billImageUrl && (
                            <a href={successExpense.billImageUrl} target="_blank" rel="noopener noreferrer"
                                className="underline text-green-700">View uploaded bill</a>
                        )}
                        <button type="button" onClick={() => setSuccessExpense(null)}
                            className="block text-xs text-green-600 underline mt-1">Dismiss</button>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                        <input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent" />
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                            min="0.01" step="0.01" placeholder="e.g. 1500" required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent" />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                        <select value={category} onChange={e => setCategory(Number(e.target.value) as ExpenseCategory)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white">
                            {Object.entries(EXPENSE_CATEGORY_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Vendor */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vendor / Market <span className="text-gray-400 font-normal">(optional)</span></label>
                        <input type="text" value={vendorName} onChange={e => setVendorName(e.target.value)}
                            placeholder="e.g. Sadar Bazar, Delhi"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent" />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                        placeholder="e.g. 50 glass bangles sets, 20 jhumka pairs"
                        required maxLength={1000}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent" />
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                        placeholder="Any additional details..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none" />
                </div>

                {/* Bill image upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bill / Receipt <span className="text-gray-400 font-normal">(optional — JPG, PNG, WebP, PDF, max 10 MB)</span>
                    </label>
                    <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-600
                            file:mr-3 file:py-1.5 file:px-4
                            file:rounded-lg file:border-0
                            file:text-sm file:font-medium
                            file:bg-orange-50 file:text-orange-700
                            hover:file:bg-orange-100 cursor-pointer" />
                    {billFile && (
                        <p className="mt-1 text-xs text-gray-500">Selected: {billFile.name} ({(billFile.size / 1024).toFixed(0)} KB)</p>
                    )}
                </div>

                <button type="submit" disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm">
                    {isSubmitting ? 'Saving…' : 'Record Expense'}
                </button>
            </form>

            {/* ─── Expenses list ───────────────────────────────────── */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-gray-800">Recent Expenses</h3>
                    <button onClick={loadExpenses} disabled={loadingList}
                        className="text-sm text-orange-600 hover:underline disabled:opacity-50">
                        {loadingList ? 'Loading…' : listLoaded ? 'Refresh' : 'Load expenses'}
                    </button>
                </div>

                {listLoaded && expenses.length === 0 && (
                    <p className="text-sm text-gray-500">No expenses recorded yet.</p>
                )}

                {expenses.length > 0 && (
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                                <tr>
                                    <th className="px-4 py-3 text-left">Date</th>
                                    <th className="px-4 py-3 text-left">Description</th>
                                    <th className="px-4 py-3 text-left">Category</th>
                                    <th className="px-4 py-3 text-left">Vendor</th>
                                    <th className="px-4 py-3 text-right">Amount</th>
                                    <th className="px-4 py-3 text-center">Bill</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {expenses.map(exp => (
                                    <tr key={exp.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                                            {formatDate(exp.expenseDate)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-800 max-w-xs truncate" title={exp.description}>
                                            {exp.description}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="inline-block px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs font-medium">
                                                {categoryLabel(exp.category)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{exp.vendorName || '—'}</td>
                                        <td className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                                            {formatPrice(exp.amount)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {exp.billImageUrl ? (
                                                <a href={exp.billImageUrl} target="_blank" rel="noopener noreferrer"
                                                    className="text-orange-600 hover:underline text-xs">View</a>
                                            ) : <span className="text-gray-400 text-xs">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => handleDelete(exp.id)}
                                                className="text-red-400 hover:text-red-600 text-xs">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
