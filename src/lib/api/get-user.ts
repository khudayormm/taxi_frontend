import api from './api-config/api';
export const getUserInfo = async () => {
    try {
        const response = await api.post(`/user/info`, {});

        return response.data;
    } catch (error) {
        console.error('User info olishda xatolik:', error);
        throw error;
    }
};