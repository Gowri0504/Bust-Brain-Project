import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Nav from "../components/Nav.jsx"
import { API, jget, jpost } from "../lib/api.js"

export default function Builder(){
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

  useEffect(() => { jget(`${API}/bases`).then(setBs) }, [])
  useEffect(() => { if (bid) jget(`${API}/bases/${bid}/tables`).then(setTs) }, [bid])
  useEffect(() => {
    const t = ts.find(x => x.id === tid)
    if (t){ setTname(t.name); setFields(t.fields) }
  }, [tid, ts])

  function toggle(f){ setPick(p => p.includes(f.id) ? p.filter(x=>x!==f.id) : [...p,f.id]) }

  async function save(){
    const qs = pick.map(fid => {
      const f = fields.find(x => x.id === fid)
      if (!f) return null
      const type = f.type
      if (!new Set(["singleLineText","multilineText","singleSelect","multipleSelects","multipleAttachments"]).has(type)) return null
      const key = f.name.replace(/\s+/g,"_").toLowerCase()
      const label = lbl[f.id] || f.name
      const r = rules[f.id] || null
      const o = f.options?.choices?.map(c=>c.name) || []
      return { key, fieldId: f.id, fname: f.name, label, type, req: !!req[f.id], opts: o, rules: r }
    }).filter(Boolean)
    const res = await jpost(`${API}/forms`, { baseId: bid, tableId: tid, tableName: tname, qs })
    if (res.id) nav(`/form/${res.id}`)
  }

  return (
    <div className="wrap">
      <Nav/>
      <div className="card grid">
        <div className="row">
          <div style={{flex:1}}>
            <label>Base</label>
            <select value={bid} onChange={e=>setBid(e.target.value)}>
              <option value="">Select</option>
              {bs.map(b=> <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div style={{flex:1}}>
            <label>Table</label>
            <select value={tid} onChange={e=>setTid(e.target.value)}>
              <option value="">Select</option>
              {ts.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        {tid && (
          <div className="grid">
            <div className="title">Fields</div>
            {fields.map(f=> (
              <div key={f.id} className="row">
                <input type="checkbox" checked={pick.includes(f.id)} onChange={()=>toggle(f)} />
                <div className="pill">{f.name} ({f.type})</div>
                <input style={{maxWidth:260}} placeholder="label" value={lbl[f.id]||""} onChange={e=>setLbl({...lbl,[f.id]:e.target.value})} />
                <label className="row" style={{gap:6}}>req <input type="checkbox" checked={!!req[f.id]} onChange={e=>setReq({...req,[f.id]:e.target.checked})} /></label>
                <input style={{flex:1}} placeholder="rules json" value={rules[f.id]?JSON.stringify(rules[f.id]):""} onChange={e=>{ try{ setRules({...rules,[f.id]:JSON.parse(e.target.value)}) } catch{ setRules({...rules,[f.id]:null}) } }} />
              </div>
            ))}
            <button className="btn" onClick={save}>Save</button>
          </div>
        )}
      </div>
    </div>
  )
}
