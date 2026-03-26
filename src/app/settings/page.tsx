"use client"

import { Folder, PlusCircle, User } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { AddCategoryForm } from "@/components/category/add-category"
import CategoriesTable from "@/components/category/category-list"
import ProfileData from "@/components/profile/profile-data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const triggerClass =
    "w-full flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all " +
    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground " +
    "data-[state=active]:shadow-md " +
    "text-muted-foreground hover:text-foreground hover:bg-muted"

const allowedTabs = ["profile", "categories", "add-category"] as const
type TabValue = (typeof allowedTabs)[number]

const SettingsPage = () => {
    const router = useRouter()
    const searchParams = useSearchParams()

    const tg = typeof window !== "undefined" ? (window as any).Telegram?.WebApp : null

    // URL dan tabValue ni o'qiymiz
    const tabFromUrl = searchParams.get("tabValue")

    const initialTab = useMemo<TabValue>(() => {
        if (allowedTabs.includes(tabFromUrl as TabValue)) return tabFromUrl as TabValue
        return "profile"
    }, [tabFromUrl])

    const [tab, setTab] = useState<TabValue>(initialTab)

    // URL o'zgarsa -> tab ham o'zgarsin (router.push bilan kelganda shu ishlaydi)
    useEffect(() => {
        setTab(initialTab)
    }, [initialTab])

    // Telegram BackButton
    useEffect(() => {
        if (!tg) return

        tg.BackButton?.show()

        const handler = () => window.history.back()
        tg.onEvent("backButtonClicked", handler)

        return () => {
            tg.offEvent("backButtonClicked", handler)
            tg.BackButton?.hide()
        }
    }, [tg])

    return (
        <div className="w-full">
            <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)} className="gap-4">
                <TabsList className="w-full grid grid-cols-3 bg-background border-0 gap-2 mb-7">
                    <TabsTrigger value="profile" className={triggerClass}>
                        <User size={20} />
                        <span className="text-xs font-medium">Profile</span>
                    </TabsTrigger>

                    <TabsTrigger value="categories" className={triggerClass}>
                        <Folder size={20} />
                        <span className="text-xs font-medium">Kategoriyalar</span>
                    </TabsTrigger>

                    <TabsTrigger value="add-category" className={triggerClass}>
                        <PlusCircle size={20} />
                        <span className="text-xs font-medium">Kategoriya qo‘shish</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <ProfileData />
                </TabsContent>

                <TabsContent value="categories">
                    <CategoriesTable />
                </TabsContent>

                <TabsContent value="add-category">
                    <AddCategoryForm />
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default SettingsPage