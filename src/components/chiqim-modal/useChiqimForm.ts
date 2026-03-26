"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { createExpense } from "@/lib/api/expense/create-expense"
import { getCategories } from "@/lib/api/category/get-categories"

import {
    MAX_VALUE,
    amountSchema,
    type AmountFormData,
} from "./types"
import {
    formatSum,
    onlyDigits,
    clampDigitsToMax,
} from "./helpers"

interface UseChiqimFormProps {
    open: boolean
    onOpenChange: (v: boolean) => void
    amountData: number
    setAmount: (v: number) => void
}

export function useChiqimForm({
    open,
    onOpenChange,
    amountData,
    setAmount,
}: UseChiqimFormProps) {
    const [step, setStep] = useState<1 | 2>(1)

    const [digits, setDigits] = useState("")
    const [isFocused, setIsFocused] = useState(false)
    const [description, setDescription] = useState("")

    const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
    const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null)
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([])

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const {
        formState: { errors },
        setValue,
        reset,
    } = useForm<AmountFormData>({
        resolver: zodResolver(amountSchema),
        mode: "onChange",
        defaultValues: { amount: "" },
    })

    useEffect(() => {
        setValue("amount", formatSum(digits), { shouldValidate: true })
    }, [digits, setValue])

    useEffect(() => {
        getCategories("EXPENSE")
            .then((data) => { if (Array.isArray(data)) setCategories(data) })
            .catch(() => { })
    }, [])

    useEffect(() => {
        if (!open) {
            setStep(1)
            setDigits("")
            setDescription("")
            setIsFocused(false)
            setSelectedCategory(null)
            setSelectedCategoryName(null)
            setError(null)
            reset({ amount: "" })
        }
    }, [open, reset])

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDigits(clampDigitsToMax(onlyDigits(e.target.value), MAX_VALUE))
        setError(null)
    }

    const handleCategorySelect = (id: number) => {
        setSelectedCategory(id)
        setSelectedCategoryName(categories.find((c) => c.id === id)?.name ?? null)
    }

    const handleStep1Continue = () => {
        if (!digits || parseInt(digits, 10) <= 0) { setError("Miqdorni kiriting"); return }
        if (!selectedCategory) { setError("Turini tanlang"); return }
        setError(null)
        setStep(2)
    }

    const handleSubmit = async (isoDate: string) => {
        setLoading(true)
        setError(null)
        try {
            const amountNumber = parseInt(digits, 10)

            const result = await createExpense({
                amount: amountNumber,
                categoryId: selectedCategory!,
                description: description.trim() || undefined,
                date: isoDate,
            })

            if (result?.success === false) {
                setError((result as any)?.message ?? "Xatolik")
                return
            }

            setAmount(amountData - amountNumber)
            onOpenChange(false)
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "Xatolik"
            )
        } finally {
            setLoading(false)
        }
    }

    const formattedAmount = useMemo(() => formatSum(digits), [digits])

    return {
        step, setStep,
        digits,
        isFocused, setIsFocused,
        description, setDescription,
        selectedCategory,
        selectedCategoryName,
        loading,
        error, setError,
        formattedAmount,
        formErrors: errors,
        handleAmountChange,
        handleCategorySelect,
        handleStep1Continue,
        handleSubmit,
    }
}