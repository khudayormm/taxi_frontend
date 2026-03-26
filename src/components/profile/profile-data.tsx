"use client"

import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import KirimDataList from "./kirim-data"
import ChiqimDataList from "./chiqim-data"

const ProfileData = () => {
    return (
        <div className="w-full py-4">
            <Tabs defaultValue="income" className="gap-4">
                <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger
                        value="income"
                        className="
      w-full flex items-center justify-center gap-2
      text-green-300
      data-[state=active]:text-green-400
      data-[state=active]:shadow-sm
    "
                    >
                        <ArrowDownToLine className="size-4" />
                        KIRIMLAR
                    </TabsTrigger>

                    <TabsTrigger
                        value="expense"
                        className="
      w-full flex items-center justify-center gap-2
 3000
      data-[state=active]:text-red-400
      data-[state=active]:shadow-sm
    "
                    >
                        <ArrowUpFromLine className="size-4" />
                        CHIQIMLAR
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="income" className="w-full grid place-items-center">
                    <div className="w-full h-full">
                        <KirimDataList />
                    </div>
                </TabsContent>

                <TabsContent value="expense" className="w-full grid place-items-center">
                    <div className="w-full h-full">
                        <ChiqimDataList />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default ProfileData
