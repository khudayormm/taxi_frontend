"use client";

import { TUser } from "@/types/user-info";
import dynamic from "next/dynamic";
import { useMemo } from "react";

type Props = {
    user: TUser
}

export default function PassengerPage({ user }: Props) {
    // Xaritani faqat Client-side'da yuklash uchun ssr: false qilamiz
    const Map = useMemo(() => dynamic(
        () => import("@/components/maps/passenger/PassengerMap"), // Map faylingiz manzili
        {
            loading: () => <p>Xarita yuklanmoqda...</p>,
            ssr: false
        }
    ), []);

    return (
        <main className="h-screen w-full">
            <Map />
        </main>
    );
}