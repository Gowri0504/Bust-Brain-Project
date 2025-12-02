import React, { useEffect, useState } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import Nav from "../components/Nav.jsx"
import { API, jget, jpost } from "../lib/api.js"
import { ssq } from "../lib/logic.js"

export default function Viewer(){
  const { formId } = useParams()
  const [f, setF] = useState(null)
  const [ans, setAns] = useState({})
  const [errKeys, setErrKeys] = useState([])
  const nav = useNavigate()
  useEffect(() => { jget(`${API}/forms/${formId}`).then(setF) }, [formId])
  if (!f) return <div className="wrap"><Nav/><div className="card">...</div></div>
  function setV(k,v){ setAns(a=>({ ...a, [k]: v })) }
  function validate(){
    const bad = []
    for (const q of f.qs) {
      const show = ssq(q.rules||null, ans)
      if (!show) continue
      const v = ans[q.key]
      if (q.req && (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0))) bad.push(q.key)
      if (q.type === "singleSelect" && v !== undefined && v !== "" && q.opts && !q.opts.includes(v)) bad.push(q.key)
      if (q.type === "multipleSelects" && v !== undefined && (!Array.isArray(v) || v.some(x => !q.opts.includes(x)))) bad.push(q.key)
    }
    return bad
  }
  async function send(){
    const bad = validate()
    setErrKeys(bad)
    if (bad.length) { alert(`Please fix: ${bad.join(", ")}`); return }
    const res = await jpost(`${API}/forms/${formId}/submit`, { answers: ans }); if (res.id) nav(`/forms/${formId}/responses`)
  }
  return (
    <div className="wrap">
      <Nav/>
      <div className="card grid">
        <div className="title">Form</div>
        {f.qs.map(q => {
          const show = ssq(q.rules||null, ans)
          if (!show) return null
          const v = ans[q.key] || (q.type === "multipleSelects" ? [] : "")
          if (q.type === "singleLineText") return (
            <div key={q.key} className="grid">
              <label>{q.label || q.key}</label>
              <input value={v} onChange={e=>setV(q.key, e.target.value)} />
            </div>
          )
          if (q.type === "multilineText") return (
            <div key={q.key} className="grid">
              <label>{q.label || q.key}</label>
              <textarea value={v} onChange={e=>setV(q.key, e.target.value)} />
            </div>
          )
          if (q.type === "singleSelect") return (
            <div key={q.key} className="grid">
              <label>{q.label || q.key}</label>
              <select value={v} onChange={e=>setV(q.key, e.target.value)}>
                <option value="">Select</option>
                {(q.opts||[]).map(o=> <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          )
          if (q.type === "multipleSelects") return (
            <div key={q.key} className="grid">
              <label>{q.label || q.key}</label>
              <div className="row">
                {(q.opts||[]).map(o=> (
                  <label key={o} className="row" style={{gap:6}}>
                    <input type="checkbox" checked={(v||[]).includes(o)} onChange={e=>{ const now=new Set(v||[]); if(e.target.checked) now.add(o); else now.delete(o); setV(q.key, Array.from(now)) }} /> {o}
                  </label>
                ))}
              </div>
            </div>
          )
          if (q.type === "multipleAttachments") return (
            <div key={q.key} className="grid">
              <label>{q.label || q.key}</label>
              <input placeholder="url1,url2" value={v} onChange={e=>setV(q.key, e.target.value)} />
            </div>
          )
          return null
        })}
        <div className="row" style={{justifyContent:"space-between"}}>
          <button className="btn" onClick={send}>Submit</button>
          <Link className="btn sec" to={`/forms/${formId}/responses`}>View Responses</Link>
        </div>
      </div>
    </div>
  )
}
