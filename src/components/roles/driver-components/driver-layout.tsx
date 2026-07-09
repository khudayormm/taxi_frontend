"use client"

import { TUser } from '@/types/user-info'
import React from 'react'
import DriverPage from '../pages/driver'

type Props = {
    user: TUser
}

const DriverLayout = ({ user }: Props) => {
    return (
        <>
            <div className='py-2 text-center'>
                <p className="text-center text-xs font-bold">Siz xaritada ko'rib turgan belgilar bular hozirda taxi qidirayotgan yo'lovchilar. Siz yolovchilarga ko'rinyapsiz. Agar yo'lovchi sizni tanlasa telefon qiladi kuting...</p>
            </div>
            <DriverPage user={user} />
        </>
    )
}

export default DriverLayout