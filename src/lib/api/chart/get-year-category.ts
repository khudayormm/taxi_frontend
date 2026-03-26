import api from "../api-config/api"

export const getYearCategoryChart = async ({
    year,
    categoryId,
    type, // 👈 qo‘shildi
}: {
    year: number
    categoryId: number
    type: "EXPENSE" | "INCOME"
}) => {
    try {
        const response = await api.post(`/chart/category-year`, {
            year,
            categoryId,
            type, // 👈 backendga yuboramiz
        })

        return response.data
    } catch (error: any) {
        const message =
            error?.response?.data?.message || error?.message || "Noma’lum xatolik"

        return { success: false, message }
    }
}