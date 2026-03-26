import api from "../api-config/api";

// User info olish funksiyasi
export const getWeekChart = async () => {
    try {
        // POST request (chunki initData body da yuboriladi)
        const response = await api.post(`/chart/week`, {});

        return response.data;
    } catch (error) {
        console.error('Incomes olishda xatolik:', error);
        throw error;
    }
};