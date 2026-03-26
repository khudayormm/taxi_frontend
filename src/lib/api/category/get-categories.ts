import api from "../api-config/api";

export const getCategories = async (categoryType: string) => {
    try {
        // initData global interceptor orqali qo'shiladi
        const response = await api.post(`/category/get`, { categoryType });

        return response.data;
    } catch (error) {
        console.error('Kategoriyalarni olishda xatolik:', error);
        throw error;
    }
};