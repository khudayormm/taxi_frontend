import api from '../api-config/api';

export const getCurrentMonthChart = async () => {
    try {
        const response = await api.post(`/chart/month-current`, {});

        return response.data;
    } catch (error) {
        console.error('Incomes olishda xatolik:', error);
        throw error;
    }
};