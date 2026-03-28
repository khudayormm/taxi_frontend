"use client";

import { AlertCircle, Loader2, Smartphone } from "lucide-react";
import React, { useEffect } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTelegram } from "@/hooks/use-telegram";
import api from "@/lib/api/api-config/api";
import { GetUserResponse, TUser } from "@/types/user-info";
import DriverLayout from "@/components/roles/driver-components/driver-layout";
import PassengerLayout from "@/components/roles/passenger-components/passenger-layout";

export default function TemplateLayout({ children }: { children: React.ReactNode }) {
    const { user, isReady, error } = useTelegram();
    const [iuser, setIUser] = React.useState<TUser | null>(null);
    const [meLoading, setMeLoading] = React.useState(true);
    const [meError, setMeError] = React.useState(null);


    // Amount state
    // Fetch amount (FAqat 1 marta)
    useEffect(() => {
        if (!isReady || !user) return;

        const fetchMe = async () => {
            try {
                const res = await api.post<GetUserResponse>("/user/info")
                setIUser(res.data.user)
            } catch (err: any) {
                setMeError(err?.response?.data?.message ?? err?.message ?? "Xatolik")
            } finally {
                setMeLoading(false)
            }
        }

        fetchMe()



        let mounted = true;

        return () => {
            mounted = false;
        };
    }, [isReady, user]);



    if (meLoading) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground text-lg">Yuklanmoqda...</p>
                </div>
            </main>
        );
    }

    if (meError) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-5 w-5" />

                    <AlertTitle>Xatolik</AlertTitle>

                    <AlertDescription>{meError}</AlertDescription>
                </Alert>
            </main>
        );
    }


    if (!iuser) return (
        <>
            <div>
                USER TANLANMAGAN
            </div>
        </>
    )

    if (!iuser.role) return (
        <>
            <div>
                ROLE TANLANMAGAN
            </div>
        </>
    )


    if (iuser.role === "DRIVER") return (
        <>
            <DriverLayout user={iuser} />
        </>
    )

    if (iuser.role === "PASSENGER") return (
        <>
            <PassengerLayout user={iuser} />
        </>
    )

    if (iuser.role === "ADMIN") return (
        <>
            ADMIN LAYOUT
        </>
    )

    return (
        <>

            {children}
        </>
    );
}
