"use client"

import { User, Folder, PlusCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect } from "react"
import YearData from "@/components/chart-page/YearData"
import MonthData from "@/components/chart-page/MonthData"
import WeekData from "@/components/chart-page/WeekData"

const triggerClass =
    "w-full flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all " +
    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground " +
    "data-[state=active]:shadow-md " +
    "text-muted-foreground hover:text-foreground hover:bg-muted"

const ChartPage = () => {
    const tg = window.Telegram?.WebApp;

    useEffect(() => {
        if (!tg) return;

        (tg as any).BackButton?.show();

        const handler = () => {
            window.history.back(); // yoki router.back()
        };

        (tg as any).onEvent("backButtonClicked", handler);

        return () => {
            (tg as any).offEvent("backButtonClicked", handler);
            (tg as any).BackButton?.hide();
        };
    }, []);


    return (
        <div className="w-full">
            <Tabs defaultValue="profile">
                <TabsList className="w-full grid grid-cols-3 bg-background border-0 p-2 gap-2 mb-2">
                    <TabsTrigger value="profile" className={triggerClass}>
                        <span className="text-xs font-medium">
                            HAFTALIK
                        </span>
                    </TabsTrigger>

                    <TabsTrigger value="categories" className={triggerClass}>
                        <span className="text-xs font-medium">
                            OYLIK
                        </span>
                    </TabsTrigger>

                    <TabsTrigger value="add-category" className={triggerClass}>
                        <span className="text-xs font-medium">
                            YILLIK
                        </span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <div>
                        <WeekData />
                    </div>
                </TabsContent>

                <TabsContent value="categories">
                    <div>
                        <MonthData />
                    </div>
                </TabsContent>

                <TabsContent value="add-category">
                    <div>
                        <YearData />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default ChartPage
