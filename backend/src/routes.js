import express from "express"
import mongoose from "mongoose"
import { User, Form, Resp } from "./models.js"
import { authUrl, tokenByCode, whoami, bases, tables, createRec } from "./airtable.js"
import { shouldShowQuestion, validateAns } from "./logic.js"
import { isDbReady } from "./db.js"

const allowed = new Set(["singleLineText", "multilineText", "singleSelect", "multipleSelects", "multipleAttachments"])

const r = express.Router()

r.get("/auth/airtable/login", async (req, res) => {
  const ss = (process.env.COOKIE_SAMESITE || "lax").toLowerCase()
  const opts = { httpOnly: true, sameSite: ss }
  if (ss === "none") opts.secure = true
  const st = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  res.cookie("oauth_state", st, opts)
  res.redirect(authUrl(st))
})

r.get("/auth/airtable/callback", async (req, res) => {
  const state = req.query.state
  const cst = req.cookies.oauth_state
  if (!state || !cst || state !== cst) return res.status(400).send("invalid_state")
  res.clearCookie("oauth_state")
  const code = req.query.code
  const t = await tokenByCode(code)
  const me = await whoami(t.access_token)
  if (!isDbReady()) return res.status(503).json({ err: "db" })
  await User.findOneAndUpdate(
    { uid: me.id },
    { uid: me.id, name: me.name, email: me.email, token: t.access_token, refresh: t.refresh_token, loginAt: new Date() },
    { upsert: true }
  )
  const ss = (process.env.COOKIE_SAMESITE || "lax").toLowerCase()
  const opts = { httpOnly: false, sameSite: ss }
  if (ss === "none") opts.secure = true
  res.cookie("uid", me.id, opts)
  res.redirect(process.env.APP_URL || "http://localhost:5173")
})

r.get("/bases", async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ err: "db" })
  const u = await User.findOne({ uid: req.cookies.uid })
  if (!u) return res.status(401).json({ err: "no_user" })
  const bs = await bases(u.token)
  res.json(bs)
})

r.get("/bases/:bid/tables", async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ err: "db" })
  const u = await User.findOne({ uid: req.cookies.uid })
  if (!u) return res.status(401).json({ err: "no_user" })
  const ts = await tables(u.token, req.params.bid)
  res.json(ts)
})

r.post("/forms", async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ err: "db" })
  const u = await User.findOne({ uid: req.cookies.uid })
  if (!u) return res.status(401).json({ err: "no_user" })
  const f = req.body
  const qs = (f.qs || []).filter(q => allowed.has(q.type))
  const doc = await Form.create({ owner: u.uid, baseId: f.baseId, tableId: f.tableId, tableName: f.tableName, qs })
  res.json({ id: doc.id })
})

r.get("/forms/:id", async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ err: "db" })
  const id = req.params.id
  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ err: "nf" })
  const f = await Form.findById(id)
  if (!f) return res.status(404).json({ err: "nf" })
  res.json(f)
})

r.get("/forms/:id/responses", async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ err: "db" })
  const rs = await Resp.find({ formId: req.params.id }).sort({ createdAt: -1 }).lean()
  res.json(
    rs.map(x => ({ id: x.id, createdAt: x.createdAt, status: x.status || "ok", preview: x.answers }))
  )
})

r.post("/forms/:id/submit", async (req, res) => {
  if (!isDbReady()) return res.status(503).json({ err: "db" })
  const u = await User.findOne({ uid: req.cookies.uid })
  if (!u) return res.status(401).json({ err: "no_user" })
  const id = req.params.id
  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ err: "nf" })
  const f = await Form.findById(id)
  if (!f) return res.status(404).json({ err: "nf" })
  const ans = req.body?.answers || {}
  const errs = validateAns(f.qs, ans)
  if (errs.length) return res.status(400).json({ err: "bad", fields: errs })
  const af = {}
  for (const q of f.qs) {
    const show = shouldShowQuestion(q.rules || null, ans)
    if (!show) continue
    const v = ans[q.key]
    if (v === undefined) continue
    const fname = q.fname || q.label || q.key
    if (q.type === "multipleAttachments") {
      const arr = Array.isArray(v) ? v : (typeof v === "string" ? v.split(",").map(s => s.trim()).filter(Boolean) : [])
      af[fname] = arr.map(u => ({ url: u }))
    } else af[fname] = v
  }
  const rec = await createRec(u.token, f.baseId, f.tableName, af)
  const doc = await Resp.create({ formId: f.id, airtableRecordId: rec.id, answers: ans, status: "ok" })
  res.json({ id: doc.id, airtableId: rec.id })
})

r.post("/webhooks/airtable", async (req, res) => {
  const ev = req.body
  if (!ev || !ev.change || !ev.change.recordId) return res.json({ ok: true })
  if (!isDbReady()) return res.status(503).json({ err: "db" })
  const id = ev.change.recordId
  if (ev.type === "recordDeleted") {
    await Resp.updateMany({ airtableRecordId: id }, { deletedInAirtable: true })
  } else if (ev.type === "recordUpdated") {
    await Resp.updateMany({ airtableRecordId: id }, { status: "updated" })
  }
  res.json({ ok: true })
})

export default r
