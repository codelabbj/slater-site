// Transaction Types
export const TYPE_TRANS = [
  ["deposit", "Dépôt"],
  ["withdrawal", "Retrait"],
  ["disbursements", "Disbursements"],
  ["reward", "reward"],
] as const

// Transaction Status
export const TRANS_STATUS = [
  ["init_payment", "En entente"],
  ["accept", "Accept"],
  ["error", "Erreur"],
  ["pending", "Pendind"],
] as const

// Source Choices
export const SOURCE_CHOICE = [
  ["mobile", "Mobile"],
  ["web", "Web"],
  ["bot", "bot"]
] as const

// Network Choices
export const NETWORK_CHOICES = [
  ["mtn", "MTN"],
  ["moov", "MOOV"],
  ["card", "Cart"],
  ["sbin", "Celtis"],
  ["orange", "Orange"],
  ["wave", "wave"],
  ["togocom", "Togocom"],
  ["airtel", "Airtel"],
  ["mpesa", "Mpsesa"],
  ["afrimoney", "Afrimoney"],
] as const

// API Choices
export const API_CHOICES = [
  ["connect", "Slater Connect"],
] as const

// Type definitions for better type safety
export type TransactionType = typeof TYPE_TRANS[number][0]
export type TransactionStatus = typeof TRANS_STATUS[number][0]
export type SourceType = typeof SOURCE_CHOICE[number][0]
export type NetworkType = typeof NETWORK_CHOICES[number][0]
export type ApiType = typeof API_CHOICES[number][0]

// Helper functions to get display names
export const getTransactionTypeLabel = (type: TransactionType): string => {
  const found = TYPE_TRANS.find(([key]) => key === type)
  return found ? found[1] : type
}

export const getTransactionStatusLabel = (status: TransactionStatus): string => {
  const found = TRANS_STATUS.find(([key]) => key === status)
  return found ? found[1] : status
}

export const getSourceLabel = (source: SourceType): string => {
  const found = SOURCE_CHOICE.find(([key]) => key === source)
  return found ? found[1] : source
}

export const getNetworkLabel = (network: NetworkType): string => {
  const found = NETWORK_CHOICES.find(([key]) => key === network)
  return found ? found[1] : network
}

export const getApiLabel = (api: ApiType): string => {
  const found = API_CHOICES.find(([key]) => key === api)
  return found ? found[1] : api
}

// Constants for common values
export const TRANSACTION_TYPES = {
  DEPOSIT: "deposit" as const,
  WITHDRAWAL: "withdrawal" as const,
  DISBURSEMENTS: "disbursements" as const,
  REWARD: "reward" as const,
}

export const TRANSACTION_STATUSES = {
  INIT_PAYMENT: "init_payment" as const,
  ACCEPT: "accept" as const,
  ERROR: "error" as const,
  PENDING: "pending" as const,
}

export const SOURCES = {
  MOBILE: "mobile" as const,
  WEB: "web" as const,
  BOT: "bot" as const,
}

export const NETWORKS = {
  MTN: "mtn" as const,
  MOOV: "moov" as const,
  CARD: "card" as const,
  SBIN: "sbin" as const,
  ORANGE: "orange" as const,
  WAVE: "wave" as const,
  TOGOCOM: "togocom" as const,
  AIRTEL: "airtel" as const,
  MPESA: "mpesa" as const,
  AFRIMONEY: "afrimoney" as const,
}

export const APIS = {
  CONNECT: "connect" as const,
}
