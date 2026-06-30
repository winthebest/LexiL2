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
