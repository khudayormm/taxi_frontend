"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { z } from "zod"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import { createCategory } from "@/lib/api/category/create-category"
import { toast } from "sonner"

const categoryTypeValues = ["EXPENSE", "INCOME"] as const
export type CategoryType = (typeof categoryTypeValues)[number]

export const categorySchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Kategoriya nomi talab etiladi")
        .min(3, "Nomi kamida 3 ta belgidan iborat bo‘lishi kerak")
        .max(32, "Nomi maksimal 32 ta belgi bo'lishi mumkin!"),
    description: z.string().max(156).trim().optional().or(z.literal("")),
    type: z
        .string()
        .min(1, "Kategoriya turi talab etiladi")
        .refine((v) => (categoryTypeValues as readonly string[]).includes(v), {
            message: "Kategoriya turi noto‘g‘ri",
        }),
})

export type CategoryFormData = z.infer<typeof categorySchema>

type Props = {
    defaultType?: CategoryType
    onSuccess?: () => void // ✅ kategoriya qo‘shilganda (dialog yopish + refetch)
    onBack?: () => void // ✅ "Orqaga" bosilganda (dialog yopish)
}

export function AddCategoryForm({ defaultType = "EXPENSE", onSuccess, onBack }: Props) {
    const [error, setError] = useState<any>(null)
    const [isPending, startTransition] = useTransition()

    const form = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema),
        defaultValues: { name: "", description: "", type: defaultType },
        mode: "onChange",
    })

    const isSubmitting = form.formState.isSubmitting
    const disabled = isSubmitting || isPending

    const selectedType = form.watch("type") as CategoryType
    const isExpense = selectedType === "EXPENSE"
    const typeLabel = isExpense ? "Chiqim" : "Kirim"

    const nameLabel = `${typeLabel} kategoriyasi nomi`
    const namePlaceholder = isExpense
        ? "Masalan: Oziq-ovqat, Transport, Ijara"
        : "Masalan: Oylik, Bonus, Sovg‘a"

    const chipLabels = useMemo(
        () => [
            { value: "EXPENSE" as const, label: "Chiqim kategoriyasi" },
            { value: "INCOME" as const, label: "Kirim kategoriyasi" },
        ],
        []
    )


    const nameRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
        const t = setTimeout(() => nameRef.current?.focus(), 50)
        return () => clearTimeout(t)
    }, [])


    const onSubmit = async (data: CategoryFormData) => {
        setError(null)

        startTransition(async () => {
            try {
                const result = await createCategory(data)

                if (result?.success === false) {
                    setError(result)
                    toast.error(result?.message || "Xatolik yuz berdi", { style: { color: "red" } })
                    return
                }

                toast.success("Kategoriya muvaffaqqiyatli qo'shildi!")

                // ✅ formni tozalaymiz, type esa defaultType bo‘lib qoladi
                form.reset({ name: "", description: "", type: defaultType })

                // ✅ dialog yopish + refetch (parent’da)
                onSuccess?.()
            } catch (e: any) {
                toast.error(e?.message ?? "Xatolik", { style: { color: "red" } })
            }
        })
    }

    return (
        <div className="w-full">
            <h2 className="text-center mb-2 text-muted-foreground uppercase">Kategoriya qo‘shish</h2>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-[96px]">
                    {/* TYPE */}
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem className="space-y-2">
                                <FormControl>
                                    <RadioGroup
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        disabled={disabled}
                                        className="flex gap-2"
                                    >
                                        {chipLabels.map((item) => {
                                            const isSelected = selectedType === item.value
                                            return (
                                                <label
                                                    key={item.value}
                                                    className={[
                                                        "flex items-center gap-2 px-4 py-2.5 rounded-full border cursor-pointer transition-all duration-200",
                                                        "select-none",
                                                        isSelected
                                                            ? "border-blue-500 bg-blue-500/15"
                                                            : "border-border bg-background hover:bg-muted/60 hover:border-muted-foreground/30",
                                                        "active:scale-[0.98]",
                                                        disabled ? "opacity-60 pointer-events-none" : "",
                                                    ].join(" ")}
                                                >
                                                    <RadioGroupItem
                                                        value={item.value}
                                                        id={`type-${item.value}`}
                                                        className="flex-shrink-0"
                                                    />
                                                    <span
                                                        className={[
                                                            "text-sm font-medium",
                                                            isSelected ? "text-foreground" : "text-muted-foreground",
                                                        ].join(" ")}
                                                    >
                                                        {item.label}
                                                    </span>
                                                </label>
                                            )
                                        })}
                                    </RadioGroup>
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* NAME */}
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => {
                            const hasError = !!form.formState.errors.name
                            return (
                                <FormItem className="space-y-2">
                                    <FormControl>
                                        <div
                                            className={[
                                                "relative rounded-xl border transition-all",
                                                "bg-muted/40",
                                                "px-3 pt-2 pb-2",
                                                hasError
                                                    ? "border-rose-500/60 ring-4 ring-rose-500/10"
                                                    : "border-border hover:border-blue-500/30",
                                            ].join(" ")}
                                        >
                                            <div
                                                className={[
                                                    "absolute left-4 top-2 text-[10px] font-semibold tracking-widest uppercase transition-colors",
                                                    hasError ? "text-rose-600" : "text-muted-foreground/70",
                                                ].join(" ")}
                                            >
                                                {nameLabel}
                                            </div>

                                            <Input
                                                {...field}
                                                ref={nameRef}
                                                autoComplete="off"
                                                disabled={disabled}
                                                placeholder={namePlaceholder}
                                                className={[
                                                    "mt-4 h-9 border-0 bg-transparent px-1 placeholder:text-gray-200",
                                                    "text-base font-semibold tracking-tight leading-none",
                                                    "focus-visible:ring-0 focus-visible:ring-offset-0",
                                                    hasError ? "text-rose-600" : "text-foreground",
                                                ].join(" ")}
                                            />

                                        </div>
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )
                        }}
                    />

                    {/* Optional: error debug */}
                    {error ? (
                        <div className="rounded-xl border bg-muted/30 p-3">
                            <pre className="text-[11px] whitespace-pre-wrap text-muted-foreground">
                                {JSON.stringify(error, null, 2)}
                            </pre>
                        </div>
                    ) : null}

                    {/* ACTIONS BAR */}
                    <div
                        className="
              fixed bottom-0 left-0 right-0
              bg-background/80 backdrop-blur
              border-t
              p-4
              space-y-2
              z-50
            "
                    >
                        <Button
                            type="submit"
                            disabled={disabled}
                            className="w-full h-11 text-base font-semibold rounded-lg bg-[#0088cc] hover:bg-[#0077b5] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {disabled ? "Saqlanmoqda..." : "Qo‘shish"}
                        </Button>

                        {/* ✅ Tozalash o‘rniga Orqaga */}
                        <Button
                            type="button"
                            onClick={() => onBack?.()}
                            disabled={disabled}
                            className="
                w-full gap-2 text-sm font-medium
                text-muted-foreground
                bg-muted/40
                hover:bg-muted/70
                active:bg-muted
                active:scale-[0.98]
                transition-all
                ring-1 ring-border
              "
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Orqaga
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
