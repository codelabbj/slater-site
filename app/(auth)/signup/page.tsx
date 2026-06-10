import { redirect } from "next/navigation"

/**
 * Redirige /signup → /registerv2 (page active avec Google Auth)
 */
export default function SignupRedirect() {
  redirect("/registerv2")
}
