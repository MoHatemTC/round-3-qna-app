import { useState } from "react";
import { Link, useNavigate } from "react-router";
import AuthCard, { AuthMessage, authButtonClass, authInputClass } from "@/components/AuthCard";
import { api } from "@/lib/api";
import { dashboardPathFor, useSession } from "@/context/session";

const LoginPage = () => {

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const navigate = useNavigate()
    const { refresh } = useSession()

    async function handleSubmit(e) {
        e.preventDefault()

        setLoading(true)
        setError("")

        try {
            await api.post("/auth/login", { email, password })
            const user = await refresh()
            navigate(dashboardPathFor(user), { replace: true })

        } catch (error) {

            if (error.message === 'Please verify your account' || error.message === 'UNVERIFIED_ACCOUNT') {
                navigate('/verify-account', { state: { email: email } });
                return;
            }

            setError(error.message || "Unable to sign in. Please try again.");
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthCard title="Welcome back" subtitle="Sign in to continue to your account">
            <AuthMessage>{error}</AuthMessage>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <div>
                    <label className="text-sm font-medium" htmlFor="email">
                        Email address
                    </label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@school.edu"
                        className={authInputClass}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="text-sm font-medium" htmlFor="password">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="At least 8 characters"
                        className={authInputClass}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button disabled={loading} className={authButtonClass}>
                    {loading ? "Signing in..." : "Sign in"}
                </button>
            </form>

            <p className="mt-6 text-sm text-center text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/register" className="font-semibold text-orange-600 hover:underline">
                    Register →
                </Link>
            </p>
        </AuthCard>
    )
}

export default LoginPage;
