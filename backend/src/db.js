import mongoose from "mongoose"

export async function initDb(url) {
  mongoose.set("bufferCommands", false)
  if (!url) return
  try {
    await mongoose.connect(url)
  } catch {}
}

export function isDbReady() {
  return mongoose.connection && mongoose.connection.readyState === 1
}
