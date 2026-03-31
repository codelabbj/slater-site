import { useCallback, useEffect, useRef, useState } from "react"
import type { Transaction } from "@/lib/types"
import { transactionApi } from "@/lib/api-client"

export function useLastPendingTransaction(options?: { pollIntervalMs?: number }) {
  const pollIntervalMs = options?.pollIntervalMs ?? 30_000

  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [actionType, setActionType] = useState<"cancel" | "finalize" | null>(null)

  const mountedRef = useRef(false)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const tx = await transactionApi.getLastPendingTransaction()
      setLastTransaction(tx)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    refresh()

    const interval = window.setInterval(() => {
      if (!mountedRef.current) return
      refresh()
    }, pollIntervalMs)

    return () => {
      mountedRef.current = false
      window.clearInterval(interval)
    }
  }, [pollIntervalMs, refresh])

  const cancel = useCallback(async (reference: string) => {
    setActionType("cancel")
    try {
      await transactionApi.cancelTransaction(reference)
      setLastTransaction(null)
    } finally {
      setActionType(null)
      refresh()
    }
  }, [refresh])

  const finalize = useCallback(async (reference: string) => {
    setActionType("finalize")
    try {
      const result = await transactionApi.finalizeTransactionUser(reference)
      setLastTransaction(null)
      return result
    } finally {
      setActionType(null)
      refresh()
    }
  }, [refresh])

  return {
    lastTransaction,
    isLoading,
    actionType,
    refresh,
    cancel,
    finalize,
  }
}

