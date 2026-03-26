import api from "../api-config/api";

export const editCategory = async (data: any) => {
    try {
        // ✅ categoryId majburiy: data.id bo‘lsa ham categoryId qilib yuboramiz
        const payload = {
            ...data,
            categoryId: data.categoryId ?? data.id, // 👈 ENG MUHIM FIX
            // initData api.ts da avtomatik qo'shiladi
        };

        // headers: { "Content-Type": "application/json" } qismi api.ts da bor, yozish shart emas
        const response = await api.post(`/category/edit`, payload);

        return response.data;
    } catch (error: any) {
        // ✅ backenddan kelgan message’ni olib beramiz
        const message =
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "Xatolik";

        return {
            success: false,
            message,
            status: error?.response?.status,
        };
    }
};