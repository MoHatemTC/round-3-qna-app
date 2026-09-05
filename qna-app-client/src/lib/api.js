const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000"

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  })

  const isJson = res.headers.get("content-type")?.includes("application/json")
  const body = isJson ? await res.json() : null

  if (!res.ok) {
    const error = new Error(
      Array.isArray(body?.message) ? body.message.join(", ") : body?.message ?? res.statusText
    )
    error.status = res.status
    error.details = Array.isArray(body?.message) ? body.message : null
    throw error
  }

  return body
}

export const api = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: "POST", body: JSON.stringify(data) }),
  put: (path, data) => request(path, { method: "PUT", body: JSON.stringify(data) }),
  delete: (path) => request(path, { method: "DELETE" }),
}
