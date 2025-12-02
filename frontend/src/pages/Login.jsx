import React from "react"
import { API } from "../lib/api.js"
import Nav from "../components/Nav.jsx"

export default function Login(){
  return (
    <div className="wrap">
      <Nav/>
      <div className="card grid">
        <div className="title">Login</div>
        <a className="btn" href={`${API}/auth/airtable/login`}>Login with Airtable</a>
      </div>
    </div>
  )
}
