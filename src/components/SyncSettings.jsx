import { useRef, useState } from 'react'
import {
  getSyncMeta,
  getSyncSettings,
  pullSnapshot,
  pushSnapshot,
  saveSyncSettings,
  syncReady,
} from '../lib/cloudSync.js'
import { applySnapshot, makeSnapshot, snapshotStats } from '../lib/snapshot.js'
import { Caption } from './ui.jsx'

function fmtTime(value) {
  if (!value) return 'chưa có'
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function fmtBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-[13px] font-semibold text-muted">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

export default function SyncSettings() {
  const [settings, setSettings] = useState(() => getSyncSettings())
  const [meta, setMeta] = useState(() => getSyncMeta())
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  const ready = syncReady(settings)

  function update(patch) {
    setSettings((s) => ({ ...s, ...patch }))
  }

  function save() {
    const next = saveSyncSettings(settings)
    setSettings(next)
    setStatus('Đã lưu cấu hình đồng bộ trên thiết bị này.')
    setMeta(getSyncMeta())
  }

  async function doPush() {
    setBusy(true)
    setStatus('')
    try {
      saveSyncSettings(settings)
      const r = await pushSnapshot(settings)
      setStatus(`Đã đẩy lên cloud: ${r.stats.keys} mục, ${r.stats.cards} thẻ.`)
      setMeta(getSyncMeta())
    } catch (e) {
      setStatus(e.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  async function doPull() {
    if (!window.confirm('Kéo dữ liệu cloud sẽ ghi đè dữ liệu GRE L2 trên thiết bị này. Tiếp tục?')) {
      return
    }
    setBusy(true)
    setStatus('')
    try {
      saveSyncSettings(settings)
      const r = await pullSnapshot(settings)
      setStatus(r.pulled ? `Đã kéo snapshot cloud: ${r.stats.keys} mục.` : r.reason)
      setMeta(getSyncMeta())
      if (r.pulled) window.location.reload()
    } catch (e) {
      setStatus(e.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  function doExport() {
    const snapshot = makeSnapshot()
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `gre-l2-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    const stats = snapshotStats(snapshot)
    setStatus(`Đã xuất JSON: ${stats.keys} mục, ${fmtBytes(stats.bytes)}.`)
  }

  async function doImport(file) {
    if (!file) return
    if (!window.confirm('Import JSON sẽ ghi đè dữ liệu GRE L2 trên thiết bị này. Tiếp tục?')) {
      fileRef.current.value = ''
      return
    }
    try {
      const text = await file.text()
      const snapshot = JSON.parse(text)
      applySnapshot(snapshot)
      const stats = snapshotStats(snapshot)
      setStatus(`Đã import JSON: ${stats.keys} mục. App sẽ tải lại.`)
      setTimeout(() => window.location.reload(), 400)
    } catch (e) {
      setStatus(e.message || String(e))
    } finally {
      fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-card border border-rule bg-surface p-5 shadow-card">
        <Caption>cloud sync</Caption>
        <div className="mt-4 grid gap-3">
          <Field label="Supabase URL">
            <input
              value={settings.supabaseUrl}
              onChange={(e) => update({ supabaseUrl: e.target.value.trim() })}
              placeholder="https://xxxxx.supabase.co"
              className="w-full rounded-2xl border border-rule bg-canvas px-4 py-3 text-[14px] text-ink outline-none focus:border-accent"
            />
          </Field>
          <Field label="Anon key">
            <input
              value={settings.anonKey}
              onChange={(e) => update({ anonKey: e.target.value.trim() })}
              type="password"
              autoComplete="off"
              className="w-full rounded-2xl border border-rule bg-canvas px-4 py-3 text-[14px] text-ink outline-none focus:border-accent"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Profile ID">
              <input
                value={settings.profileId}
                onChange={(e) => update({ profileId: e.target.value.trim() })}
                placeholder="my-gre"
                className="w-full rounded-2xl border border-rule bg-canvas px-4 py-3 text-[14px] text-ink outline-none focus:border-accent"
              />
            </Field>
            <Field label="Sync secret">
              <input
                value={settings.syncSecret}
                onChange={(e) => update({ syncSecret: e.target.value })}
                type="password"
                autoComplete="off"
                className="w-full rounded-2xl border border-rule bg-canvas px-4 py-3 text-[14px] text-ink outline-none focus:border-accent"
              />
            </Field>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-[14px] font-semibold text-ink">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => update({ enabled: e.target.checked })}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            Bật sync
          </label>
          <label className="flex items-center gap-2 text-[14px] font-semibold text-ink">
            <input
              type="checkbox"
              checked={settings.autoSync}
              onChange={(e) => update({ autoSync: e.target.checked })}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            Tự đẩy/kéo
          </label>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2.5">
          <button
            onClick={save}
            className="rounded-2xl border border-rule px-4 py-3 text-[14px] font-bold text-ink hover:bg-canvas"
          >
            Lưu
          </button>
          <button
            onClick={doPush}
            disabled={!ready || busy}
            className="rounded-2xl bg-grad px-4 py-3 text-[14px] font-bold text-white shadow-soft disabled:opacity-40"
          >
            Đẩy lên
          </button>
          <button
            onClick={doPull}
            disabled={!ready || busy}
            className="rounded-2xl border-2 border-accent px-4 py-3 text-[14px] font-bold text-accent disabled:opacity-40"
          >
            Kéo về
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-rule bg-canvas p-4 text-[13px] text-muted">
          <p>Local: {meta.local.keys} mục · {meta.local.cards} thẻ · {fmtBytes(meta.local.bytes)}</p>
          <p className="mt-1">Đẩy gần nhất: {fmtTime(meta.lastPushAt)}</p>
          <p className="mt-1">Kéo gần nhất: {fmtTime(meta.lastPullAt)}</p>
        </div>
      </div>

      <div className="rounded-card border border-rule bg-surface p-5 shadow-card">
        <Caption>backup file</Caption>
        <div className="mt-4 flex gap-2.5">
          <button
            onClick={doExport}
            className="flex-1 rounded-2xl border border-rule px-4 py-3 text-[14px] font-bold text-ink hover:bg-canvas"
          >
            Export JSON
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 rounded-2xl border border-rule px-4 py-3 text-[14px] font-bold text-ink hover:bg-canvas"
          >
            Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => doImport(e.target.files?.[0])}
          />
        </div>
      </div>

      {status && (
        <p className="rounded-2xl border border-rule bg-accent-soft px-4 py-3 text-[14px] font-medium text-accent">
          {status}
        </p>
      )}
    </div>
  )
}
