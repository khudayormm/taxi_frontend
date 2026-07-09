"use client"

import { TUser } from '@/types/user-info'
import dynamic from 'next/dynamic'
import React, { useEffect, useMemo, useState } from 'react'
import PassengerPage from '../pages/passenger'

// Botdagi ikki tugma ikki xil rejim ochadi:
//   ?mode=order — borish manzilini belgilash (buyurtma oqimi)
//   ?mode=taxis — joriy taksilarni xaritadan ko'rish (faqat ko'rish)
const PassengerLayout = ({ user }: { user: TUser }) => {
    const [mode, setMode] = useState<string | null>(null)

    useEffect(() => {
        setMode(new URLSearchParams(window.location.search).get("mode") ?? "order")
    }, [])

    const TaxisView = useMemo(() => dynamic(
        () => import("@/components/maps/passenger/TaxisViewMap"),
        { loading: () => <p>Xarita yuklanmoqda...</p>, ssr: false }
    ), [])

    if (mode === null) return null

    if (mode === "taxis") {
        return (
            <main className="h-screen w-full">
                <TaxisView />
            </main>
        )
    }

    return <PassengerPage user={user} />
}

export default PassengerLayout
