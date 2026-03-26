"use client"

import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CategoriesListTable from "./categories-list-table"

const CategoriesTable = () => {
    return (
        <div className="w-full pt-4">
            <Tabs defaultValue="INCOME" className="gap-4">
                <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger
                        value="INCOME"
                        className="w-full flex items-center justify-center gap-2"
                    >
                        <ArrowDownToLine className="size-4" />
                        Kirim
                    </TabsTrigger>

                    <TabsTrigger
                        value="EXPENSE"
                        className="w-full flex items-center justify-center gap-2"
                    >
                        <ArrowUpFromLine className="size-4" />
                        Chiqim
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="INCOME">
                    <CategoriesListTable type="INCOME" />
                </TabsContent>

                <TabsContent value="EXPENSE">
                    <CategoriesListTable type="EXPENSE" />
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default CategoriesTable
