// WordCard — thẻ từ (dùng chung cho Enricher ENCODE & bước-2 phiên ôn RECALL).
//   mode="encode" → mục "Gốc từ" gập lại để khuyến khích đoán họ-từ trước.
//   mode="recall" → vừa hé lộ sau khi cố nhớ, mở rộng hơn cho dễ soi.

import { useState } from 'react'
import { say, youglishUrl } from '../lib/speech.js'
import IntensitySpectrum from './IntensitySpectrum.jsx'
import {
  Caption,
  Chip,
  ConnotationDot,
  RegisterChip,
  SpeakerIcon,
  BookmarkIcon,
  ChevronIcon,
  ExternalIcon,
} from './ui.jsx'

const CONFIDENCE_LABEL = {
  high: 'độ tin cậy cao',
  medium: 'độ tin cậy vừa',
  low: 'độ tin cậy thấp',
}

function Section({ title, caption, children, open = false }) {
  return (
    <details open={open} className="group border-t border-rule">
      <summary className="flex cursor-pointer list-none select-none items-center gap-2.5 py-4 marker:hidden">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-canvas text-muted transition-transform group-open:rotate-90">
          <ChevronIcon className="h-3.5 w-3.5" />
        </span>
        <span className="font-display text-[18px] font-medium text-ink">{title}</span>
        {caption && <Caption>{caption}</Caption>}
      </summary>
      <div className="pb-5 pl-9 text-[15px] leading-[1.75] text-ink">{children}</div>
    </details>
  )
}

function AudioButton({ word }) {
  const [playing, setPlaying] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        say(word)
        setPlaying(true)
        setTimeout(() => setPlaying(false), 900)
      }}
      aria-label={`Phát âm ${word}`}
      title="Phát âm (Space)"
      className="grid h-10 w-10 place-items-center rounded-full bg-canvas text-accent transition hover:bg-accent-soft"
    >
      <SpeakerIcon playing={playing} />
    </button>
  )
}

