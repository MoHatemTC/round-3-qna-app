import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { CircleCheck, MailCheck, MailQuestion } from "lucide-react";
import AuthCard, { AuthMessage, authButtonClass, authInputClass } from "@/components/AuthCard";
import { api } from "@/lib/api";

const RESEND_COOLDOWN_SECONDS = 60

const VerifyAccountPage = () => {

  const [searchParams] = useSearchParams()
  const [token, setToken] = useState(searchParams.get("token") ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [verified, setVerified] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const navigate = useNavigate()

  const { state } = useLocation()

  const email = state?.email

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function handleSubmit(e) {
    e.preventDefault()

    setLoading(true)
    setError("")
    setNotice("")

    try {
      await api.get(`/auth/verify-email?token=${encodeURIComponent(token.trim())}`)
      setVerified(true)

    } catch (error) {
      setError(error instanceof Error ? error.message : "This verification code is invalid or expired.")
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setError("")
    setNotice("")

    try {
      await api.post("/auth/resend-verification", { email })
      setNotice("A new verification code was sent to your inbox.")
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (resendError) {
      setError(resendError.message)
    } finally {
      setResending(false)
    }
  }

  if (!email && !token) {
    return (
      <AuthCard
        icon={MailQuestion}
        title="Verify your account"
        subtitle="We don't know which email to verify yet."
      >
        <p className="mt-6 text-sm text-center text-muted-foreground">
          Sign in with your account to get a fresh code, or create a new account.
        </p>
        <Link to="/login" className={`${authButtonClass} mt-6 block text-center`}>
          Go to sign in
        </Link>
        <p className="mt-6 text-sm text-center text-muted-foreground">
          New here?{" "}
          <Link to="/register" className="font-semibold text-orange-600 hover:underline">
            Register →
          </Link>
        </p>
      </AuthCard>
    )
  }

  if (verified) {
    return (
      <AuthCard
        icon={CircleCheck}
        title="Email verified"
        subtitle="Your account is ready. Sign in to continue."
      >
        <button
          type="button"
          onClick={() => navigate("/login", { replace: true })}
          className={`${authButtonClass} mt-6`}
        >
          Continue to sign in
        </button>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      icon={MailCheck}
      title="Verify your account"
      subtitle={
        email ? (
          <>
            We sent a 6-digit code to <span className="font-semibold text-foreground">{email}</span>
          </>
        ) : (
          "Enter the verification code from your email"
        )
      }
    >
      <AuthMessage>{error}</AuthMessage>
      <AuthMessage tone="success">{notice}</AuthMessage>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium" htmlFor="token">
            Verification code
          </label>
          <input
            id="token"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            className={`${authInputClass} text-center font-mono text-lg tracking-[0.4em]`}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? "Verifying..." : "Verify account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-center text-muted-foreground">
        {email ? (
          <>
            Didn't get the code?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="font-semibold text-orange-600 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
            >
              {resending ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend →"}
            </button>
          </>
        ) : (
          <>
            Already verified?{" "}
            <Link to="/login" className="font-semibold text-orange-600 hover:underline">
              Sign in →
            </Link>
          </>
        )}
      </p>
    </AuthCard>
  )
}

export default VerifyAccountPage;
