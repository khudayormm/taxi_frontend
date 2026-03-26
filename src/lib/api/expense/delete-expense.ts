import api from "../api-config/api";

type DeleteExpenseData = {
    expenseId: number;
};

export const deleteExpense = async (data: DeleteExpenseData) => {
    try {
        const response = await api.post(`/expense/delete`, {
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