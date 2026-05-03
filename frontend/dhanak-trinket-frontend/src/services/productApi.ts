import {
    Product,
    CreateProductRequest,
    UpdateProductRequest,
    ProductFilterRequest,
    ProductCategory,
    ApiResponse,
    RecordSaleRequest,
    SaleDto,
    SalesSummaryDto,
    CreateExpenseRequest,
    ExpenseDto,
    ExpenseCategory,
} from '@/types/product';

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

// Get stored JWT token for admin requests
function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
}

// Build Authorization header for admin endpoints
function authHeader(): Record<string, string> {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// Generic API request helper
async function apiRequest<T>(
    endpoint: string,
    options?: RequestInit
): Promise<ApiResponse<T>> {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            ...options,
        });

        if (response.status === 401) {
            // Token expired or invalid — redirect to login
            if (typeof window !== 'undefined') {
                localStorage.removeItem('auth_token');
                window.location.href = '/login';
            }
            // Return early so we don't fall through to !response.ok and throw
            return { success: false, message: 'Session expired. Please log in again.', errors: [] };
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ApiResponse<T> = await response.json();
        return data;
    } catch (error) {
        console.error('API request failed:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
    }
}

// Product API functions
export const productApi = {
    // Get all products with optional filtering
    async getProducts(filters?: ProductFilterRequest): Promise<ApiResponse<Product[]>> {
        const params = new URLSearchParams();

        if (filters?.category) params.append('category', filters.category.toString());
        if (filters?.searchTerm) params.append('searchTerm', filters.searchTerm);
        if (filters?.inStockOnly !== undefined) params.append('inStockOnly', filters.inStockOnly.toString());
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

        const queryString = params.toString();
        const endpoint = `/products${queryString ? `?${queryString}` : ''}`;

        return apiRequest<Product[]>(endpoint);
    },

    // Get single product by ID
    async getProduct(id: number): Promise<ApiResponse<Product>> {
        return apiRequest<Product>(`/products/${id}`);
    },

    // Get products by category
    async getProductsByCategory(category: ProductCategory): Promise<ApiResponse<Product[]>> {
        return apiRequest<Product[]>(`/products/category/${category}`);
    },

    // Create new product (Admin only)
    async createProduct(product: CreateProductRequest): Promise<ApiResponse<Product>> {
        return apiRequest<Product>('/products', {
            method: 'POST',
            headers: authHeader(),
            body: JSON.stringify(product),
        });
    },

    // Update existing product (Admin only)
    async updateProduct(id: number, product: UpdateProductRequest): Promise<ApiResponse<Product>> {
        return apiRequest<Product>(`/products/${id}`, {
            method: 'PUT',
            headers: authHeader(),
            body: JSON.stringify(product),
        });
    },

    // Delete product (Admin only)
    async deleteProduct(id: number): Promise<ApiResponse<null>> {
        return apiRequest<null>(`/products/${id}`, {
            method: 'DELETE',
            headers: authHeader(),
        });
    },

    // Like a product (Customer feature)
    async likeProduct(id: number): Promise<ApiResponse<null>> {
        return apiRequest<null>(`/products/${id}/like`, {
            method: 'POST',
        });
    },

    // Upload product image (Admin only)
    async uploadProductImage(productId: number, file: File): Promise<ApiResponse<unknown>> {
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch(`${API_BASE_URL}/products/${productId}/images`, {
                method: 'POST',
                headers: authHeader(),
                body: formData,
            });

            if (response.status === 401) {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('auth_token');
                    window.location.href = '/login';
                }
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Image upload failed:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Image upload failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
        }
    },

    // Record a sale (Admin only) — called from "Mark as Sold" modal
    async recordSale(request: RecordSaleRequest): Promise<ApiResponse<SaleDto>> {
        return apiRequest<SaleDto>('/sales', {
            method: 'POST',
            headers: authHeader(),
            body: JSON.stringify(request),
        });
    },

    // Get sales list with optional filters (Admin only)
    async getSales(year?: number, month?: number): Promise<ApiResponse<SaleDto[]>> {
        const params = new URLSearchParams();
        if (year) params.append('year', year.toString());
        if (month) params.append('month', month.toString());
        const qs = params.toString();
        return apiRequest<SaleDto[]>(`/sales${qs ? `?${qs}` : ''}`, {
            headers: authHeader(),
        });
    },

    // Get monthly P&L summary (Admin only)
    async getSalesSummary(year?: number): Promise<ApiResponse<SalesSummaryDto[]>> {
        const qs = year ? `?year=${year}` : '';
        return apiRequest<SalesSummaryDto[]>(`/sales/summary${qs}`, {
            headers: authHeader(),
        });
    },

    // ─── Expenses ─────────────────────────────────────────────────────────────

    async createExpense(request: CreateExpenseRequest): Promise<ApiResponse<ExpenseDto>> {
        return apiRequest<ExpenseDto>('/expenses', {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });
    },

    async uploadExpenseBill(expenseId: number, file: File): Promise<ApiResponse<ExpenseDto>> {
        const formData = new FormData();
        formData.append('file', file);
        return apiRequest<ExpenseDto>(`/expenses/${expenseId}/bill`, {
            method: 'POST',
            headers: authHeader(),   // No Content-Type: browser sets multipart boundary
            body: formData,
        });
    },

    async getExpenses(year?: number, month?: number, category?: ExpenseCategory): Promise<ApiResponse<ExpenseDto[]>> {
        const params = new URLSearchParams();
        if (year) params.set('year', String(year));
        if (month) params.set('month', String(month));
        if (category !== undefined) params.set('category', String(category));
        const qs = params.toString() ? `?${params.toString()}` : '';
        return apiRequest<ExpenseDto[]>(`/expenses${qs}`, {
            headers: authHeader(),
        });
    },

    async deleteExpense(id: number): Promise<ApiResponse<object>> {
        return apiRequest<object>(`/expenses/${id}`, {
            method: 'DELETE',
            headers: authHeader(),
        });
    },
};

// Helper functions
export const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
};

export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};