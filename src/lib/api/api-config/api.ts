import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// 1. Axios instance yaratish
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. Request Interceptor (So'rov ketishidan oldin ishlaydi)
api.interceptors.request.use(
    (config) => {
        // Next.js da xatolik chiqmasligi uchun window borligini tekshiramiz
        if (typeof window !== 'undefined') {
            const initData = window.Telegram?.WebApp?.initData;

            if (initData) {
                // Sizning backend initData'ni body (data) dan kutyapti, shuning uchun body'ga qo'shamiz
                if (config.method === 'post' || config.method === 'put' || config.method === 'patch') {
                    config.data = {
                        ...config.data,
                        initData,
                    };
                }

                // MASLAHAT: Aslida standart bo'yicha tokenni Header'dan yuborgan ma'qul:
                // config.headers.Authorization = `tma ${initData}`;
            } else {
                // Agar WebApp topilmasa, so'rovni bekor qilish ham mumkin
                return Promise.reject(new Error("Telegram WebApp mavjud emas yoki initData topilmadi"));
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// (Ixtiyoriy) 3. Response Interceptor (Xatoliklarni bir joyda ushlash uchun)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Bu yerda token eskirgan bo'lsa (401) foydalanuvchini chiqarib yuborish kabi ishlarni qilish mumkin
        return Promise.reject(error);
    }
);

export default api;