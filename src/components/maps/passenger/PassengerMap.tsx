"use client";

import { YMaps, Map, Placemark, ZoomControl, Polygon, Clusterer } from "@pbe/react-yandex-maps";
import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Navigation, ChevronRight, AlertTriangle, MapPin, X, Clock, Route } from "lucide-react";
import * as turf from "@turf/turf";
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

// --- XORAZM UCHUN KOORDINATALAR ---
const URGANCH_CENTER: [number, number] = [41.5502, 60.6316];
const BOGOT_CENTER: [number, number] = [41.3542, 60.8161];

// Xarita qamrovi (Toshkentga ketib qolmasligi uchun).
// Zoom 7 gacha ochilishi uchun keng olingan, aks holda Yandex zoomni o'zi ko'tarib yuboradi
const MAP_BOUNDS = [[40.5000, 59.0000], [42.5000, 62.5000],
];

// SVG MARKERLAR
// base64 ishlatiladi: encodeURIComponent qavslarni () kodlamaydi va SVG ichidagi
// url(#...) Yandex xaritasining CSS url(...) sini buzib, marker ko'rinmay qolardi
const toDataUri = (svg: string) =>
    `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;

// Jo'nash (A) markeri: pasti tayoq, tepasi yashil dumaloq
const PICKUP_MARKER = toDataUri(`
  <svg width="48" height="64" viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="24" cy="60" rx="7" ry="3" fill="#000000" opacity="0.25"/>
    <line x1="24" y1="60" x2="24" y2="26" stroke="#14532D" stroke-width="4" stroke-linecap="round"/>
    <circle cx="24" cy="15" r="13" fill="#22C55E" stroke="white" stroke-width="3"/>
    <text x="24" y="20" font-size="13" font-weight="bold" fill="white" text-anchor="middle" font-family="Arial">A</text>
  </svg>
`);

// Joriy GPS joylashuv — kichik ko'k nuqta (eng past darajali belgi)
const CURRENT_LOCATION_MARKER = toDataUri(`
  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="#3B82F6" opacity="0.25"/>
    <circle cx="12" cy="12" r="7" fill="white"/>
    <circle cx="12" cy="12" r="5" fill="#2563EB"/>
  </svg>
`);

const TAXI_MARKER = toDataUri(`
  <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
    <defs><filter id="taxi-shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.35"/></filter></defs>
    <circle cx="22" cy="22" r="16" fill="#ffcc00" stroke="white" stroke-width="3" filter="url(#taxi-shadow)"/>
    <text x="22" y="28" font-size="16" text-anchor="middle">🚕</text>
  </svg>
`);

// Borish joyi markeri: pasti tayoq, tepasi qizil dumaloq
const DESTINATION_MARKER = toDataUri(`
  <svg width="48" height="64" viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="24" cy="60" rx="7" ry="3" fill="#000000" opacity="0.25"/>
    <line x1="24" y1="60" x2="24" y2="26" stroke="#7F1D1D" stroke-width="4" stroke-linecap="round"/>
    <circle cx="24" cy="15" r="13" fill="#EF4444" stroke="white" stroke-width="3"/>
    <text x="24" y="20" font-size="13" font-weight="bold" fill="white" text-anchor="middle" font-family="Arial">B</text>
  </svg>
