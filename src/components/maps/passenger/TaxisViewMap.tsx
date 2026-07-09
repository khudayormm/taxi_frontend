"use client";

import { YMaps, Map, Placemark, ZoomControl } from "@pbe/react-yandex-maps";
import { useState, useEffect, useCallback, useRef } from "react";
import { Navigation, List, X, Phone, Star, Users } from "lucide-react";
import api from "@/lib/api/api-config/api";

interface Driver {
    id: number;
    firstName: string;
    phone: string | null;
    lastLat: number;
    lastLng: number;
    seatsTotal: number;
    seatsFilled: number;
    seatsFree: number;
    rating: number | null;
    ratingCount: number;
}

const URGANCH_CENTER: [number, number] = [41.5502, 60.6316];

const toDataUri = (svg: string) =>
    `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;

// Taksi markeri: tepasida bo'sh joy sonini ko'rsatuvchi badge.
// To'lgan (0 joy) = yashil "tez ketadi", 1-2 joy = to'q sariq, ko'p joy = kulrang
const taxiMarker = (free: number, selected: boolean) => {
    const badgeColor = free === 0 ? "#16A34A" : free <= 2 ? "#F97316" : "#64748B";
    const badgeText = free === 0 ? "✓" : String(free);
    const ring = selected
        ? '<circle cx="26" cy="30" r="22" fill="none" stroke="#2563EB" stroke-width="3"/>'
        : "";
    return toDataUri(`
      <svg width="52" height="56" viewBox="0 0 52 56" xmlns="http://www.w3.org/2000/svg">
        ${ring}
        <circle cx="26" cy="30" r="17" fill="#ffcc00" stroke="white" stroke-width="3"/>
        <text x="26" y="36" font-size="17" text-anchor="middle">🚕</text>
        <circle cx="40" cy="12" r="11" fill="${badgeColor}" stroke="white" stroke-width="2.5"/>
        <text x="40" y="16.5" font-size="12" font-weight="bold" fill="white" text-anchor="middle" font-family="Arial">${badgeText}</text>
      </svg>
    `);
};

const CURRENT_LOCATION_MARKER = toDataUri(`
  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="#3B82F6" opacity="0.25"/>
    <circle cx="12" cy="12" r="7" fill="white"/>
    <circle cx="12" cy="12" r="5" fill="#2563EB"/>
  </svg>
`);

const seatLabel = (d: Driver) =>
    d.seatsFree === 0
        ? "🟢 To'ldi — tez ketadi!"
        : `🪑 ${d.seatsFree} ta joy bo'sh (${d.seatsFilled}/${d.seatsTotal})`;

