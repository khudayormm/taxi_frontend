"use client"

import { TUser } from '@/types/user-info'
import React from 'react'
import DriverPage from '../pages/driver'

type Props = {
    user: TUser
}

const DriverLayout = ({ user }: Props) => {
    return <DriverPage user={user} />
}

export default DriverLayout