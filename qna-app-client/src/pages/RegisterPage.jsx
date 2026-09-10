import { useState } from "react";
import { Link, useNavigate } from "react-router";
import SiteHeader from "@/components/SiteHeader";

const RegisterPage = () => {

    const navigate = useNavigate()

    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()

        setLoading(true)

        try {

            const res = await fetch('http://localhost:3000/auth/register', {
                method: "POST",
                body: JSON.stringify({
                    name,
                    email,
                    password
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            })

            const data = await res.json()

            if (!res.ok) {
                const detail = Array.isArray(data.message)
                    ? data.message.join("\n")
                    : data.message || data.error || 'ERROR'
                window.alert(detail)
                return
            }

            navigate('/verify-account', { state: { email } })

        } catch (error) {
            window.alert(error instanceof Error ? error.message : "REGISTER ERROR!")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <SiteHeader />
            <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-muted/40 px-6 py-12">
            <div className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-xl ring-1 ring-foreground/10">
                <h2 className="text-2xl font-bold text-center">Create an account</h2>
                <p className="mt-1 text-sm text-muted-foreground text-center">
                    Start free — no card required
                </p>

                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                    <div>
                        <label className="text-sm font-medium" htmlFor="name">
                            Full name
                        </label>
                        <input
                            id="name"
                            type="text"
                            placeholder="Jane Smith"
                            className="mt-1.5 w-full rounded-lg px-3 py-2 text-sm ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            minLength={2}
                        />
                    </div>
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
                            minLength={8}
                            maxLength={20}
                        />
                    </div>
                    <button
                        disabled={loading}
                        className="mt-2 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/85 transition-colors disabled:opacity-50"
                    >
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <p className="mt-6 text-sm text-center text-muted-foreground">
                    Already have an account?{" "}
                    <Link to="/login" className="font-semibold text-orange-600 hover:underline">
                        Sign in →
                    </Link>
                </p>
            </div>
            </main>
        </div>
    )
}

export default RegisterPage;
