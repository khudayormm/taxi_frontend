"use client";

import {
    APIProvider,
    Map,
    AdvancedMarker,
    Pin,
    ControlPosition,
    MapControl
} from "@vis.gl/react-google-maps";
import { useState, useEffect } from "react";

export default function GoogleMapComponent({ role }: { role: string }) {
    const [position, setPosition] = useState({ lat: 41.2995, lng: 69.2401 });
    // mapTypeId: 'roadmap', 'satellite', 'hybrid', 'terrain'
    const [mapType, setMapType] = useState<string>("roadmap");

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            });
        }
    }, []);

    return (
        <APIProvider apiKey={"AIzaSyA5Lt3E5gYb-lfogvaSpCrvCpocLqHwNOI"}>
            <div className="w-full h-screen relative">
                <Map
                    defaultCenter={position}
                    defaultZoom={14}
                    mapId={"DEMO_MAP_ID"} // Google Cloud'da yaratilgan Map ID
                    mapTypeId={mapType}
                    disableDefaultUI={false} // Standart Google tugmalarini ko'rsatish
                >
                    {/* O'zimizning turgan joyimiz */}
                    <AdvancedMarker position={position}>
                        <Pin background={"#FBBC04"} glyphColor={"#000"} borderColor={"#000"} />
                    </AdvancedMarker>

                    {/* Maxsus rejim almashtirgich tugmasi (Xarita ustida) */}
                    <MapControl position={ControlPosition.TOP_LEFT}>
                        <div className="m-2 flex gap-1">
                            <button
                                onClick={() => setMapType("roadmap")}
                                className={`px-3 py-1 text-xs rounded shadow ${mapType === 'roadmap' ? 'bg-blue-600 text-white' : 'bg-white text-black'}`}
                            >
                                Xarita
                            </button>
                            <button
                                onClick={() => setMapType("satellite")}
                                className={`px-3 py-1 text-xs rounded shadow ${mapType === 'satellite' ? 'bg-blue-600 text-white' : 'bg-white text-black'}`}
                            >
                                Sputnik
                            </button>
                        </div>
                    </MapControl>
                </Map>

                {/* UI Pastki tugma */}
                <div className="absolute bottom-10 left-0 right-0 z-50 flex justify-center px-4">
                    <button className="w-full max-w-xs bg-white text-black font-bold py-4 rounded-2xl shadow-2xl border border-gray-200 active:scale-95 transition">
                        {role === "PASSENGER" ? "GOOGLE ORQALI CHAQIRISH" : "BUYURTMALAR"}
                    </button>
                </div>
            </div>
        </APIProvider>
    );
}