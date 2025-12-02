import React from "react"
import { Link } from "react-router-dom"

export default function Nav(){
  return (
    <div className="nav">
      <div className="brand">FormX</div>
      <div className="links">
        <Link className="btn sec" to="/">Home</Link>
        <Link className="btn sec" to="/login">Login</Link>
        <Link className="btn" to="/builder">Builder</Link>
      </div>
    </div>
  )
}
