export function shouldShowQuestion(rules, ans) {
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

export function validateAns(qs, ans) {
  const errs = []
  for (const q of qs) {
    const show = shouldShowQuestion(q.rules || null, ans)
    if (!show) continue
    const v = ans?.[q.key]
    if (q.req && (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0))) errs.push(q.key)
    if (q.type === "singleSelect" && v !== undefined && q.opts && !q.opts.includes(v)) errs.push(q.key)
    if (q.type === "multipleSelects" && v !== undefined && (!Array.isArray(v) || v.some(x => !q.opts.includes(x)))) errs.push(q.key)
  }
  return errs
}