function HighlightWord({ text, word }) {
  if (!text || !word) return text || null
  const safeWord = String(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = String(text).split(new RegExp(`(${safeWord})`, 'i'))
  return parts.map((part, i) =>
    part.toLowerCase() === word.toLowerCase() ? (
      <mark key={i} className="rounded bg-accent-soft px-0.5 font-semibold text-accent">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

function CollocationsTable({ items, word }) {
  if (!items?.length) return null

  return (
    <div className="space-y-3">
      <div className="hidden overflow-hidden rounded-xl border border-rule sm:block">
        <table className="w-full border-collapse text-left text-[14px]">
          <thead className="bg-canvas text-[12px] uppercase tracking-[0.08em] text-muted">
            <tr>
              <th className="w-[25%] px-3 py-2 font-bold">Cụm</th>
              <th className="w-[18%] px-3 py-2 font-bold">Kiểu</th>
              <th className="w-[22%] px-3 py-2 font-bold">Nghĩa</th>
              <th className="px-3 py-2 font-bold">Ví dụ</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c, i) => (
              <tr key={`${c.phrase || 'collocation'}-${i}`} className="border-t border-rule align-top">
                <td className="px-3 py-3 font-display font-bold text-ink">
                  <HighlightWord text={c.phrase} word={word} />
                  {c.register && <Caption className="mt-1 block normal-case tracking-normal">{c.register}</Caption>}
                </td>
                <td className="px-3 py-3 font-data text-[12px] text-accent">{c.pattern}</td>
                <td className="px-3 py-3 text-muted">{c.vi}</td>
                <td className="px-3 py-3">
                  {c.example && (
                    <p className="text-[14px] italic text-ink">
                      “<HighlightWord text={c.example} word={word} />”
                    </p>
                  )}
                  {c.note && <p className="mt-1 text-[13px] text-muted">{c.note}</p>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-2.5 sm:hidden">
        {items.map((c, i) => (
          <li key={`${c.phrase || 'collocation'}-${i}`} className="rounded-xl bg-canvas p-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-[15px] font-bold text-ink">
                <HighlightWord text={c.phrase} word={word} />
              </p>
              {c.pattern && (
                <span className="rounded-full bg-accent-soft px-2 py-0.5 font-data text-[11px] font-semibold text-accent">
                  {c.pattern}
                </span>
              )}
              {c.register && <Caption>{c.register}</Caption>}
            </div>
            {c.vi && <p className="mt-1 text-[14px] text-muted">{c.vi}</p>}
            {c.example && (
              <p className="mt-2 text-[14px] italic text-ink">
                “<HighlightWord text={c.example} word={word} />”
              </p>
            )}
            {c.note && <p className="mt-1 text-[13px] text-muted">{c.note}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function WordCard({ data, fromCache, saved, onToggleSave, mode = 'encode' }) {
  if (!data) return null
  const {
    word,
    ipa,
    syllable_stress,
    part_of_speech = [],
    register,
    connotation,
    core_meaning_en,
    vi_anchor,
    etymology,
    word_family = [],
    mnemonic_vi,
    examples = [],
    collocations = [],
    synonym_cluster,
    tricky_senses = [],
    antonyms = [],
    difficulty,
  } = data

  const openEtymology = mode === 'recall'

  return (
    <article className="overflow-hidden rounded-card border border-rule bg-surface shadow-card">
      <div className="p-6 sm:p-7">
        {/* ── Đầu thẻ ── */}
        <header>
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-canvas text-ink">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
                <path d="M5 5.5h5.5A2.5 2.5 0 0 1 13 8v11a2.5 2.5 0 0 0-2.5-2.5H5v-11Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                <path d="M19 5.5h-5.5A2.5 2.5 0 0 0 11 8v11a2.5 2.5 0 0 1 2.5-2.5H19v-11Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[21px] font-medium text-ink">Word Card</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {typeof difficulty === 'number' && (
                  <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-semibold text-accent">
                    khó {difficulty}/5
                  </span>
                )}
                {fromCache && <Caption>cache</Caption>}
              </div>
            </div>
            {onToggleSave && (
              <button
                type="button"
                onClick={onToggleSave}
                aria-pressed={saved}
                aria-label={saved ? 'Bỏ lưu từ' : 'Lưu vào bảng từ'}
                title={saved ? 'Bỏ lưu' : 'Lưu vào bảng từ'}
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border transition ${
                  saved
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-rule bg-surface text-ink hover:bg-canvas'
                }`}
              >
                <BookmarkIcon filled={saved} />
              </button>
            )}
          </div>

          <div className="mt-8">
            <h2 className="break-words font-display text-[54px] font-bold leading-[0.98] tracking-normal text-ink sm:text-[68px]">
              {word}
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
              <AudioButton word={word} />
              {ipa && <span className="ipa text-[22px] text-muted">{ipa}</span>}
              <a
                href={youglishUrl(word)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-9 items-center gap-1 rounded-full border border-rule px-3 py-1 text-[13px] font-semibold text-muted hover:bg-canvas hover:text-accent"
              >
                <ExternalIcon className="h-3.5 w-3.5" /> Youglish
              </a>
            </div>
          </div>
        </header>

        {syllable_stress && (
          <p className="mt-1.5 font-data text-[12px] text-muted">{syllable_stress}</p>
        )}

        {/* Hàng nhãn */}
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-rule pt-4">
          {part_of_speech.length > 0 && (
            <span className="font-display text-[16px] font-medium italic text-muted">
              {part_of_speech.join(', ')}
            </span>
          )}
          <RegisterChip value={register} />
          {connotation && <ConnotationDot value={connotation} />}
        </div>

        <div className="mt-2">
          {/* ── Nghĩa (B1) — luôn mở ── */}
          <Section title="Nghĩa" caption="B1" open>
            <p className="text-[18px] leading-[1.75] text-ink">{core_meaning_en}</p>
            {vi_anchor && (
              <p className="mt-2 text-[16px] font-medium text-muted">
                <span className="font-data text-[11px]">vi</span> · {vi_anchor}
              </p>
            )}
          </Section>

          {/* ── Gốc từ + họ từ ── */}
          {etymology && (
            <Section title="Gốc từ + họ từ" open={openEtymology}>
              <div className="flex flex-wrap items-center gap-2">
                {(etymology.breakdown || []).map((b, i) => (
                  <span key={i} className="inline-flex items-center gap-2">
                    {i > 0 && <span className="text-accent">·</span>}
                    <span
                      title={`${b.meaning}${b.origin ? ` — ${b.origin}` : ''}`}
                      className="rounded-xl bg-accent-soft px-3 py-1.5 font-data text-[14px] font-semibold text-accent"
                    >
                      {b.part}
                    </span>
                  </span>
                ))}
                {etymology.confidence && (
                  <Caption className="ml-1">
                    {CONFIDENCE_LABEL[etymology.confidence] || etymology.confidence}
                  </Caption>
                )}
              </div>
              <ul className="mt-2.5 space-y-1 text-[14px] text-muted">
                {(etymology.breakdown || []).map((b, i) => (
                  <li key={i}>
                    <span className="font-data font-semibold text-ink">{b.part}</span> — {b.meaning}
                    {b.origin && <span> · {b.origin}</span>}
                  </li>
                ))}
              </ul>
              {etymology.note && (
                <p className="mt-2.5 text-[14px] italic text-muted">{etymology.note}</p>
              )}

              {word_family.length > 0 && (
                <div className="mt-3.5">
                  <Caption>họ từ cùng gốc</Caption>
                  <ul className="mt-2 space-y-1.5">
                    {word_family.map((w, i) => (
                      <li key={i} className="text-[14px]">
                        <span className="font-display font-semibold text-ink">{w.word}</span>
                        <span className="text-muted"> · {w.gloss_en}</span>
                        {w.vi && <span className="text-muted"> · {w.vi}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Section>
          )}

          {/* ── Mnemonic ── */}
          {mnemonic_vi && (mnemonic_vi.keyword || mnemonic_vi.image) && (
            <Section title="Mnemonic" caption="móc câu">
              {mnemonic_vi.keyword && (
                <p>
                  <span className="text-muted">Móc câu: </span>
                  <span className="font-display text-[18px] font-medium text-ink">
                    {mnemonic_vi.keyword}
                  </span>
                </p>
              )}
              {mnemonic_vi.image && <p className="mt-1.5 text-[15px]">{mnemonic_vi.image}</p>}
            </Section>
          )}

          {/* ── Ví dụ ── */}
          {examples.length > 0 && (
            <Section title="Ví dụ">
              <ul className="space-y-3">
                {examples.map((e, i) => (
                  <li key={i} className="rounded-xl bg-canvas p-3">
                    <p className="text-[15px] italic text-ink">“{e.sentence}”</p>
                    {e.why && <p className="mt-1 text-[14px] text-muted">↳ {e.why}</p>}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* ── Collocations ── */}
          {collocations.length > 0 && (
            <Section title="Collocations" caption="cụm tự nhiên" open={mode === 'encode'}>
              <CollocationsTable items={collocations} word={word} />
            </Section>
          )}

          {/* ── Cụm đồng nghĩa — SIGNATURE spectrum ── */}
          {synonym_cluster?.members?.length > 0 && (
            <Section title="Cụm đồng nghĩa" caption="phổ cường độ" open={mode === 'encode'}>
              <IntensitySpectrum cluster={synonym_cluster} current={word} />
            </Section>
          )}

          {/* ── Nghĩa bẫy ── */}
          {tricky_senses.length > 0 && (
            <Section title="Nghĩa bẫy" caption="cẩn thận">
              <ul className="space-y-2.5">
                {tricky_senses.map((t, i) => (
                  <li key={i}>
                    <p className="font-display font-semibold text-ink">{t.sense_en}</p>
                    {t.example && (
                      <p className="text-[14px] italic text-muted">“{t.example}”</p>
                    )}
                    {t.trap && (
                      <p className="mt-1 text-[14px] font-medium" style={{ color: 'var(--color-neg)' }}>
                        ⚠ {t.trap}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* ── Trái nghĩa ── */}
          {antonyms.length > 0 && (
            <Section title="Trái nghĩa">
              <div className="flex flex-wrap gap-2">
                {antonyms.map((a, i) => (
                  <Chip key={i}>{a}</Chip>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </article>
  )
}
