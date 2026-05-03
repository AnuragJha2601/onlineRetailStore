'use client';

import { useState, useEffect, useCallback } from 'react';
import { productApi } from '@/services/productApi';
import {
    ExpenseCategory,
    EXPENSE_CATEGORY_LABELS,
    ExpenseDto,
    CreateExpenseRequest,
} from '@/types/product';
import { formatPrice, formatDate } from '@/services/productApi';

// ─── helpers ─────────────────────────────────────────────────────────────────

function todayISO() {
    return new Date().toISOString().split('T')[0];
}

function labelForCategory(raw: string): string {
    const entry = Object.entries(EXPENSE_CATEGORY_LABELS).find(
        ([k]) => ExpenseCategory[Number(k) as ExpenseCategory] === raw
    );
    return entry ? entry[1] : raw;
}

const BLANK_FORM = {
    expenseDate: todayISO(),
    description: '',
    amount: '',
    category: ExpenseCategory.InventoryPurchase,
    vendorName: '',
    notes: '',
};

// ─── Add / Edit form panel ────────────────────────────────────────────────────

interface ExpenseFormPanelProps {
    editing: ExpenseDto | null;   // null = new
    onSaved: (expense: ExpenseDto, isNew: boolean) => void;
    onCancel: () => void;
}

function ExpenseFormPanel({ editing, onSaved, onCancel }: ExpenseFormPanelProps) {
    const [expenseDate, setExpenseDate] = useState(editing?.expenseDate?.split('T')[0] ?? todayISO());
    const [description, setDescription] = useState(editing?.description ?? '');
    const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
    const [category, setCategory] = useState<ExpenseCategory>(
        editing
            ? (Object.entries(EXPENSE_CATEGORY_LABELS).find(([, v]) => v === editing.category)?.[0]
                ? Number(Object.entries(EXPENSE_CATEGORY_LABELS).find(([, v]) => v === editing.category)![0])
                : ExpenseCategory.InventoryPurchase)
            : ExpenseCategory.InventoryPurchase
    );
    const [vendorName, setVendorName] = useState(editing?.vendorName ?? '');
    const [notes, setNotes] = useState(editing?.notes ?? '');
    const [billFile, setBillFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) { setBillFile(null); return; }
        if (f.size > 10 * 1024 * 1024) { setError('File must be under 10 MB.'); return; }
        setBillFile(f);
        setError('');
    };

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

            // Upload bill if provided — best effort
            if (billFile) {
                const upRes = await productApi.uploadExpenseBill(expense.id, billFile);
                if (upRes.success && upRes.data) expense = upRes.data;
            }

            onSaved(expense, true);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">
                    {editing ? 'Edit Expense' : 'Add New Expense'}
                </h3>
                <button type="button" onClick={onCancel}
                    className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                        min="0.01" step="0.01" placeholder="e.g. 1500" required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select value={category} onChange={e => setCategory(Number(e.target.value) as ExpenseCategory)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none bg-white">
                        {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, label]) => (
                            <option key={k} value={k}>{label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vendor / Market <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input type="text" value={vendorName} onChange={e => setVendorName(e.target.value)}
                        placeholder="e.g. Sadar Bazar, Delhi"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none" />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="e.g. 50 glass bangle sets, 20 jhumka pairs"
                    required maxLength={1000}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none" />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                    placeholder="Any additional details…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none resize-none" />
            </div>

            {!editing && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bill / Receipt <span className="text-gray-400 font-normal">(optional — JPG, PNG, WebP, PDF, max 10 MB)</span>
                    </label>
                    <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-600
                            file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0
                            file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700
                            hover:file:bg-orange-100 cursor-pointer" />
                    {billFile && (
                        <p className="mt-1 text-xs text-gray-500">
                            {billFile.name} ({(billFile.size / 1024).toFixed(0)} KB)
                        </p>
                    )}
                </div>
            )}

            <div className="flex gap-3">
                <button type="button" onClick={onCancel}
                    className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-60 transition-colors">
                    {isSubmitting ? 'Saving…' : 'Save Expense'}
                </button>
            </div>
        </form>
    );
}

// ─── Main Expenses Screen ─────────────────────────────────────────────────────

export default function ExpensesScreen() {
    const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState<ExpenseDto | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const showToast = (type: 'success' | 'error', text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 5000);
    };

    const loadExpenses = useCallback(async () => {
        setLoading(true);
        const res = await productApi.getExpenses();
        if (res.success && res.data) setExpenses(res.data);
        setLoading(false);
    }, []);

    useEffect(() => { loadExpenses(); }, [loadExpenses]);

    // After save: prepend to list client-side — no extra network call
    const handleSaved = (expense: ExpenseDto, isNew: boolean) => {
        if (isNew) {
            setExpenses(prev => [expense, ...prev]);
        } else {
            setExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
        }
        setShowForm(false);
        setEditingExpense(null);
        showToast('success', `Expense "${expense.description}" saved.`);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this expense?')) return;
        const res = await productApi.deleteExpense(id);
        if (res.success) {
            setExpenses(prev => prev.filter(e => e.id !== id));
            showToast('success', 'Expense deleted.');
        } else {
            showToast('error', 'Failed to delete expense.');
        }
    };

    const openAdd = () => { setEditingExpense(null); setShowForm(true); };
    const openEdit = (exp: ExpenseDto) => { setEditingExpense(exp); setShowForm(true); };
    const closeForm = () => { setShowForm(false); setEditingExpense(null); };

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
                    <h2 className="text-lg font-semibold text-gray-900">Expenses</h2>
                    <p className="text-sm text-gray-500">Track inventory purchases, packaging, shipping, and more.</p>
                </div>
                {!showForm && (
                    <button onClick={openAdd}
                        className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors">
                        + Add Expense
                    </button>
                )}
            </div>

            {/* Add / Edit form — slides in above the table */}
            {showForm && (
                <ExpenseFormPanel
                    editing={editingExpense}
                    onSaved={handleSaved}
                    onCancel={closeForm}
                />
            )}

            {/* Expenses table */}
            {loading ? (
                <div className="text-center py-16 text-gray-400 text-sm">Loading expenses…</div>
            ) : expenses.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-sm">
                    No expenses yet. Click <strong>+ Add Expense</strong> to get started.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                            <tr>
                                <th className="px-4 py-3 text-left">Date</th>
                                <th className="px-4 py-3 text-left">Description</th>
                                <th className="px-4 py-3 text-left">Category</th>
                                <th className="px-4 py-3 text-left">Vendor</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                                <th className="px-4 py-3 text-center">Bill</th>
                                <th className="px-4 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {expenses.map(exp => (
                                <tr key={exp.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                                        {formatDate(exp.expenseDate)}
                                    </td>
                                    <td className="px-4 py-3 text-gray-800 max-w-xs" title={exp.description}>
                                        <span className="line-clamp-2">{exp.description}</span>
                                        {exp.notes && (
                                            <p className="text-xs text-gray-400 mt-0.5 truncate">{exp.notes}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="inline-block px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs font-medium">
                                            {labelForCategory(exp.category)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                        {exp.vendorName || <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                                        {formatPrice(exp.amount)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {exp.billImageUrl ? (
                                            <a href={exp.billImageUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-800 text-xs font-medium underline underline-offset-2">
                                                View bill
                                            </a>
                                        ) : (
                                            <span className="text-gray-300 text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center whitespace-nowrap">
                                        <button onClick={() => openEdit(exp)}
                                            className="text-indigo-500 hover:text-indigo-700 text-xs font-medium mr-3">
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(exp.id)}
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
