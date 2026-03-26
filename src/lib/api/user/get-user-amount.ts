import api from "../api-config/api";

// User info olish funksiyasi
export const getUserAmount = async () => {
    try {
        const response = await api.post(`/user/amount`, {});

        return response.data;
    } catch (error) {
        console.error('User amount olishda xatolik:', error);
        throw error;
    }
};