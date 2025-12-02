import React, { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import Nav from "../components/Nav.jsx"
import { API, jget } from "../lib/api.js"

export default function Responses(){
  const { formId } = useParams()
  const [rows, setRows] = useState([])
  useEffect(() => { jget(`${API}/forms/${formId}/responses`).then(setRows) }, [formId])
  return (
    <div className="wrap">
      <Nav/>
      <div className="card grid">
        <div className="title">Responses</div>
        <div className="list">
          {rows.map(r=> (
            <div key={r.id} className="item">
              <div>
                <div className="pill">{r.id}</div>
                <div className="mut">{new Date(r.createdAt).toLocaleString()}</div>
              </div>
              <div className="mut">{r.status}</div>
              <div className="mut" style={{maxWidth:420,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{JSON.stringify(r.preview)}</div>
            </div>
          ))}
        </div>
        <Link className="btn sec" to={`/form/${formId}`}>Back</Link>
      </div>
    </div>
  )
}
