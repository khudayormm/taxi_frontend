import api from "../api-config/api";

export const createCategory = async (data: any) => {
    try {
        // initData ni api instance o'zi qo'shib yuboradi
        const response = await api.post(`/category/create`, data);

        return response.data;
    } catch (error: any) {
        // Xatolik xabarini qayta ishlash
        const message =
            error?.response?.data?.message ||
            error?.message ||
            "Noma’lum xatolik";

        return { success: false, message };
    }
};