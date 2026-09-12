import { useState } from "react";
import { Link, useNavigate } from "react-router";
import SiteHeader from "@/components/SiteHeader";
import { api } from "@/lib/api";

const LoginPage = () => {

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()

        setLoading(true)
        setError("")

        try {
            await api.post("/auth/login", { email, password })

            navigate('/dashboard', { replace: true })

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
        <div className="min-h-screen bg-background text-foreground">
            <SiteHeader />
            <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-muted/40 px-6 py-12">
                <div className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-xl ring-1 ring-foreground/10">
                    <h2 className="text-2xl font-bold text-center">Welcome back</h2>
                    <p className="mt-1 text-sm text-muted-foreground text-center">
                        Sign in to continue to your account
                    </p>

                    {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}

                    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                        <div>
                            <label className="text-sm font-medium" htmlFor="email">
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="you@school.edu"
                                className="mt-1.5 w-full rounded-lg px-3 py-2 text-sm ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
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
                                placeholder="At least 8 characters"
                                className="mt-1.5 w-full rounded-lg px-3 py-2 text-sm ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            disabled={loading}
                            className="mt-2 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/85 transition-colors disabled:opacity-50"
                        >
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>

                    <p className="mt-6 text-sm text-center text-muted-foreground">
                        Don't have an account?{" "}
                        <Link to="/register" className="font-semibold text-orange-600 hover:underline">
                            Register →
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    )
}

export default LoginPage;
