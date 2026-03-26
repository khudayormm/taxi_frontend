import api from "../api-config/api";

type CreateIncomeData = {
    categoryId: number;
    description?: string | null;
    amount: number;
};

// User info olish funksiyasi
export const createIncome = async (data: CreateIncomeData) => {
    try {
        const response = await api.post(`/incomes/create`, {
            ...data,
        });

        return response.data;
    } catch (error) {
        console.error('Incomes olishda xatolik:', error);
        throw error;
    }
};