"use client";

import {
    YMaps,
    Map,
    Placemark,
    ZoomControl,
    GeolocationControl,
    TypeSelector
} from "@pbe/react-yandex-maps";
import { useState, useEffect } from "react";

interface YandexMapProps {
    role: "PASSENGER" | "DRIVER";
    userId?: number;
}

export default function YandexMapComponent({ role }: YandexMapProps) {
    const [userLocation, setUserLocation] = useState<[number, number]>([41.2995, 69.2401]);
    const [mapType, setMapType] = useState<"yandex#map" | "yandex#satellite" | "yandex#hybrid">("yandex#map");

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setUserLocation([pos.coords.latitude, pos.coords.longitude]);
            });
        }
    }, []);

    return (
        <YMaps query={{ apikey: "e02566de-a548-47f4-ad84-de35f05d0ea9", lang: "ru_RU" }}>
            <div className="w-full h-screen relative">
                <Map
                    state={{
                        center: userLocation,
                        zoom: 14,
                        type: mapType
                    }}
                    width="100%"
                    height="100%"
                    modules={["control.ZoomControl", "control.FullscreenControl", "control.TypeSelector"]}
                >
                    <Placemark
                        geometry={userLocation}
                        options={{ preset: "islands#redCircleDotIcon" }}
                        properties={{ balloonContent: "Siz shu yerdasiz" }}
                    />

                    {/* DIQQAT: 'position' xatosi chiqmasligi uchun 'float' ishlatamiz.
                      Yoki ( { position: { right: 10, top: 50 } } as any ) ko'rinishida yozamiz.
                    */}
                    <ZoomControl options={{ float: "right" } as any} />
                    <GeolocationControl options={{ float: "left" } as any} />
                    <TypeSelector options={{ float: "right" } as any} />
                </Map>

                <div className="absolute bottom-10 left-0 right-0 z-50 flex flex-col items-center gap-3 px-4">
                    <button
                        onClick={() => setMapType(mapType === 'yandex#map' ? 'yandex#hybrid' : 'yandex#map')}
                        className="bg-white/80 backdrop-blur-sm text-[10px] font-bold px-4 py-2 rounded-full shadow-md border border-gray-200 active:scale-95 transition"
                    >
                        {mapType === 'yandex#map' ? "🛰️ Sputnik" : "🗺️ Sxema"}
                    </button>

                    <button className="w-full max-w-xs bg-[#ffcc00] text-black font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition">
                        {role === "PASSENGER" ? "TAKSI CHAQIRISH" : "BUYURTMALAR"}
                    </button>
                </div>
            </div>
        </YMaps>
    );
}