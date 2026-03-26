import axios from "axios";
import api from "../api-config/api";

export const deleteCategory = async (data: any) => {
    try {
        // initData ni api instance o'zi body ga qo'shib yuboradi
        const response = await api.post(`/category/delete`, data);

        return response.data;
    } catch (err: any) {
        // ✅ backend message ni success:false qilib qaytaramiz
        if (axios.isAxiosError(err)) {
            return {
                success: false,
                message: err.response?.data?.message || err.message,
                status: err.response?.status,
            };
        }

        return { success: false, message: err?.message ?? "Noma’lum xatolik" };
    }
};