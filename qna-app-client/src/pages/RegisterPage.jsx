import { useState } from "react";
import { Link, useNavigate } from "react-router";

const RegisterPage = () => {

    const navigate = useNavigate()

    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [role, setRole] = useState(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()

        if (!role) {
            window.alert("Please select a role (Admin or Student).")
            return
        }

        setLoading(true)

        try {

            const res = await fetch('http://localhost:3000/auth/register', {
                method: "POST",
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    role
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
        <main className="min-h-screen flex flex-col items-center justify-center">
            <h2 className="text-xl font-bold">Create a new account</h2>
            <form
                onSubmit={handleSubmit}
                className="flex flex-col w-100 border border-gray rounded shadow-sm p-2 mt-5"
            >
                <input
                    type="text"
                    placeholder="name"
                    className="p-2 border rounded"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                />
                <input
                    type="email"
                    placeholder="email"
                    className="p-2 border rounded my-2"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="password"
                    className="p-2 border rounded"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    maxLength={20}
                />
                <label className="mt-3">Role</label>
                <div>
                    <input
                        type="radio"
                        name="role"
                        id="admin"
                        value="admin"
                        checked={role === "admin"}
                        onChange={(e) => setRole(e.target.value)}
                        required
                    />
                    <label htmlFor="admin">Admin</label>
                </div>
                <div>
                    <input
                        type="radio"
                        name="role"
                        id="student"
                        value="student"
                        checked={role === "student"}
                        onChange={(e) => setRole(e.target.value)}
                        required
                    />
                    <label htmlFor="student">Student</label>
                </div>
                <button
                    disabled={loading ? true : false}
                    className="cursor-pointer border rounded-full bg-blue-500 text-white w-30 py-1 inline-block mx-auto hover:bg-blue-600"
                >
                    {
                        loading ? "Loading..." : "Submit"
                    }
                </button>
            </form>

            <p className="mt-4 text-sm">
                Already have an account?{" "}
                <Link to="/login" className="text-blue-500 underline">
                    Sign in
                </Link>
            </p>

        </main>
    )
}

export default RegisterPage;
