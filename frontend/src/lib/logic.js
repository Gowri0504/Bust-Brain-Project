export function ssq(rules, ans) {
  if (!rules) return true
  const cs = rules.conditions || []
  if (!cs.length) return true
  const f = rules.logic === "OR"
  let ok = f ? false : true
  for (const c of cs) {
    const v = ans?.[c.questionKey]
    let hit = false
    if (c.operator === "equals") hit = v === c.value
    else if (c.operator === "notEquals") hit = v !== c.value
    else if (c.operator === "contains") hit = Array.isArray(v) ? v.includes(c.value) : (typeof v === "string" ? (v || "").includes(c.value) : false)
    if (f) ok = ok || hit
    else ok = ok && hit
  }
  return ok
}

