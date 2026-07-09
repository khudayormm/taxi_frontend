"use client"

import { TUser } from '@/types/user-info'
import dynamic from 'next/dynamic'
import React, { useMemo } from 'react'

// Yo'lovchi xaritada faol taksilarni va ularning bo'sh joylarini ko'radi.
// Manzil telefon orqali kelishiladi — xaritadan tanlash yo'q.
const PassengerLayout = ({ user }: { user: TUser }) => {
    const TaxisView = useMemo(() => dynamic(
        () => import("@/components/maps/passenger/TaxisViewMap"),
        { loading: () => <p className="p-4">Xarita yuklanmoqda...</p>, ssr: false }
    ), [])

    return (
        <main className="h-screen w-full">
            <TaxisView />
        </main>
    )
}

export default PassengerLayout
