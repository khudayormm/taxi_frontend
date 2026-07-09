"use client";

import { YMaps, Map, Placemark, ZoomControl, TrafficControl, Clusterer } from "@pbe/react-yandex-maps";
import { useState, useEffect, useCallback, useRef } from "react";
import { Navigation, MapPin, Minus, Plus } from "lucide-react";
import api from "@/lib/api/api-config/api";
import { TUser } from "@/types/user-info";

interface Passenger {
    id: number;
    firstName: string;
    lastLat: number;
    lastLng: number;
}

export default function DriverMap({ user }: { user: TUser }) {
    const [location, setLocation] = useState<[number, number]>([41.5502, 60.6316]);
    const [passengers, setPassengers] = useState<Passenger[]>([]);
    const [isLocationReady, setIsLocationReady] = useState(false);

    // Qatnov taksi joylari
    const [seatsTotal, setSeatsTotal] = useState(user.seatsTotal ?? 4);
    const [seatsFilled, setSeatsFilled] = useState(user.seatsFilled ?? 0);
    const seatsFree = Math.max(0, seatsTotal - seatsFilled);

    // Joylarni backendga saqlash
    const saveSeats = useCallback(async (total: number, filled: number) => {
        try {
            await api.post("/user/seats", { seatsTotal: total, seatsFilled: filled });
        } catch (error) {
            console.error("Joylarni saqlashda xato:", error);
        }
    }, []);

    const changeFilled = (delta: number) => {
        setSeatsFilled((prev) => {
            const next = Math.max(0, Math.min(seatsTotal, prev + delta));
            saveSeats(seatsTotal, next);
            return next;
        });
    };

    const changeTotal = (delta: number) => {
        setSeatsTotal((prev) => {
            const nextTotal = Math.max(1, Math.min(8, prev + delta));
            const nextFilled = Math.min(seatsFilled, nextTotal);
            setSeatsFilled(nextFilled);
            saveSeats(nextTotal, nextFilled);
            return nextTotal;
        });
    };

    const locRef = useRef(location);
    useEffect(() => { locRef.current = location; }, [location]);

    // 1. Haydovchi lokatsiyasini kuzatish
    const startTracking = useCallback(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.watchPosition(
            (pos) => {
                setLocation([pos.coords.latitude, pos.coords.longitude]);
                setIsLocationReady(true);
            },
            (err) => console.error("GPS Error:", err),
            { enableHighAccuracy: true }
        );
    }, []);

    useEffect(() => { startTracking(); }, [startTracking]);

    // 2. Haydovchi lokatsiyasini backendga yuborib turish (yo'lovchilarga ko'rinishi uchun)
    const sendLocation = async () => {
        try {
            const [lat, lng] = locRef.current;
            await api.post('/user/location', { lat, lng });
        } catch (error) {
            console.error("Lokatsiya yuborishda xato:", error);
        }
    };

    useEffect(() => {
        if (!isLocationReady) return;
        sendLocation();
        const interval = setInterval(sendLocation, 30000);
        return () => clearInterval(interval);
    }, [isLocationReady]);

    // 3. Yo'lovchilarni har 15 sekundda yangilab turish
    const fetchActivePassengers = async () => {
        try {
            const response = await api.post('/user/active-passengers');
            if (response?.data?.success) {
                setPassengers(response.data.data);
            }
        } catch (error) {
            console.error("API Error:", error);
        }
    };

    useEffect(() => {
        if (!isLocationReady) return;
        fetchActivePassengers();
        const interval = setInterval(fetchActivePassengers, 15000);
        return () => clearInterval(interval);
    }, [isLocationReady]);

    return (
        <YMaps query={{ apikey: "e02566de-a548-47f4-ad84-de35f05d0ea9", lang: "ru_RU" }}>
            <div className="w-full h-screen relative bg-slate-100 overflow-hidden">

                {/* Holat ko'rsatkichi (tepada kichkina) */}
                <div className="absolute top-4 left-0 right-0 flex justify-center z-40 pointer-events-none">
                    <div className="bg-white/90 backdrop-blur px-4 py-1.5 rounded-full shadow-md border border-slate-200 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <p className="text-[10px] font-black text-slate-700 uppercase">
                            {passengers.length} ta yo'lovchi faol
                        </p>
                    </div>
                </div>
                <Map
                    state={{ center: location, zoom: 7, controls: [] }}
                    width="100%"
                    height="100%"
                    modules={["control.ZoomControl", "control.TrafficControl"]}
                >
                    {/* Haydovchi markeri */}
                    {isLocationReady && (
                        <Placemark
                            geometry={location}
                            options={{
                                preset: "islands#darkGreenCircleDotIcon",
                                zIndex: 100
                            }}
                        />
                    )}

                    {/* Yo'lovchilar markerlari */}
                    <Clusterer options={{ preset: "islands#invertedYellowClusterIcons" }}>
                        {passengers.map((p) => (
                            <Placemark
                                key={p.id}
                                geometry={[p.lastLat, p.lastLng]}
                                properties={{
                                    hintContent: p.firstName,
                                    balloonContent: p.firstName
                                }}
                                options={{
                                    preset: "islands#yellowPersonIcon",
                                    iconColor: "#ffcc00"
                                }}
                            />
                        ))}
                    </Clusterer>

                    <ZoomControl options={{ float: "right" } as any} />
                    <TrafficControl options={{ float: "left" } as any} />
                </Map>

                {/* Markazga qaytish tugmasi */}
                <button
                    onClick={() => setLocation([...locRef.current])}
                    className="absolute bottom-44 right-6 z-50 bg-white p-4 rounded-full shadow-2xl text-blue-600 active:scale-90 transition-all border border-slate-200"
                >
                    <Navigation size={24} fill="currentColor" />
                </button>

                {/* QATNOV TAKSI JOY PANELI */}
                <div className="absolute bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.12)] p-5 pb-7 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Bo'sh joylar</p>
                            <p className={`text-2xl font-black tracking-tight ${seatsFree === 0 ? "text-green-600" : "text-slate-800"}`}>
                                {seatsFree === 0 ? "🟢 To'ldi!" : `${seatsFree} ta joy bo'sh`}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[11px] font-bold text-slate-400">Band</p>
                            <p className="text-lg font-black text-slate-700">{seatsFilled}/{seatsTotal}</p>
                        </div>
                    </div>

                    {/* Band joy: yo'lovchi qo'shildi / tushdi */}
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm font-bold text-slate-600 flex-1">Yo'lovchi soni</span>
                        <button
                            onClick={() => changeFilled(-1)}
                            className="w-11 h-11 flex items-center justify-center bg-slate-100 rounded-xl text-slate-700 active:bg-slate-200 disabled:opacity-40"
                            disabled={seatsFilled <= 0}
                        >
                            <Minus size={20} strokeWidth={3} />
                        </button>
                        <span className="w-8 text-center text-xl font-black text-slate-800">{seatsFilled}</span>
                        <button
                            onClick={() => changeFilled(1)}
                            className="w-11 h-11 flex items-center justify-center bg-blue-600 rounded-xl text-white active:bg-blue-700 disabled:opacity-40"
                            disabled={seatsFilled >= seatsTotal}
                        >
                            <Plus size={20} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Jami joy sozlash */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-600 flex-1">Mashina joylari</span>
                        <button
                            onClick={() => changeTotal(-1)}
                            className="w-11 h-11 flex items-center justify-center bg-slate-100 rounded-xl text-slate-700 active:bg-slate-200 disabled:opacity-40"
                            disabled={seatsTotal <= 1}
                        >
                            <Minus size={20} strokeWidth={3} />
                        </button>
                        <span className="w-8 text-center text-xl font-black text-slate-800">{seatsTotal}</span>
                        <button
                            onClick={() => changeTotal(1)}
                            className="w-11 h-11 flex items-center justify-center bg-slate-800 rounded-xl text-white active:bg-slate-900 disabled:opacity-40"
                            disabled={seatsTotal >= 8}
                        >
                            <Plus size={20} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* GPS yo'qligi haqida ogohlantirish (faqat ruxsat bo'lmasa) */}
                {!isLocationReady && (
                    <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center p-6 text-center">
                        <div>
                            <MapPin size={48} className="mx-auto text-slate-300 mb-4 animate-bounce" />
                            <p className="text-slate-600 font-bold">Lokatsiya aniqlanmoqda...</p>
                        </div>
                    </div>
                )}
            </div>
        </YMaps>
    );
}