// Yo'lovchi joriy taksilarni xaritada kuzatadi. Markerni yoki chapdagi
// ro'yxatdan tanlaganda taksi haqida ma'lumot karta chiqadi va telefon qilinadi.
export default function TaxisViewMap() {
    const [location, setLocation] = useState<[number, number] | null>(null);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [mapCenter] = useState<[number, number]>(URGANCH_CENTER);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const mapRef = useRef<any>(null);

    const selected = drivers.find((d) => d.id === selectedId) ?? null;

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

    // Faol taksilarni tez-tez yangilab turish (faollikdan chiqqan taksi
    // ~5 soniyada xaritadan yo'qoladi). Sahifa qayta fokuslanganda darhol.
    useEffect(() => {
        let stopped = false;
        const fetchDrivers = async () => {
            try {
                const response = await api.post('/user/active-drivers');
                if (!stopped && response?.data?.success) {
                    setDrivers(response.data.data);
                }
            } catch (error) {
                console.error("Taksilarni olishda xato:", error);
            }
        };

        fetchDrivers();
        const interval = setInterval(fetchDrivers, 5000);

        // Mini app qayta ochilganda/fokusga qaytganda darhol yangilash
        const onVisible = () => {
            if (document.visibilityState === "visible") fetchDrivers();
        };
        document.addEventListener("visibilitychange", onVisible);

        return () => {
            stopped = true;
            clearInterval(interval);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, []);

    // Taksini tanlash: xaritani marker yoniga suradi va kartani ochadi
    const selectDriver = (d: Driver) => {
        setSelectedId(d.id);
        setDrawerOpen(false);
        mapRef.current?.setCenter([d.lastLat, d.lastLng], 15, { duration: 400 });
    };

    return (
        <YMaps query={{ apikey: "e02566de-a548-47f4-ad84-de35f05d0ea9", lang: "ru_RU" }}>
            <div className="w-full h-screen relative bg-slate-100 overflow-hidden">

                {/* Yuqori panel */}
                <div className="absolute top-4 left-4 right-4 z-40 flex flex-col gap-2">
                    <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg p-3 border border-gray-100 pointer-events-none">
                        <p className="text-sm font-bold text-slate-700">🚕 Joriy faol taksilar</p>
                        <p className="text-[11px] text-slate-400 font-medium">
                            Belgidagi raqam — bo'sh joy soni. Taksiga bosib telefon qiling.
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] font-bold">
                            <span className="flex items-center gap-1">
                                <span className="w-3.5 h-3.5 rounded-full bg-green-600 text-white flex items-center justify-center text-[8px]">✓</span>
                                To'ldi (tez ketadi)
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-3.5 h-3.5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[8px]">1</span>
                                Kam joy
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-3.5 h-3.5 rounded-full bg-slate-500 text-white flex items-center justify-center text-[8px]">4</span>
                                Bo'sh
                            </span>
                        </div>
                    </div>

                    {/* Faol taksilar soni — bosilsa ro'yxat drawer ochiladi */}
                    <div className="flex justify-center">
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="bg-white/95 backdrop-blur px-4 py-1.5 rounded-full shadow-md border border-slate-200 flex items-center gap-2 active:scale-95 transition"
                        >
                            <List size={13} className="text-slate-500" />
                            <span className={`w-2 h-2 rounded-full ${drivers.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                            <p className="text-[10px] font-black text-slate-700 uppercase">
                                {drivers.length} ta taksi faol — ro'yxat
                            </p>
                        </button>
                    </div>
                </div>

                <Map
                    state={{ center: location ?? mapCenter, zoom: location ? 12 : 10, controls: [] }}
                    width="100%"
                    height="100%"
                    modules={["control.ZoomControl"]}
                    instanceRef={(ref) => { mapRef.current = ref; }}
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

                    {/* Faol taksilar — badge'da bo'sh joy soni, bosilsa karta chiqadi */}
                    {drivers.map((d) => (
                        <Placemark
                            key={d.id}
                            geometry={[d.lastLat, d.lastLng]}
                            onClick={() => selectDriver(d)}
                            properties={{
                                hintContent: `🚕 ${d.firstName} · ${d.seatsFree === 0 ? "to'ldi" : d.seatsFree + " joy"}`,
                            }}
                            options={{
                                iconLayout: "default#image",
                                iconImageHref: taxiMarker(d.seatsFree, d.id === selectedId),
                                iconImageSize: [52, 56],
                                iconImageOffset: [-26, -49],
                                zIndex: d.id === selectedId ? 200 : 100,
                            }}
                        />
                    ))}

                    <ZoomControl options={{ float: "right" } as any} />
                </Map>

                {/* Joylashuvga qaytish */}
                <button
                    onClick={locate}
                    className="absolute bottom-10 right-4 z-30 bg-white p-4 rounded-full shadow-xl border border-gray-100 active:scale-90 transition-all"
                >
                    <Navigation className="text-blue-600" size={24} fill={location ? "currentColor" : "none"} />
                </button>

                {/* TANLANGAN TAKSI KARTASI (pastki sheet) */}
                {selected && (
                    <div className="absolute bottom-0 left-0 right-0 z-40 animate-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-white rounded-t-3xl shadow-[0_-12px_35px_rgba(0,0,0,0.15)] p-5 pb-7 border-t border-gray-100">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-yellow-100 w-11 h-11 rounded-2xl flex items-center justify-center text-xl">🚕</div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 leading-tight">{selected.firstName}</h3>
                                        <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                            <Star size={12} className="text-yellow-500" fill="currentColor" />
                                            {selected.rating ? `${selected.rating} (${selected.ratingCount})` : "Hali baholanmagan"}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedId(null)} className="bg-slate-100 p-1.5 rounded-full text-slate-500 active:bg-slate-200">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className={`flex items-center gap-2 rounded-2xl p-3 mb-4 text-sm font-bold ${selected.seatsFree === 0 ? "bg-green-50 text-green-700" : "bg-slate-50 text-slate-700"}`}>
                                <Users size={18} />
                                {seatLabel(selected)}
                            </div>

                            {selected.phone ? (
                                <a
                                    href={`tel:${selected.phone}`}
                                    className="w-full bg-[#ffcc00] hover:bg-[#f5c400] text-black font-black py-4 rounded-2xl shadow-xl shadow-yellow-200/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base"
                                >
                                    <Phone size={18} fill="currentColor" /> {selected.phone}
                                </a>
                            ) : (
                                <p className="text-center text-sm text-slate-400 py-3">Telefon raqami mavjud emas</p>
                            )}
                        </div>
                    </div>
                )}

                {/* CHAP DRAWER — taksilar ro'yxati (raqamli) */}
                {drawerOpen && (
                    <div className="absolute inset-0 z-50">
                        <div className="absolute inset-0 bg-black/30" onClick={() => setDrawerOpen(false)} />
                        <div className="absolute top-0 left-0 bottom-0 w-[82%] max-w-xs bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
                            <div className="flex items-center justify-between p-4 border-b border-slate-100">
                                <h3 className="font-black text-slate-800">🚕 Faol taksilar ({drivers.length})</h3>
                                <button onClick={() => setDrawerOpen(false)} className="bg-slate-100 p-1.5 rounded-full text-slate-500 active:bg-slate-200">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                {drivers.length === 0 && (
                                    <p className="text-center text-sm text-slate-400 mt-8">Hozircha faol taksilar yo'q</p>
                                )}
                                {drivers.map((d, i) => (
                                    <button
                                        key={d.id}
                                        onClick={() => selectDriver(d)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left active:scale-[0.98] transition ${d.id === selectedId ? "border-blue-400 bg-blue-50" : "border-slate-100 bg-white"}`}
                                    >
                                        <span className="w-7 h-7 flex-shrink-0 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-black">
                                            {i + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 text-sm truncate">{d.firstName}</p>
                                            <p className="text-[11px] font-semibold text-slate-500 truncate">{seatLabel(d)}</p>
                                        </div>
                                        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${d.seatsFree === 0 ? "bg-green-100 text-green-700" : d.seatsFree <= 2 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"}`}>
                                            {d.seatsFree === 0 ? "TO'LDI" : `${d.seatsFree} JOY`}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </YMaps>
    );
}
