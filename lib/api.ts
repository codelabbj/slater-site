import axios from "axios"
import { toast } from "react-hot-toast"

// Normalize base URL from env so it always has protocol + trailing slash
const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL
const normalizedBaseUrl =
  rawBaseUrl
    ? (() => {
        let url = rawBaseUrl.trim()
        // If protocol is missing, assume https
        if (!/^https?:\/\//i.test(url)) {
          url = `https://${url}`
        }
        // Ensure trailing slash for safe string concatenation
        if (!url.endsWith("/")) {
          url += "/"
        }
        return url
      })()
    : undefined

if (process.env.NODE_ENV !== "production" && !normalizedBaseUrl) {
  // Helpful warning in dev when env is missing
  // eslint-disable-next-line no-console
  console.warn(
    "[API] NEXT_PUBLIC_BASE_URL is not defined. API calls will use relative URLs and may fail in production.",
  )
}

const api = axios.create({
  baseURL: normalizedBaseUrl,
  headers: {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  },
})

function detectLang(text: string) {
  const frenchWords = ["le", "la", "de", "pas", "pour", "avec", "est", "une", "des"]
  const score = frenchWords.filter((w) => text.toLowerCase().includes(w)).length
  return score > 1 ? "fr" : "en"
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  
  // Ensure fresh data with cache busting
  config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
  config.headers['Pragma'] = 'no-cache'
  config.headers['Expires'] = '0'
  
  // Add timestamp to prevent caching
  if (config.params) {
    config.params._t = Date.now()
  } else {
    config.params = { _t: Date.now() }
  }
  
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    // Handle network errors (no response from server)
    if (!error.response) {
      const networkErrorMsg = "Erreur de connexion. Vérifiez votre connexion internet et réessayez."
      // Only show toast for network errors if it's not a silent request
      if (!original?._silent) {
        toast.error(networkErrorMsg)
      }
      return Promise.reject(error)
    }

    const status = error.response.status

    // Handle specific status codes with default French messages
    let defaultErrorMsg = ""
    if (status >= 500) {
      // Server errors (500+)
      defaultErrorMsg = "Erreur serveur. Notre équipe technique a été notifiée. Veuillez réessayer plus tard."
    } else if (status === 404) {
      // Not found
      defaultErrorMsg = "Ressource introuvable. Vérifiez l'URL ou contactez le support si le problème persiste."
    } else if (status >= 400 && status < 500) {
      // Client errors (400-499) except 404 - use backend message if available
      defaultErrorMsg = ""
    } else {
      // Any other unrecognized status codes
      defaultErrorMsg = "Erreur inattendue. Veuillez réessayer ou contacter le support."
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem("refresh_token")
        const refreshUrl = `${normalizedBaseUrl ?? ""}auth/refresh`
        const res = await axios.post(refreshUrl, { refresh })
        const newToken = res.data.access
        localStorage.setItem("access_token", newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = "/login"
      }
    }

    // Skip showing toast for error_time_message - let page-level handlers show formatted message
    if (error.response?.data?.error_time_message) {
      return Promise.reject(error)
    }

    // If we have a default message for this status code, use it
    if (defaultErrorMsg && !original?._silent) {
      toast.error(defaultErrorMsg, { style: { direction: "ltr" } })
      return Promise.reject(error)
    }

    // For other cases, try to get backend message
    const backendMsg =
      error.response?.data?.details ||
      error.response?.data?.detail ||
      error.response?.data?.error ||
      error.response?.data?.message ||
      (typeof error.response?.data === "string" ? error.response.data : "Une erreur est survenue. Veuillez réessayer.")

    // Only show toast if not a silent request
    if (!original?._silent) {
      toast.error(backendMsg, { style: { direction: "ltr" } })
    }
    return Promise.reject(error)
  },
)

export default api
