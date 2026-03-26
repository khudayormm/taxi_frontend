import api from "../api-config/api";

export const getIncomes = async (params?: { page?: number; limit?: number }) => {
    const response = await api.post(`/incomes/get`, {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
    });

    // response.data => { success, incomes, pagination }
    return response.data;
};