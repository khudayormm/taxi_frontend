"use client";

import { YMaps, Map, Placemark, ZoomControl, Clusterer } from "@pbe/react-yandex-maps";
import { useState, useEffect, useCallback } from "react";
import { Navigation } from "lucide-react";
import api from "@/lib/api/api-config/api";

interface Driver {
    id: number;
    firstName: string;
    phone: string | null;
    lastLat: number;
    lastLng: number;
    rating: number | null;
    ratingCount: number;
}

const URGANCH_CENTER: [number, number] = [41.5502, 60.6316];

const toDataUri = (svg: string) =>
    `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;

const TAXI_MARKER = toDataUri(`
  <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
    <circle cx="22" cy="22" r="16" fill="#ffcc00" stroke="white" stroke-width="3"/>
    <text x="22" y="28" font-size="16" text-anchor="middle">🚕</text>
  </svg>
`);

const CURRENT_LOCATION_MARKER = toDataUri(`
  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="#3B82F6" opacity="0.25"/>
    <circle cx="12" cy="12" r="7" fill="white"/>
    <circle cx="12" cy="12" r="5" fill="#2563EB"/>
  </svg>
`);

// Faqat ko'rish rejimi: yo'lovchi joriy taksilarni xaritada kuzatadi,
// markerga bossa haydovchining ismi, bahosi va telefoni chiqadi
export default function TaxisViewMap() {
    const [location, setLocation] = useState<[number, number] | null>(null);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [mapCenter] = useState<[number, number]>(URGANCH_CENTER);

    // Joriy joylashuvni aniqlash (majburiy emas — xarita baribir ochiladi)
    const locate = useCallback(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                setLocation(coords);
                api.post("/user/location", { lat: coords[0], lng: coords[1] }).catch(() => { });
            },
            (err) => console.error("GPS Error:", err),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, []);

    useEffect(() => { locate(); }, [locate]);

    // Faol taksilarni har 15 sekundda yangilab turish
    useEffect(() => {
        const fetchDrivers = async () => {
            try {
                const response = await api.post('/user/active-drivers');
                if (response?.data?.success) {
                    setDrivers(response.data.data);
                }
            } catch (error) {
                console.error("Taksilarni olishda xato:", error);
            }
        };

        fetchDrivers();
        const interval = setInterval(fetchDrivers, 15000);
        return () => clearInterval(interval);
    }, []);

    const balloonFor = (d: Driver) => {
        const rating = d.rating
            ? `⭐ ${d.rating} (${d.ratingCount} baho)`
            : "⭐ Hali baholanmagan";
        const phone = d.phone
            ? `<br/>📞 <a href="tel:${d.phone}">${d.phone}</a>`
            : "";
        return `🚕 <b>${d.firstName}</b><br/>${rating}${phone}`;
    };

    return (
        <YMaps query={{ apikey: "e02566de-a548-47f4-ad84-de35f05d0ea9", lang: "ru_RU" }}>
            <div className="w-full h-screen relative bg-slate-100 overflow-hidden">

                {/* Sarlavha va faol taksilar soni */}
                <div className="absolute top-4 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                    <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg p-3 border border-gray-100">
                        <p className="text-sm font-bold text-slate-700">🚕 Joriy faol taksilar</p>
                        <p className="text-[11px] text-slate-400 font-medium">
                            Markerga bossangiz haydovchining bahosi va telefoni chiqadi
                        </p>
                    </div>
                    <div className="flex justify-center">
                        <div className="bg-white/90 backdrop-blur px-4 py-1.5 rounded-full shadow-md border border-slate-200 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${drivers.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                            <p className="text-[10px] font-black text-slate-700 uppercase">
                                {drivers.length} ta taksi faol
                            </p>
                        </div>
                    </div>
                </div>

                <Map
                    state={{ center: location ?? mapCenter, zoom: location ? 12 : 10, controls: [] }}
                    width="100%"
                    height="100%"
                    modules={["control.ZoomControl"]}
                    options={{ suppressMapOpenBlock: true }}
                >
                    {/* Joriy joylashuv — kichik ko'k nuqta */}
                    {location && (
                        <Placemark
                            geometry={location}
                            properties={{ hintContent: "Siz shu yerdasiz" }}
                            options={{
                                iconLayout: "default#image",
                                iconImageHref: CURRENT_LOCATION_MARKER,
                                iconImageSize: [24, 24],
                                iconImageOffset: [-12, -12],
                                zIndex: 80,
                            }}
                        />
                    )}

                    {/* Faol taksilar */}
                    <Clusterer options={{ preset: "islands#invertedYellowClusterIcons" }}>
                        {drivers.map((d) => (
                            <Placemark
                                key={d.id}
                                geometry={[d.lastLat, d.lastLng]}
                                properties={{
                                    hintContent: `🚕 ${d.firstName}`,
                                    balloonContent: balloonFor(d),
                                }}
                                options={{
                                    iconLayout: "default#image",
                                    iconImageHref: TAXI_MARKER,
                                    iconImageSize: [44, 44],
                                    iconImageOffset: [-22, -22],
                                }}
                            />
                        ))}
                    </Clusterer>

                    <ZoomControl options={{ float: "right" } as any} />
                </Map>

                {/* Joylashuvga qaytish */}
                <button
                    onClick={locate}
                    className="absolute bottom-10 right-4 z-50 bg-white p-4 rounded-full shadow-xl border border-gray-100 active:scale-90 transition-all"
                >
                    <Navigation className="text-blue-600" size={24} fill={location ? "currentColor" : "none"} />
                </button>
            </div>
        </YMaps>
    );
}
