import React, { useEffect, useMemo, useState } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link } from "react-router-dom"

const API = import.meta.env.VITE_API_URL || "http://localhost:4000"

function Login() {
  return (
    <div style={{ padding: 20 }}>
      <h3>Login</h3>
      <a href={`${API}/auth/airtable/login`}>Login with Airtable</a>
    </div>
  )
}

async function jget(url) {
  const r = await fetch(url, { credentials: "include" })
  return r.json()
}

async function jpost(url, body) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: "include" })
  return r.json()
}

function Builder() {
  const [bs, setBs] = useState([])
  const [bid, setBid] = useState("")
  const [ts, setTs] = useState([])
  const [tid, setTid] = useState("")
  const [tname, setTname] = useState("")
  const [fields, setFields] = useState([])
  const [pick, setPick] = useState([])
  const [lbl, setLbl] = useState({})
  const [req, setReq] = useState({})
  const [rules, setRules] = useState({})
  const nav = useNavigate()

  useEffect(() => {
    jget(`${API}/bases`).then(setBs)
  }, [])

  useEffect(() => {
    if (!bid) return
    jget(`${API}/bases/${bid}/tables`).then(x => {
      setTs(x)
    })
  }, [bid])

  useEffect(() => {
    if (!tid) return
    const t = ts.find(x => x.id === tid)
    if (!t) return
    setTname(t.name)
    setFields(t.fields)
  }, [tid, ts])

  function toggle(f) {
    setPick(p => (p.includes(f.id) ? p.filter(x => x !== f.id) : [...p, f.id]))
  }

  async function save() {
    const qs = pick
      .map(fid => {
        const f = fields.find(x => x.id === fid)
        if (!f) return null
        const type = f.type
        if (!new Set(["singleLineText", "multilineText", "singleSelect", "multipleSelects", "multipleAttachments"]).has(type)) return null
        const key = f.name.replace(/\s+/g, "_").toLowerCase()
        const label = lbl[f.id] || f.name
        const r = rules[f.id] || null
        const o = f.options?.choices?.map(c => c.name) || []
        return { key, fieldId: f.id, label, type, req: !!req[f.id], opts: o, rules: r }
      })
      .filter(Boolean)
    const res = await jpost(`${API}/forms`, { baseId: bid, tableId: tid, tableName: tname, qs })
    if (res.id) nav(`/form/${res.id}`)
  }

  return (
    <div style={{ padding: 20 }}>
      <h3>Form Builder</h3>
      <div>
        <label>Base</label>
        <select value={bid} onChange={e => setBid(e.target.value)}>
          <option value="">Select</option>
          {bs.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>
      {bid && (
        <div>
          <label>Table</label>
          <select value={tid} onChange={e => setTid(e.target.value)}>
            <option value="">Select</option>
            {ts.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}
      {tid && (
        <div>
          <h4>Fields</h4>
          {fields.map(f => (
            <div key={f.id} style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
              <input type="checkbox" checked={pick.includes(f.id)} onChange={() => toggle(f)} />
              <span style={{ marginLeft: 8 }}>{f.name} ({f.type})</span>
              <input style={{ marginLeft: 8 }} placeholder="label" value={lbl[f.id] || ""} onChange={e => setLbl({ ...lbl, [f.id]: e.target.value })} />
              <label style={{ marginLeft: 8 }}>
                req
                <input type="checkbox" checked={!!req[f.id]} onChange={e => setReq({ ...req, [f.id]: e.target.checked })} />
              </label>
              <input style={{ marginLeft: 8, width: 380 }} placeholder='rules json' value={rules[f.id] ? JSON.stringify(rules[f.id]) : ""} onChange={e => {
                try { setRules({ ...rules, [f.id]: JSON.parse(e.target.value) }) } catch { setRules({ ...rules, [f.id]: null }) }
              }} />
            </div>
          ))}
          <button onClick={save}>Save</button>
        </div>
      )}
      <div style={{ marginTop: 20 }}>
        <Link to="/">Home</Link>
      </div>
    </div>
  )
}

function useForm(id) {
  const [f, setF] = useState(null)
  useEffect(() => { jget(`${API}/forms/${id}`).then(setF) }, [id])
  return f
}

function ssq(rules, ans) {
  if (!rules) return true
  const cs = rules.conditions || []
  if (!cs.length) return true
  const f = rules.logic === "OR"
  let ok = f ? false : true
  for (const c of cs) {
    const v = ans?.[c.questionKey]
    let hit = false
    if (c.operator === "equals") hit = v === c.value
    else if (c.operator === "notEquals") hit = v !== c.value
    else if (c.operator === "contains") hit = Array.isArray(v) ? v.includes(c.value) : (typeof v === "string" ? (v || "").includes(c.value) : false)
    if (f) ok = ok || hit
    else ok = ok && hit
  }
  return ok
}

function Viewer() {
  const { formId } = useParams()
  const f = useForm(formId)
  const [ans, setAns] = useState({})
  const nav = useNavigate()

  if (!f) return <div style={{ padding: 20 }}>...</div>

  function setV(k, v) { setAns(a => ({ ...a, [k]: v })) }

  async function send() {
    const res = await jpost(`${API}/forms/${formId}/submit`, { answers: ans })
    if (res.id) nav(`/forms/${formId}/responses`)
    else alert(JSON.stringify(res))
  }

  return (
    <div style={{ padding: 20 }}>
      <h3>Form</h3>
      {f.qs.map(q => {
        const show = ssq(q.rules || null, ans)
        if (!show) return null
        const v = ans[q.key] || (q.type === "multipleSelects" ? [] : "")
        if (q.type === "singleLineText") return (
          <div key={q.key} style={{ marginBottom: 8 }}>
            <label>{q.label || q.key}</label>
            <input value={v} onChange={e => setV(q.key, e.target.value)} />
          </div>
        )
        if (q.type === "multilineText") return (
          <div key={q.key} style={{ marginBottom: 8 }}>
            <label>{q.label || q.key}</label>
            <textarea value={v} onChange={e => setV(q.key, e.target.value)} />
          </div>
        )
        if (q.type === "singleSelect") return (
          <div key={q.key} style={{ marginBottom: 8 }}>
            <label>{q.label || q.key}</label>
            <select value={v} onChange={e => setV(q.key, e.target.value)}>
              <option value="">Select</option>
              {(q.opts || []).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        )
        if (q.type === "multipleSelects") return (
          <div key={q.key} style={{ marginBottom: 8 }}>
            <label>{q.label || q.key}</label>
            <div>
              {(q.opts || []).map(o => (
                <label key={o} style={{ marginRight: 8 }}>
                  <input type="checkbox" checked={(v || []).includes(o)} onChange={e => {
                    const now = new Set(v || [])
                    if (e.target.checked) now.add(o)
                    else now.delete(o)
                    setV(q.key, Array.from(now))
                  }} /> {o}
                </label>
              ))}
            </div>
          </div>
        )
        if (q.type === "multipleAttachments") return (
          <div key={q.key} style={{ marginBottom: 8 }}>
            <label>{q.label || q.key}</label>
            <input placeholder="url1,url2" value={v} onChange={e => setV(q.key, e.target.value)} />
          </div>
        )
        return null
      })}
      <button onClick={send}>Submit</button>
      <div style={{ marginTop: 20 }}>
        <Link to={`/forms/${formId}/responses`}>View Responses</Link>
      </div>
      <div style={{ marginTop: 20 }}>
        <Link to="/">Home</Link>
      </div>
    </div>
  )
}

function Responses() {
  const { formId } = useParams()
  const [rows, setRows] = useState([])
  useEffect(() => { jget(`${API}/forms/${formId}/responses`).then(setRows) }, [formId])
  return (
    <div style={{ padding: 20 }}>
      <h3>Responses</h3>
      {rows.map(r => (
        <div key={r.id} style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
          <div>{r.id}</div>
          <div>{new Date(r.createdAt).toLocaleString()}</div>
          <div>{r.status}</div>
          <div style={{ fontSize: 12 }}>{JSON.stringify(r.preview)}</div>
        </div>
      ))}
      <div style={{ marginTop: 20 }}>
        <Link to={`/form/${formId}`}>Back</Link>
      </div>
    </div>
  )
}

function Home() {
  return (
    <div style={{ padding: 20 }}>
      <h3>Home</h3>
      <div style={{ display: "flex", gap: 12 }}>
        <Link to="/login">Login</Link>
        <Link to="/builder">Builder</Link>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/form/:formId" element={<Viewer />} />
        <Route path="/forms/:formId/responses" element={<Responses />} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById("root")).render(<App />)

