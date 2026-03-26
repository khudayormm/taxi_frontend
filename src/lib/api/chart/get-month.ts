import api from "../api-config/api";

export const getMonthChart = async () => {
    try {
        const response = await api.post(`/chart/month`, {});

        return response.data;
    } catch (error) {
        console.error('Incomes olishda xatolik:', error);
        throw error;
    }
};