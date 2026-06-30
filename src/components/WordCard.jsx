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
      <summary className="flex cursor-pointer list-none select-none items-center gap-2.5 py-3.5 marker:hidden">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-accent-soft text-accent transition-transform group-open:rotate-90">
          <ChevronIcon className="h-3.5 w-3.5" />
        </span>
        <span className="text-[16px] font-bold text-ink">{title}</span>
        {caption && <Caption>{caption}</Caption>}
      </summary>
      <div className="pb-4 pl-9 text-[15px] leading-[1.65] text-ink">{children}</div>
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
      className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft text-accent transition hover:bg-grad hover:text-white"
    >
      <SpeakerIcon playing={playing} />
    </button>
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
    synonym_cluster,
    tricky_senses = [],
    antonyms = [],
    difficulty,
  } = data

  const openEtymology = mode === 'recall'

  return (
    <article className="overflow-hidden rounded-card border border-rule bg-surface shadow-card">
      {/* Dải gradient mảnh trên đỉnh thẻ */}
      <div className="h-1.5 w-full bg-grad" />

      <div className="p-6 sm:p-7">
        {/* ── Đầu thẻ ── */}
        <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 className="font-display text-[40px] font-bold leading-none tracking-tight text-grad">
            {word}
          </h2>
          {ipa && <span className="ipa text-[17px] text-muted">{ipa}</span>}
          <AudioButton word={word} />
          <a
            href={youglishUrl(word)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-rule px-3 py-1 text-[13px] font-semibold text-accent hover:bg-accent-soft"
          >
            <ExternalIcon className="h-3.5 w-3.5" /> Youglish
          </a>

          <div className="ml-auto flex items-center gap-3">
            {typeof difficulty === 'number' && (
              <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-bold text-accent">
                khó {difficulty}/5
              </span>
            )}
            {onToggleSave && (
              <button
                type="button"
                onClick={onToggleSave}
                aria-pressed={saved}
                aria-label={saved ? 'Bỏ lưu từ' : 'Lưu vào bảng từ'}
                title={saved ? 'Bỏ lưu' : 'Lưu vào bảng từ'}
                className={`grid h-9 w-9 place-items-center rounded-full transition ${
                  saved ? 'bg-grad text-white shadow-soft' : 'bg-accent-soft text-accent hover:bg-grad hover:text-white'
                }`}
              >
                <BookmarkIcon filled={saved} />
              </button>
            )}
          </div>
        </header>

        {syllable_stress && (
          <p className="mt-1.5 font-data text-[12px] text-muted">{syllable_stress}</p>
        )}

        {/* Hàng nhãn */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          {part_of_speech.length > 0 && (
            <span className="font-display text-[14px] font-medium italic text-muted">
              {part_of_speech.join(', ')}
            </span>
          )}
          <RegisterChip value={register} />
          {connotation && <ConnotationDot value={connotation} />}
          {fromCache && <Caption className="ml-auto">cache</Caption>}
        </div>

        <div className="mt-4">
          {/* ── Nghĩa (B1) — luôn mở ── */}
          <Section title="Nghĩa" caption="B1" open>
            <p className="font-display text-[20px] font-medium text-ink">{core_meaning_en}</p>
            {vi_anchor && (
              <p className="mt-1.5 text-[16px] font-medium text-muted">
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
                  <span className="font-display text-[18px] font-bold text-grad">
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
                    <p className="font-display text-[15px] italic text-ink">“{e.sentence}”</p>
                    {e.why && <p className="mt-1 text-[14px] text-muted">↳ {e.why}</p>}
                  </li>
                ))}
              </ul>
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
                      <p className="font-display text-[14px] italic text-muted">“{t.example}”</p>
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
