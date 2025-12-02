import React from "react"
import Nav from "../components/Nav.jsx"

export default function Home(){
  return (
    <div className="wrap">
      <Nav/>
      <div className="card grid">
        <div className="title">Home</div>
        <div className="mut">Build forms from Airtable tables with live logic.</div>
      </div>
    </div>
  )
}
