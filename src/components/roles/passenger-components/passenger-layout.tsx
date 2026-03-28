"use client"

import { TUser } from '@/types/user-info'
import React from 'react'
import PassengerPage from '../pages/passenger'

const PassengerLayout = ({ user }: { user: TUser }) => {
    return (
        <>
            <p>YOLOVCHI LAYOUT</p>

            <PassengerPage user={user} />
        </>
    )
}

export default PassengerLayout