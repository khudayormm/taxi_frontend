import api from "../api-config/api";

// User info olish funksiyasi
export const getYearChart = async () => {
    try {
        const response = await api.post(`/chart/year`, {});

        return response.data;
    } catch (error) {
        console.error('Incomes olishda xatolik:', error);
        throw error;
    }
};