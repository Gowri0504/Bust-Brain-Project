export const API = import.meta.env.VITE_API_URL || "http://localhost:4000"

export async function jget(url) {
  const r = await fetch(url, { credentials: "include" })
  return r.json()
}

export async function jpost(url, body) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: "include" })
  return r.json()
}

