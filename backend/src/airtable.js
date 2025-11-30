import axios from "axios"

const API = "https://api.airtable.com/v0"

export function authUrl() {
  const p = new URLSearchParams({
    client_id: process.env.AIR_CLIENT_ID,
    redirect_uri: process.env.AIR_REDIRECT_URL,
    response_type: "code"
  })
  return `https://airtable.com/oauth2/v1/authorize?${p.toString()}`
}

export async function tokenByCode(code) {
  const r = await axios.post(
    "https://airtable.com/oauth2/v1/token",
    new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.AIR_CLIENT_ID,
      client_secret: process.env.AIR_CLIENT_SECRET,
      redirect_uri: process.env.AIR_REDIRECT_URL,
      code
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  )
  return r.data
}

export async function whoami(tok) {
  const r = await axios.get(`${API}/meta/whoami`, {
    headers: { Authorization: `Bearer ${tok}` }
  })
  return r.data
}

export async function bases(tok) {
  const r = await axios.get(`${API}/meta/bases`, {
    headers: { Authorization: `Bearer ${tok}` }
  })
  return r.data.bases || []
}

export async function tables(tok, baseId) {
  const r = await axios.get(`${API}/meta/bases/${baseId}/tables`, {
    headers: { Authorization: `Bearer ${tok}` }
  })
  return r.data.tables || []
}

export async function createRec(tok, baseId, tableName, fields) {
  const r = await axios.post(
    `${API}/${baseId}/${encodeURIComponent(tableName)}`,
    { fields },
    { headers: { Authorization: `Bearer ${tok}` } }
  )
  return r.data
}