`);

// Yordamchi: Turf.js orqali poligon ichidami tekshirish
const isPointInGeoJSON = (lat: number, lng: number, geojson: any) => {
    if (!geojson) return false;
    const pt = turf.point([lng, lat]); // turf [lng, lat] oladi

    if (geojson.type === "FeatureCollection") {
        for (const feature of geojson.features) {
            if (feature.geometry && (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon")) {
                if (turf.booleanPointInPolygon(pt, feature)) return true;
            }
        }
    }
    return false;
};

// Yordamchi: Yandex Maps dagi <Polygon> uchun [lng, lat] ni [lat, lng] ga o'girish
const extractPolygonCoords = (geojson: any) => {
    if (!geojson) return [];
    try {
        const feature = geojson.features[0];
        const coords = feature.geometry.type === 'MultiPolygon'
            ? feature.geometry.coordinates[0]
            : feature.geometry.coordinates;
        return coords.map((ring: any[]) => ring.map(([lng, lat]) => [lat, lng]));
    } catch (e) {
        return [];
    }
};

export default function PassengerMap() {
    const [mapCenter, setMapCenter] = useState<[number, number]>([41.4522, 60.7238]);
    const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
    const [pickup, setPickup] = useState<[number, number] | null>(null);
    // Jo'nash joyi tasdiqlanganmi ("✅ Shu yerga boraman" bosilganmi)
    const [pickupConfirmed, setPickupConfirmed] = useState(false);
    const [destination, setDestination] = useState<[number, number] | null>(null);
    const [price, setPrice] = useState(15000);
    const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
    const [activeCity, setActiveCity] = useState<"urganch" | "bogot" | null>(null);

    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [isLocating, setIsLocating] = useState(true);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [drivers, setDrivers] = useState<Driver[]>([]);

    // GeoJSON fayllarini saqlash uchun
    const [urgenchGeoJSON, setUrgenchGeoJSON] = useState<any>(null);
    const [bagatGeoJSON, setBagatGeoJSON] = useState<any>(null);

    const mapRef = useRef<any>(null);
    const ymapsRef = useRef<any>(null);
    const routeRef = useRef<any>(null);
    // Drag paytida eski joyga qaytarish uchun oxirgi pickup qiymati
    const pickupRef = useRef<[number, number] | null>(null);
    useEffect(() => { pickupRef.current = pickup; }, [pickup]);

    const destinationRef = useRef<[number, number] | null>(null);
    useEffect(() => { destinationRef.current = destination; }, [destination]);

    // Xatolik xabari 4 sekunddan keyin o'zi yo'qoladi (UI toza tursin)
    useEffect(() => {
        if (!locationError) return;
        const t = setTimeout(() => setLocationError(null), 4000);
        return () => clearTimeout(t);
    }, [locationError]);

    // 1. Dastur yonganda Public papkasidan geojson fayllarni o'qib olish
    useEffect(() => {
        Promise.all([
            fetch('/urgench.geojson').then(res => res.json()),
            fetch('/bagat.geojson').then(res => res.json())
        ]).then(([urgench, bagat]) => {
            setUrgenchGeoJSON(urgench);
            setBagatGeoJSON(bagat);
        }).catch(err => {
            console.error("GeoJSON fayllarni yuklashda xatolik:", err);
            setLocationError("Hudud fayllari yuklanmadi. Sahifani yangilang.");
        });
    }, []);

    // Faol haydovchilarni (taksilarni) har 15 sekundda yangilab turish
    useEffect(() => {
        const fetchActiveDrivers = async () => {
            try {
                const response = await api.post('/user/active-drivers');
                if (response?.data?.success) {
                    setDrivers(response.data.data);
                }
            } catch (error) {
                console.error("Haydovchilarni olishda xato:", error);
            }
        };

        fetchActiveDrivers();
        const interval = setInterval(fetchActiveDrivers, 15000);
        return () => clearInterval(interval);
    }, []);

    // Yo'lovchi lokatsiyasini backendga yuborish (haydovchilarga ko'rinishi uchun)
    const sendLocation = async (lat: number, lng: number) => {
        try {
            await api.post('/user/location', { lat, lng });
        } catch (error) {
            console.error("Lokatsiya yuborishda xato:", error);
        }
    };

    // Nuqta qaysi shaharda ekanligini aniqlash (Urganch yoki Bog'ot)
    const detectCity = useCallback((coords: [number, number]): "urganch" | "bogot" | null => {
        if (isPointInGeoJSON(coords[0], coords[1], urgenchGeoJSON)) return "urganch";
        if (isPointInGeoJSON(coords[0], coords[1], bagatGeoJSON)) return "bogot";
        return null; // Ikkala hududga ham tushmasa null
    }, [urgenchGeoJSON, bagatGeoJSON]);

    // Geolokatsiyani aniqlash
    const getLocation = useCallback(() => {
        setIsLocating(true);
        setLocationError(null);

        if (!urgenchGeoJSON || !bagatGeoJSON) {
            setIsLocating(false);
            setLocationError("Hududlar xaritasi yuklanmoqda, kuting...");
            return;
        }

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                    // Joriy joylashuv markeri har doim GPS nuqtada turadi
                    setCurrentLocation(coords);
                    sendLocation(coords[0], coords[1]);
                    const city = detectCity(coords);

                    // Jo'nash markeri faqat chegara (Urganch/Bog'ot) ichida qo'yiladi
                    if (!city) {
                        setLocationError("Siz Urganch yoki Bog'ot hududida emassiz. Xaritadan o'zingiz tanlang.");
                        setIsLocating(false);
                        return;
                    }

                    // A nuqta avtomatik joriy joylashuvga qo'yiladi va tasdiqlanadi —
                    // to'g'ridan-to'g'ri borish manzilini tanlashga o'tiladi.
                    // Keyin xohlasa "Jo'nash joyini o'zgartirish" bilan suradi.
                    setPickup(coords);
                    setActiveCity(city);
                    setPickupConfirmed(true);
                    setIsLocating(false);
                },
                (err) => {
                    console.error("Geolokatsiya xatosi:", err);
                    setIsLocating(false);
                    setLocationError("GPS o'chiq. Xaritadan jo'nash joyini tanlang.");
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            setIsLocating(false);
            setLocationError("Sizning qurilmangizda GPS topilmadi.");
        }
    }, [detectCity, urgenchGeoJSON, bagatGeoJSON]);

    // Boshlang'ich hududlarni yuklagandan so'ng GPS ni tekshirish
    useEffect(() => {
        if (urgenchGeoJSON && bagatGeoJSON) {
            getLocation();
        }
    }, [urgenchGeoJSON, bagatGeoJSON, getLocation]);

    // JO'NASH JOYI TASDIQLANGACH: borish markeri default qarama-qarshi
    // shahar markazida qo'yiladi va marshrut chiziladi.
    // isMapLoaded shart: GPS xaritadan oldin aniqlansa, effekt xarita
    // yuklangach qayta ishga tushishi kerak
    useEffect(() => {
        if (pickup && pickupConfirmed && !destination && activeCity && isMapLoaded && mapRef.current && ymapsRef.current) {
            const targetCenter = activeCity === "urganch" ? BOGOT_CENTER : URGANCH_CENTER;
            setDestination(targetCenter);
            drawRoute(ymapsRef.current, mapRef.current, pickup, targetCenter);
        }
    }, [pickup, pickupConfirmed, destination, activeCity, isMapLoaded]);

    // Marshrut chizish
    const drawRoute = (ymaps: any, map: any, start: [number, number], end: [number, number]) => {
        if (routeRef.current) map.geoObjects.remove(routeRef.current);
        setRouteInfo(null);

        const multiRoute = new ymaps.multiRouter.MultiRoute(
            { referencePoints: [start, end], params: { routingMode: "auto" } },
            { boundsAutoApply: true, routeActiveStrokeWidth: 5, routeActiveStrokeColor: "#ffcc00", wayPointStartVisible: false, wayPointFinishVisible: false }
        );

        multiRoute.model.events.add("requestsuccess", () => {
            const activeRoute = multiRoute.getActiveRoute();
            if (activeRoute) {
                setRouteInfo({
                    distance: activeRoute.properties.get("distance").text,
                    duration: activeRoute.properties.get("duration").text
                });
            }
        });

        routeRef.current = multiRoute;
        map.geoObjects.add(multiRoute);
    };

    // JO'NASH MARKERINI BOSIB TURIB SURGANDA (drag tugagach)
    const onPickupDragEnd = (e: any) => {
        const coords = e.get("target").geometry.getCoordinates() as [number, number];
        const city = detectCity(coords);

        if (!city) {
            setLocationError("Jo'nash joyi faqat Urganch yoki Bog'ot chegarasi ichida bo'lishi mumkin.");
            // Chegaradan tashqariga surilsa markerni eski joyiga qaytaramiz
            if (pickupRef.current) {
                e.get("target").geometry.setCoordinates(pickupRef.current);
            }
            return;
        }

        setLocationError(null);
        setPickup(coords);
        setActiveCity(city);
    };

    // BORISH MARKERINI BOSIB TURIB SURGANDA (drag tugagach)
    const onDestinationDragEnd = (e: any) => {
        const coords = e.get("target").geometry.getCoordinates() as [number, number];
        const destCity = detectCity(coords);

        if (!destCity || destCity === activeCity) {
            setLocationError(
                !destCity
                    ? "Borish manzili faqat Urganch yoki Bog'ot chegarasi ichida bo'lishi mumkin."
                    : `❌ Siz allaqachon ${activeCity === 'urganch' ? "Urganch" : "Bog'ot"}dasiz. Narigi shaharni tanlang.`
            );
            if (destinationRef.current) {
                e.get("target").geometry.setCoordinates(destinationRef.current);
            }
            return;
        }

        setLocationError(null);
        setDestination(coords);
        if (ymapsRef.current && mapRef.current && pickupRef.current) {
            drawRoute(ymapsRef.current, mapRef.current, pickupRef.current, coords);
        }
    };

    // "✅ SHU YERGA BORAMAN" BOSILGANDA — jo'nash joyi tasdiqlanadi
    const confirmPickup = () => {
        if (!pickup) return;
        setLocationError(null);
        setPickupConfirmed(true);
    };

    // XARITAGA BOSILGANDA
    const onMapClick = (e: any) => {
        const coords = e.get("coords");

        // 1. Jo'nash joyini tanlash / tasdiqlashdan oldin o'zgartirish
        if (!pickup || !pickupConfirmed) {
            const city = detectCity(coords);
            if (!city) {
                setLocationError("Iltimos, jo'nash uchun Urganch yoki Bog'ot hududini tanlang.");
                return;
            }
            setLocationError(null);
            setPickup(coords);
            setActiveCity(city);
        }
        // 2. Borish joyini tanlash / ko'chirish (xaritaga bosib ham ko'chirish mumkin)
        else {
            const destCity = detectCity(coords);

            if (!destCity) {
                setLocationError("Borish manzili ham faqat Urganch yoki Bog'ot bo'lishi kerak.");
                return;
            }
            if (destCity === activeCity) {
                setLocationError(`❌ Siz allaqachon ${activeCity === 'urganch' ? "Urganch" : "Bog'ot"}dasiz. Narigi shaharni tanlang.`);
                return;
            }

            setLocationError(null);
            setDestination(coords);
            if (ymapsRef.current && mapRef.current) {
                drawRoute(ymapsRef.current, mapRef.current, pickup, coords);
            }
        }
    };

    const resetSelection = () => {
        setDestination(null);
        setRouteInfo(null);
        setLocationError(null);
        if (routeRef.current && mapRef.current) {
            mapRef.current.geoObjects.remove(routeRef.current);
            routeRef.current = null;
        }

        if (pickup && activeCity && mapRef.current) {
            const targetCenter = activeCity === "urganch" ? BOGOT_CENTER : URGANCH_CENTER;
            mapRef.current.setCenter(targetCenter, 10, { duration: 800 });
        }
    };

    // Jo'nash joyini o'zgartirish rejimiga qaytish (marker qoladi, yana surish mumkin)
    const editPickup = () => {
        setPickupConfirmed(false);
        setDestination(null);
        setRouteInfo(null);
        setLocationError(null);
        if (routeRef.current && mapRef.current) {
            mapRef.current.geoObjects.remove(routeRef.current);
            routeRef.current = null;
        }
        if (pickup && mapRef.current) {
            mapRef.current.setCenter(pickup, 14, { duration: 800 });
        }
    };

    return (
        <YMaps query={{ apikey: "e02566de-a548-47f4-ad84-de35f05d0ea9", lang: "ru_RU", load: "package.full" }} preload={true}>
            <div className="w-full h-screen relative bg-slate-100 overflow-hidden font-sans flex flex-col items-center justify-center">

                {!isMapLoaded && (
                    <div className="absolute inset-0 z-[200] bg-white flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-slate-500 font-medium">Xarita yuklanmoqda...</p>
                    </div>
                )}

                {/* YUQORI PANEL */}
                <div className="absolute top-4 left-4 right-4 z-50 flex flex-col gap-2">
                    <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg p-3 flex items-center gap-3 border border-gray-100 transition-all">
                        <div className="bg-gray-50 p-2 rounded-xl text-slate-500 shadow-sm border border-gray-100">
                            <ArrowLeft size={20} />
                        </div>
                        <div className="flex-1">
                            {!pickup ? (
                                <p className="text-sm font-bold text-slate-700">📍 Jo'nash joyini tanlang (Urganch yoki Bog'ot)</p>
                            ) : !pickupConfirmed ? (
                                <div>
                                    <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">
                                        Jo'nash joyi
                                    </p>
                                    <p className="text-sm font-bold text-slate-700">
                                        Yashil (A) markerni surib to'g'rilang, so'ng tasdiqlang
                                    </p>
                                </div>
                            ) : !destination ? (
                                <div>
                                    <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">
                                        Siz {activeCity === "urganch" ? "Urganch" : "Bog'ot"}dasiz
                                    </p>
                                    <p className="text-sm font-bold text-slate-700 truncate">
                                        🏁 {activeCity === "urganch" ? "Bog'ot" : "Urganch"}dan borish joyini tanlang
                                    </p>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Borish manzili</p>
                                        <p className="text-sm font-bold text-slate-700 truncate">Qizil (B) markerni surib aniqlashtiring</p>
                                    </div>
                                    <button onClick={resetSelection} className="bg-red-50 hover:bg-red-100 p-1.5 rounded-full text-red-500 transition">
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {locationError && (
                        <div className="bg-red-50/90 backdrop-blur border border-red-200 p-3 rounded-2xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-4">
                            <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs font-medium text-red-700 leading-snug">{locationError}</p>
                        </div>
                    )}

                    {/* Faol taksilar soni (buyurtma paneli ochiq bo'lmaganda) */}
                    {!destination && (
                        <div className="flex justify-center pointer-events-none">
                            <div className="bg-white/90 backdrop-blur px-4 py-1.5 rounded-full shadow-md border border-slate-200 flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${drivers.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                                <p className="text-[10px] font-black text-slate-700 uppercase">
                                    {drivers.length} ta taksi faol
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* JO'NASH JOYINI O'ZGARTIRISH TUGMASI (tasdiqlangandan keyin) */}
                {pickup && pickupConfirmed && !destination && (
                    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in zoom-in duration-300">
                        <button
                            onClick={editPickup}
                            className="bg-gray-800/90 backdrop-blur text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-xl flex items-center gap-2 hover:bg-gray-900 transition-colors"
                        >
                            Jo'nash joyini o'zgartirish <X size={14} />
                        </button>
                    </div>
                )}

                {/* "SHU YERGA BORAMAN" TASDIQLASH TUGMASI (marker surilayotgan bosqichda) */}
                {pickup && !pickupConfirmed && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <button
                            onClick={confirmPickup}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-4 rounded-2xl shadow-2xl shadow-blue-300/50 active:scale-95 transition-all flex items-center gap-2 text-sm tracking-tight"
                        >
                            ✅ Shu yerga boraman
                        </button>
                    </div>
                )}

                {/* --- XARITA --- */}
                <Map
                    state={{ center: mapCenter, zoom: 7, controls: [] }}
                    width="100%"
                    height="100%"
                    modules={["multiRouter.MultiRoute", "coordSystem.geo"]}
                    onClick={onMapClick}
                    onLoad={(ymaps) => {
                        ymapsRef.current = ymaps;
                        setIsMapLoaded(true);
                    }}
                    instanceRef={(map) => { mapRef.current = map; }}
                    options={{
                        suppressMapOpenBlock: true,
                        avoidFractionalZoom: false,
                        restrictMapArea: MAP_BOUNDS
                    }}
                >
                    {/* URGANCH CHEGARALARI (GEOJSON) */}
                    {urgenchGeoJSON && (
                        <Polygon
                            geometry={extractPolygonCoords(urgenchGeoJSON)}
                            options={{
                                fillColor: "#3B82F620", // Shaffof ko'k
                                strokeColor: "#3B82F6",
                                strokeWidth: 3,
                            }}
                        />
                    )}

                    {/* BOG'OT CHEGARALARI (GEOJSON) */}
                    {bagatGeoJSON && (
                        <Polygon
                            geometry={extractPolygonCoords(bagatGeoJSON)}
                            options={{
                                fillColor: "#F59E0B20", // Shaffof sariq
                                strokeColor: "#F59E0B",
                                strokeWidth: 3,
                            }}
                        />
                    )}

                    {/* FAOL TAKSILAR MARKERLARI */}
                    <Clusterer options={{ preset: "islands#invertedYellowClusterIcons" }}>
                        {drivers.map((d) => (
                            <Placemark
                                key={d.id}
                                geometry={[d.lastLat, d.lastLng]}
                                properties={{
                                    hintContent: `🚕 ${d.firstName}`,
                                    balloonContent: `🚕 <b>${d.firstName}</b><br/>${d.rating ? `⭐ ${d.rating} (${d.ratingCount} baho)` : "⭐ Hali baholanmagan"}${d.phone ? `<br/>📞 <a href="tel:${d.phone}">${d.phone}</a>` : ""}`,
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

                    {/* JORIY JOYLASHUV — kichik ko'k nuqta (doim ko'rinadi) */}
                    {currentLocation && (
                        <Placemark
                            geometry={currentLocation}
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

                    {/* JO'NASH (A) MARKERI */}
                    {pickup && (
                        <Placemark
                            geometry={pickup}
                            onDragEnd={onPickupDragEnd}
                            properties={{ hintContent: "Jo'nash joyi" }}
                            options={{
                                iconLayout: "default#image",
                                iconImageHref: PICKUP_MARKER,
                                iconImageSize: [48, 64],
                                // Tayoqning uchi (pastki markaz) nuqtaga qadaladi
                                iconImageOffset: [-24, -62],
                                // Tasdiqlanmaguncha bosib turib surish mumkin
                                draggable: !pickupConfirmed,
                                zIndex: 110,
                            }}
                        />
                    )}

                    {/* BORISH (B) MARKERI */}
                    {destination && (
                        <Placemark
                            geometry={destination}
                            onDragEnd={onDestinationDragEnd}
                            properties={{ hintContent: "Borish joyi" }}
                            options={{
                                iconLayout: "default#image",
                                iconImageHref: DESTINATION_MARKER,
                                iconImageSize: [48, 64],
                                // Tayoqning uchi (pastki markaz) nuqtaga qadaladi
                                iconImageOffset: [-24, -62],
                                draggable: true,
                                zIndex: 110,
                            }}
                        />
                    )}

                    <ZoomControl options={{ float: "right", position: { top: 200, right: 10 } } as any} />
                </Map>

                {/* --- BUYURTMA PANELI --- */}
                <div className={`absolute bottom-0 left-0 right-0 z-[100] transition-all duration-500 ease-in-out ${destination ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
                    <div className="bg-white rounded-t-[32px] shadow-[0_-15px_40px_rgba(0,0,0,0.1)] p-6 pb-8 border-t border-gray-100">
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5" />

                        <div className="flex items-center justify-between mb-5 bg-slate-50 rounded-2xl p-3 border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Route size={18} className="text-blue-500" />
                                <span className="text-sm font-bold">
                                    {routeInfo ? routeInfo.distance : "Hisoblanmoqda..."}
                                </span>
                            </div>
                            <div className="w-px h-6 bg-slate-200"></div>
                            <div className="flex items-center gap-2 text-slate-600">
                                <Clock size={18} className="text-yellow-600" />
                                <span className="text-sm font-bold">
                                    {routeInfo ? routeInfo.duration : "..."}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-yellow-100 p-2.5 rounded-xl">
                                    <MapPin size={24} className="text-yellow-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Qatnov Taksi</h2>
                                    <p className="text-slate-400 text-[11px] font-semibold">Urganch ↔ Bog'ot</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                                <button
                                    onClick={() => setPrice(p => Math.max(5000, p - 1000))}
                                    className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-lg font-bold text-slate-600 active:bg-gray-100"
                                >-</button>
                                <div className="text-center px-1">
                                    <span className="block text-[9px] text-gray-400 font-bold uppercase">Narx (so'm)</span>
                                    <span className="text-base font-black text-slate-800">{price.toLocaleString()}</span>
                                </div>
                                <button
                                    onClick={() => setPrice(p => p + 1000)}
                                    className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-lg font-bold text-slate-600 active:bg-gray-100"
                                >+</button>
                            </div>
                        </div>

                        <button
                            className="w-full bg-[#ffcc00] hover:bg-[#f5c400] text-black font-black py-4 rounded-2xl shadow-xl shadow-yellow-200/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base tracking-tight"
                            onClick={() => alert(`Sizning ${price.toLocaleString()} so'mlik buyurtmangiz yuborildi!`)}
                        >
                            BUYURTMA BERISH <ChevronRight size={18} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* --- JOYLASHUVGA QAYTISH TUGMASI --- */}
                {!destination && (
                    <button
                        onClick={getLocation}
                        disabled={isLocating}
                        className={`absolute bottom-10 right-4 z-50 bg-white p-4 rounded-full shadow-xl border border-gray-100 transition-all ${isLocating ? 'opacity-50 scale-95' : 'active:scale-90 hover:shadow-2xl'}`}
                    >
                        <Navigation
                            className={`text-blue-600 ${isLocating ? 'animate-pulse' : ''}`}
                            size={24}
                            fill={pickup ? "currentColor" : "none"}
                        />
                    </button>
                )}
            </div>
        </YMaps>
    );
}