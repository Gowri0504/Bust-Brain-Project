import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import { initDb } from "./db.js"
import routes from "./routes.js"

dotenv.config()

const app = express()
app.use(cors({ origin: process.env.APP_URL, credentials: true }))
app.use(express.json({ limit: "2mb" }))
app.use(cookieParser())

await initDb(process.env.MONGO_URL)

app.use(routes)

function start(p){
  const s = app.listen(p, () => {})
  s.on("error", (e) => {
    if (e && e.code === "EADDRINUSE") {
      const np = p === 4000 ? 4010 : (Number(p) + 1)
      start(np)
    } else throw e
  })
}
start(process.env.PORT || 4000)
