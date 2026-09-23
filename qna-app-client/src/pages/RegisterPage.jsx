import { useState } from "react";
import { Link, useNavigate } from "react-router";
import AuthCard, { AuthMessage, authButtonClass, authInputClass } from "@/components/AuthCard";
import { api } from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";

const RegisterPage = () => {

    const navigate = useNavigate()

    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    async function handleSubmit(e) {
        e.preventDefault()

        setLoading(true)
        setError("")

        try {
            await api.post("/auth/register", { name, email, password })

            navigate('/verify-account', { state: { email } })

        } catch (error) {
            setError(error instanceof Error ? error.message : "Unable to create your account. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthCard title="Create an account" subtitle="Start free — no card required">
            <AuthMessage>{error}</AuthMessage>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <div>
                    <label className="text-sm font-medium" htmlFor="name">
                        Full name
                    </label>
                    <input
                        id="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Jane Smith"
                        className={authInputClass}
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
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="At least 8 characters"
                            className={`${authInputClass} pr-11`}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            maxLength={20}
                        />
                        <button type="button" className="absolute inset-y-0 right-0 px-3 text-muted-foreground" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                    </div>
                </div>
                <button disabled={loading} className={authButtonClass}>
                    {loading ? "Creating account..." : "Create account"}
                </button>
            </form>

            <p className="mt-6 text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-orange-600 hover:underline">
                    Sign in →
                </Link>
            </p>
        </AuthCard>
    )
}

export default RegisterPage;
