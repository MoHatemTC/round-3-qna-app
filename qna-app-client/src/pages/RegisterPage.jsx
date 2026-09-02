import { useState } from "react";

const RegisterPage = () => {

    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [role, setRole] = useState(null)
    // const [loading, setLoading] = useState(false)

    function handleSubmit(e) {
        e.preventDefault()
        console.log(
            'name: ' + name + " " +
            'email: ' + email + " " +
            'password: ' + password + " " +
            'role: ' + role
        )
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
                />
                <input
                    type="email"
                    placeholder="email"
                    className="p-2 border rounded my-2"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="password"
                    className="p-2 border rounded"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                    />
                    <label htmlFor="student">Student</label>
                </div>
                <button
                    className="cursor-pointer border rounded-full bg-blue-500 text-white w-30 py-1 inline-block mx-auto hover:bg-blue-600"
                >Submit</button>
            </form>

        </main>
    )
}

export default RegisterPage;