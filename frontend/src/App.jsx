import React from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home.jsx"
import Login from "./pages/Login.jsx"
import Builder from "./pages/Builder.jsx"
import Viewer from "./pages/Viewer.jsx"
import Responses from "./pages/Responses.jsx"

export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/builder" element={<Builder/>} />
        <Route path="/form/:formId" element={<Viewer/>} />
        <Route path="/forms/:formId/responses" element={<Responses/>} />
      </Routes>
    </BrowserRouter>
  )
}
