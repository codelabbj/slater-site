import { redirect } from "next/navigation"

/**
 * Redirige /login → /loginv2 (page active avec Google Auth)
 */
export default function LoginRedirect() {
  redirect("/loginv2")
}
