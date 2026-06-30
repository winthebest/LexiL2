import { makeSnapshot, mergeSnapshot, snapshotStats } from './snapshot.js'

const SETTINGS_KEY = 'gre-l2:sync:settings'
const LAST_PUSH_KEY = 'gre-l2:sync:lastPushAt'
const LAST_PULL_KEY = 'gre-l2:sync:lastPullAt'

const DEFAULT_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const DEFAULT_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const DEFAULT_SYNC_PROFILE_ID = import.meta.env.VITE_SYNC_PROFILE_ID || ''
const DEFAULT_SYNC_SECRET = import.meta.env.VITE_SYNC_SECRET || ''

let pushTimer = null
let pushing = false

export function getSyncSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    const s = raw ? JSON.parse(raw) : {}
    return {
      enabled: Boolean(s.enabled),
      autoSync: Boolean(s.autoSync),
      supabaseUrl: s.supabaseUrl || DEFAULT_SUPABASE_URL,
      anonKey: s.anonKey || DEFAULT_SUPABASE_ANON_KEY,
      profileId: s.profileId || DEFAULT_SYNC_PROFILE_ID,
      syncSecret: s.syncSecret || DEFAULT_SYNC_SECRET,
    }
  } catch {
    return {
      enabled: false,
      autoSync: false,
      supabaseUrl: DEFAULT_SUPABASE_URL,
      anonKey: DEFAULT_SUPABASE_ANON_KEY,
      profileId: DEFAULT_SYNC_PROFILE_ID,
      syncSecret: DEFAULT_SYNC_SECRET,
    }
  }
}

export function saveSyncSettings(settings) {
  const next = { ...getSyncSettings(), ...settings }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  return next
}

export function syncReady(settings = getSyncSettings()) {
  return Boolean(
    settings.enabled &&
      settings.supabaseUrl &&
      settings.anonKey &&
      settings.profileId &&
      settings.syncSecret,
  )
}

function baseSupabaseUrl(raw) {
  const value = String(raw || '').trim()
  if (!value) return ''
  const url = new URL(value)
  return url.origin
}

function rpcEndpoint(settings, fn) {
  return `${baseSupabaseUrl(settings.supabaseUrl)}/rest/v1/rpc/${fn}`
}

function headers(settings, extra = {}) {
  return {
    apikey: settings.anonKey,
    Authorization: `Bearer ${settings.anonKey}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

function supabaseError(res, data) {
  const detail = data?.message || data?.details || data?.hint || ''
  if (res.status === 404) {
    return new Error(
      [
        'Supabase trả 404.',
        'Thường là RPC/table chưa có trong project đang dùng, anon key lệch project, hoặc PostgREST chưa reload schema.',
        detail ? `Chi tiết Supabase: ${detail}` : '',
      ]
        .filter(Boolean)
        .join(' '),
    )
  }
  return new Error(detail || `Supabase trả lỗi ${res.status}.`)
}

function remember(key) {
  localStorage.setItem(key, new Date().toISOString())
}

export function getSyncMeta() {
  return {
    lastPushAt: localStorage.getItem(LAST_PUSH_KEY) || '',
    lastPullAt: localStorage.getItem(LAST_PULL_KEY) || '',
    local: snapshotStats(makeSnapshot()),
  }
}

export async function fetchRemoteSnapshot(settings = getSyncSettings()) {
  if (!syncReady(settings)) throw new Error('Chưa cấu hình đủ thông tin Supabase sync.')
  const res = await fetch(rpcEndpoint(settings, 'gre_l2_pull'), {
    method: 'POST',
    headers: headers(settings),
    body: JSON.stringify({
      p_profile_id: settings.profileId,
      p_sync_secret: settings.syncSecret,
    }),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw supabaseError(res, data)
  const row = Array.isArray(data) ? data[0] : null
  return row ? { payload: row.payload, updatedAt: row.updated_at } : null
}

export async function pushSnapshot(settings = getSyncSettings()) {
  if (!syncReady(settings)) throw new Error('Chưa cấu hình đủ thông tin Supabase sync.')
  if (pushing) return { skipped: true }
  pushing = true
  try {
    const payload = makeSnapshot()
    const res = await fetch(rpcEndpoint(settings, 'gre_l2_push'), {
      method: 'POST',
      headers: headers(settings),
      body: JSON.stringify({
        p_profile_id: settings.profileId,
        p_sync_secret: settings.syncSecret,
        p_payload: payload,
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      throw supabaseError(res, data)
    }
    remember(LAST_PUSH_KEY)
    return { pushed: true, stats: snapshotStats(payload) }
  } finally {
    pushing = false
  }
}

export async function pullSnapshot(settings = getSyncSettings()) {
  const remote = await fetchRemoteSnapshot(settings)
  if (!remote?.payload) return { pulled: false, reason: 'Chưa có snapshot trên cloud.' }
  mergeSnapshot(remote.payload)
  remember(LAST_PULL_KEY)
  return { pulled: true, updatedAt: remote.updatedAt, stats: snapshotStats(remote.payload) }
}

export async function pullIfRemoteNewer(settings = getSyncSettings()) {
  if (!syncReady(settings) || !settings.autoSync) return { pulled: false, reason: 'Auto sync tắt.' }
  const remote = await fetchRemoteSnapshot(settings)
  if (!remote?.payload || !remote.updatedAt) return { pulled: false, reason: 'Chưa có snapshot trên cloud.' }
  const lastPull = localStorage.getItem(LAST_PULL_KEY)
  const lastPush = localStorage.getItem(LAST_PUSH_KEY)
  const localKnown = [lastPull, lastPush].filter(Boolean).sort().at(-1)
  if (localKnown && Date.parse(remote.updatedAt) <= Date.parse(localKnown)) {
    return { pulled: false, reason: 'Local đã mới nhất.' }
  }
  mergeSnapshot(remote.payload)
  remember(LAST_PULL_KEY)
  return { pulled: true, updatedAt: remote.updatedAt, stats: snapshotStats(remote.payload) }
}

export function notifyLocalChange() {
  const settings = getSyncSettings()
  if (!syncReady(settings) || !settings.autoSync) return
  clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    pushSnapshot(settings).catch((e) => {
      console.warn('[gre-l2 sync] auto push failed:', e)
    })
  }, 1200)
}
