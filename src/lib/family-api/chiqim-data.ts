import api from "../api/api-config/api";

type GetExpenseParams = {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: number | null;
    sortBy?: "newest" | "oldest" | "highest" | "lowest";
    dateFrom?: string;
    dateTo?: string;
};

export const getFamiliyChiqim = async (params?: GetExpenseParams) => {
    try {
        const body: Record<string, any> = {
            page: params?.page ?? 1,
            limit: params?.limit ?? 20,
        };

        if (params?.search?.trim()) body.search = params.search.trim();
        if (params?.categoryId) body.categoryId = params.categoryId;
        if (params?.sortBy) body.sortBy = params.sortBy;
        if (params?.dateFrom) body.dateFrom = params.dateFrom;
        if (params?.dateTo) body.dateTo = params.dateTo;

        const response = await api.post(`/family/chiqim`, body);
        return response.data;
    } catch (error) {
        console.error('Xarajatlarni olishda xatolik:', error);
        throw error;
    }
};