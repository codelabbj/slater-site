import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a phone number by removing all non-digit characters (spaces, plus signs, etc.)
 * Example: "+229 01 57455419" -> "2290157455419"
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return phone
  // Remove all non-digit characters
  return phone.replace(/\D/g, '')
}

/**
 * Formats a phone number for display by adding "+" at the start if not present
 * Example: "2290157455419" -> "+2290157455419"
 */
export function formatPhoneNumberForDisplay(phone: string): string {
  if (!phone) return phone
  // If phone doesn't start with +, add it
  if (!phone.startsWith('+')) {
    return `+${phone}`
  }
  return phone
}

/**
 * Extracts and formats the error_time_message from API error response
 * Example: ["0 M:8 S"] -> "Veuillez patienter 0 minute(s) et 8 seconde(s) avant de réessayer"
 */
export function extractTimeErrorMessage(error: any): string | null {
  const errorTimeMessage = error?.response?.data?.error_time_message
  if (!errorTimeMessage || !Array.isArray(errorTimeMessage) || errorTimeMessage.length === 0) {
    return null
  }

  const timeString = errorTimeMessage[0]
  if (!timeString || typeof timeString !== 'string') {
    return null
  }

  // Parse format like "0 M:8 S" or "1 M:30 S"
  const match = timeString.match(/(\d+)\s*M[:\s]*(\d+)\s*S/)
  if (match) {
    const minutes = parseInt(match[1], 10)
    const seconds = parseInt(match[2], 10)

    const parts: string[] = []
    if (minutes > 0) {
      parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`)
    }
    if (seconds > 0) {
      parts.push(`${seconds} seconde${seconds > 1 ? 's' : ''}`)
    }

    if (parts.length > 0) {
      return `Veuillez patienter ${parts.join(' et ')} avant de réessayer.`
    }
  }

  // Fallback: return the original message if parsing fails
  return `Veuillez patienter ${timeString} avant de réessayer.`
}

/**
 * Handles field-specific errors from API responses and sets them on a form
 * @param error - The error object from the API call
 * @param setError - The setError function from react-hook-form
 * @param fieldMappings - Optional mapping of API field names to form field names
 */
export function handleFieldErrors(
  error: any,
  setError: (field: string, error: { type: string; message: string }) => void,
  fieldMappings: Record<string, string> = {}
) {
  if (!error.response?.data || typeof error.response.data !== 'object') {
    return
  }

  const fieldErrors = error.response.data

  // Common field mappings (API field name -> form field name)
  const defaultMappings = {
    email_or_phone: 'email_or_phone',
    email: 'email',
    phone: 'phone',
    first_name: 'first_name',
    last_name: 'last_name',
    password: 'password',
    re_password: 're_password',
    confirm_new_password: 'confirm_new_password',
    new_password: 'new_password',
    old_password: 'old_password',
    referral_code: 'referral_code',
    otp: 'otp',
    ...fieldMappings
  }

  // Handle field-specific errors
  Object.entries(defaultMappings).forEach(([apiField, formField]) => {
    if (fieldErrors[apiField] && Array.isArray(fieldErrors[apiField])) {
      setError(formField, {
        type: "server",
        message: fieldErrors[apiField][0]
      })
    }
  })

  // Handle non-field errors (like "Invalid credentials", "User with this email already exists")
  if (fieldErrors.non_field_errors && Array.isArray(fieldErrors.non_field_errors)) {
    // Set the error on the first field of the form
    const firstField = Object.keys(defaultMappings)[0] || 'email'
    setError(firstField, {
      type: "server",
      message: fieldErrors.non_field_errors[0]
    })
  }

  // Handle detail errors
  if (fieldErrors.detail && typeof fieldErrors.detail === 'string') {
    const firstField = Object.keys(defaultMappings)[0] || 'email'
    setError(firstField, {
      type: "server",
      message: fieldErrors.detail
    })
  }
}

/**
 * Formats a date string using localized format (fr-FR)
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}
