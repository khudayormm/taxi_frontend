import api from "../api-config/api";


type CreateExpenseData = {
    categoryId: number;
    description?: string | null;
    amount: number;
    date?: string;
};

// User info olish funksiyasi
export const createExpense = async (data: CreateExpenseData) => {
    try {
        const response = await api.post(`/expense/create`, {
            ...data,
        });

        return response.data;
    } catch (err: any) {
        // ✅ backend message’ni olib beramiz
        return {
            success: false,
            message:
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "Xatolik",
        }
    }
};