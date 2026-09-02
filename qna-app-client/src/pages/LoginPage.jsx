import { useState } from "react";

const LoginPage = () => {

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    // const [loading, setLoading] = useState(false)

    function handleSubmit(e) {
        e.preventDefault()
        console.log(
            'email: ' + email + " " +
            'password: ' + password
        )
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center">
            <h2 className="text-xl font-bold">Welcome back!</h2>
            <form
                onSubmit={handleSubmit}
                className="flex flex-col w-100 border border-gray rounded shadow-sm p-2 mt-5"
            >
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
                <button
                    className="mt-10 cursor-pointer border rounded-full bg-blue-500 text-white w-30 py-1 inline-block mx-auto hover:bg-blue-600"
                >Submit</button>
            </form>

        </main>
    )
}

export default LoginPage;