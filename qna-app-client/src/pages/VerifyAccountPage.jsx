import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

const VerifyAccountPage = () => {

  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const { state } = useLocation()

  const email = state?.email

  async function handleSubmit(e) {
    e.preventDefault()

    setLoading(true)

    try {
      const res = await fetch(`http://localhost:3000/auth/verify-email`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          email,
          token
        }),
        headers: {
          "Content-Type": "application/json"
        }
      })

      const data = await res.json()

      if (!res.ok) {
        const detail = Array.isArray(data.message)
          ? data.message.join("\n")
          : data.message || data.error || "Error"
        window.alert(detail)
        return
      }

      window.alert(data.message || "Account verified, please try to login")

      navigate('/login', { replace: true })

    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Error while fetching")
    } finally {
      setLoading(false)
    }
  }

  if (!email) {
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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <h2 className="text-xl font-bold">Verify Account!</h2>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-100 border border-gray rounded shadow-sm p-2 mt-5"
      >
        <input
          type="text"
          placeholder="Enter token"
          className="p-2 border rounded my-2"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
        />
        <button
          className="mt-10 cursor-pointer border rounded-full bg-blue-500 text-white w-30 py-1 inline-block mx-auto hover:bg-blue-600"
        >
          {loading ? "Loading..." : "Submit"}
        </button>
      </form>

    </main>
  )
}

export default VerifyAccountPage;
