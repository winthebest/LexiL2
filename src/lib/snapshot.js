// Snapshot localStorage cho sync cá nhân.
// Chỉ gom dữ liệu app thật sự dùng (`gre-l2:*`), bỏ qua cấu hình sync để không
// tự đẩy secret/anon key lên cloud.

const PREFIX = 'gre-l2:'
const SYNC_PREFIX = 'gre-l2:sync:'
const VERSION = 1

function shouldIncludeKey(key) {
  return key.startsWith(PREFIX) && !key.startsWith(SYNC_PREFIX)
}

export function makeSnapshot() {
  const entries = {}
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (!key || !shouldIncludeKey(key)) continue
    entries[key] = localStorage.getItem(key)
  }
  return {
    version: VERSION,
    exportedAt: new Date().toISOString(),
    entries,
  }
}

export function snapshotStats(snapshot) {
  const entries = snapshot?.entries || {}
  const keys = Object.keys(entries)
  return {
    keys: keys.length,
    cards: keys.filter((k) => k.startsWith('gre-l2:card:')).length,
    bytes: new Blob([JSON.stringify(snapshot || {})]).size,
  }
}

export function applySnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || typeof snapshot.entries !== 'object') {
    throw new Error('File/snapshot không đúng định dạng.')
  }

  const incoming = snapshot.entries
  const existing = []
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (key && shouldIncludeKey(key)) existing.push(key)
  }

  for (const key of existing) {
    if (!(key in incoming)) localStorage.removeItem(key)
  }
  for (const [key, value] of Object.entries(incoming)) {
    if (shouldIncludeKey(key)) localStorage.setItem(key, String(value ?? ''))
  }
}

function parse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function stringify(value) {
  return JSON.stringify(value)
}

function readCurrentEntries() {
  const entries = {}
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (key && shouldIncludeKey(key)) entries[key] = localStorage.getItem(key)
  }
  return entries
}

function mergeSaved(localRaw, remoteRaw) {
  const map = new Map()
  for (const item of [...parse(remoteRaw, []), ...parse(localRaw, [])]) {
    if (!item?.word) continue
    const prev = map.get(item.word)
    if (!prev || (item.savedAt || 0) >= (prev.savedAt || 0)) map.set(item.word, item)
  }
  return stringify([...map.values()].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)))
}

function mergeSrs(localRaw, remoteRaw) {
  const local = parse(localRaw, {})
  const remote = parse(remoteRaw, {})
  const out = { ...remote }
  for (const [word, localState] of Object.entries(local)) {
    const remoteState = out[word]
    if (!remoteState || (localState?.due || 0) > (remoteState?.due || 0)) {
      out[word] = localState
    }
  }
  return stringify(out)
}

function mergeProgress(localRaw, remoteRaw) {
  const local = parse(localRaw, {})
  const remote = parse(remoteRaw, {})
  const days = { ...(remote.days || {}) }
  for (const [day, localDay] of Object.entries(local.days || {})) {
    const remoteDay = days[day] || {}
    days[day] = {
      reviews: Math.max(localDay.reviews || 0, remoteDay.reviews || 0),
      firstCorrect: Math.max(localDay.firstCorrect || 0, remoteDay.firstCorrect || 0),
    }
  }
  return stringify({ ...remote, ...local, days })
}

function mergeWordLists(localRaw, remoteRaw) {
  const local = parse(localRaw, {})
  const remote = parse(remoteRaw, {})
  const out = { ...remote }
  for (const [word, localList] of Object.entries(local)) {
    const byId = new Map()
    for (const item of [...(out[word] || []), ...(Array.isArray(localList) ? localList : [])]) {
      const id = item?.id || JSON.stringify(item)
      byId.set(id, item)
    }
    out[word] = [...byId.values()]
  }
  return stringify(out)
}

function mergeLogs(localRaw, remoteRaw) {
  const seen = new Set()
  const out = []
  for (const item of [...parse(remoteRaw, []), ...parse(localRaw, [])]) {
    const key = JSON.stringify(item)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return stringify(out.slice(-200))
}

function mergeStats(localRaw, remoteRaw) {
  const local = parse(localRaw, {})
  const remote = parse(remoteRaw, {})
  return stringify({
    answered: Math.max(local.answered || 0, remote.answered || 0),
    correct: Math.max(local.correct || 0, remote.correct || 0),
  })
}

function mergeValue(key, localRaw, remoteRaw) {
  if (key === 'gre-l2:saved') return mergeSaved(localRaw, remoteRaw)
  if (key === 'gre-l2:srs') return mergeSrs(localRaw, remoteRaw)
  if (key === 'gre-l2:progress') return mergeProgress(localRaw, remoteRaw)
  if (key === 'gre-l2:bank') return mergeWordLists(localRaw, remoteRaw)
  if (key === 'gre-l2:bank-rejects' || key === 'gre-l2:bank-rejects:fb') {
    return mergeLogs(localRaw, remoteRaw)
  }
  if (key === 'gre-l2:tc-stats') return mergeStats(localRaw, remoteRaw)
  if (key.startsWith('gre-l2:card:') && localRaw) return localRaw
  return remoteRaw ?? localRaw ?? ''
}

export function mergeSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || typeof snapshot.entries !== 'object') {
    throw new Error('File/snapshot không đúng định dạng.')
  }

  const local = readCurrentEntries()
  const remote = snapshot.entries
  const keys = new Set([...Object.keys(remote), ...Object.keys(local)])
  for (const key of keys) {
    if (!shouldIncludeKey(key)) continue
    localStorage.setItem(key, mergeValue(key, local[key], remote[key]))
  }
}
