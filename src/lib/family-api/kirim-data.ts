import api from "../api/api-config/api";

export const getFamiliyKirim = async (params?: { page?: number; limit?: number }) => {
    const response = await api.post(`/family/incomes`, {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
    });

    // response.data => { success, incomes, pagination }
    return response.data;
};