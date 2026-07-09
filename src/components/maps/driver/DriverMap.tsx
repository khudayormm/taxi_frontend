"use client";

import { YMaps, Map, Placemark, ZoomControl, TrafficControl, Clusterer } from "@pbe/react-yandex-maps";
import { useState, useEffect, useCallback, useRef } from "react";
import { Navigation, MapPin } from "lucide-react";
import api from "@/lib/api/api-config/api";

interface Passenger {
    id: number;
    firstName: string;
    lastLat: number;
    lastLng: number;
}

export default function DriverMap() {
    const [location, setLocation] = useState<[number, number]>([41.5502, 60.6316]);
    const [passengers, setPassengers] = useState<Passenger[]>([]);
    const [isLocationReady, setIsLocationReady] = useState(false);

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
                    state={{ center: location, zoom: 12 }}
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
                    className="absolute bottom-10 right-6 z-50 bg-white p-4 rounded-full shadow-2xl text-blue-600 active:scale-90 transition-all border border-slate-200"
                >
                    <Navigation size={24} fill="currentColor" />
                </button>

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