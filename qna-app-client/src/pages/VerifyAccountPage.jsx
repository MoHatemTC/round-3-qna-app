import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { api } from "@/lib/api";

const VerifyAccountPage = () => {

  const [searchParams] = useSearchParams()
  const [token, setToken] = useState(searchParams.get("token") ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [verified, setVerified] = useState(false)

  const navigate = useNavigate()

  const { state } = useLocation()

  const email = state?.email

  async function handleSubmit(e) {
    e.preventDefault()

    setLoading(true)
    setError("")

    try {
      await api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      setVerified(true)

    } catch (error) {
      setError(error instanceof Error ? error.message : "This verification link is invalid or expired.")
    } finally {
      setLoading(false)
    }
  }

  if (!email && !token) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold">Verify Account!</h2>
        <p className="mt-4 text-sm">
          We don't know which email to verify. Please{" "}
          <Link to="/register" className="text-blue-500 underline">
            register
          </Link>{" "}
          again to get a fresh code.
        </p>
      </main>
    )
  }

  if (verified) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold">Email verified</h2>
        <p className="mt-4 text-sm text-muted-foreground">Your account is ready. Sign in to continue.</p>
        <button
          type="button"
          onClick={() => navigate("/login", { replace: true })}
          className="mt-6 rounded-full bg-blue-500 px-5 py-2 text-sm text-white hover:bg-blue-600"
        >
          Continue to sign in
        </button>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <h2 className="text-xl font-bold">Verify Account!</h2>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-100 border border-gray rounded shadow-sm p-2 mt-5"
      >
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <input
          type="text"
          placeholder="Enter token"
          className="p-2 border rounded my-2"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-10 cursor-pointer border rounded-full bg-blue-500 text-white w-30 py-1 inline-block mx-auto hover:bg-blue-600"
        >
          {loading ? "Loading..." : "Submit"}
        </button>
      </form>
      {email && <button type="button" className="mt-4 text-sm underline" onClick={async () => {
        try { await api.post("/auth/resend-verification", { email }); setError("A new verification email was sent.") }
        catch (resendError) { setError(resendError.message) }
      }}>Resend verification email</button>}

    </main>
  )
}

export default VerifyAccountPage;
