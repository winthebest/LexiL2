# CARD SPEC — WordCard

> Đặc tả render thẻ từ. Ánh xạ 1–1 với schema ở `contract.md`.

## 1. Bố cục tổng thể

```
┌─────────────────────────────────────────────┐
│   [  ô nhập từ  ............ ]   [ Enrich ]   │  ← Enricher (ngoài thẻ)
├─────────────────────────────────────────────┤
│   loquacious   /loʊˈkweɪʃəs/   🔊  ↗Youglish │  ← Header
│   (adj)  •  formal  •  ⚠ hơi tiêu cực   ⭐4   │  ← Nhãn nhanh + difficulty
│                                               │
│   ▾ Nghĩa (B1)        ← luôn mở               │
│   ▸ Gốc từ + họ từ    ← gập                    │
│   ▸ Mnemonic tiếng Việt                       │
│   ▸ Ví dụ                                      │
│   ▸ Cụm đồng nghĩa (bảng sắc thái)            │
│   ▸ Nghĩa bẫy / nghĩa phụ                      │
│   ▸ Trái nghĩa                                 │
└─────────────────────────────────────────────┘
```

Nguyên tắc chống quá tải (pain #5): chỉ "Nghĩa (B1)" mở sẵn; còn lại gập.

## 2. Header

| Thành phần | Nguồn | Hành vi |
|---|---|---|
| Từ | `word` | chữ to, đậm |
| IPA | `ipa` | xám, mono |
| 🔊 | nút | `say(word)` → `speechSynthesis` |
| ↗Youglish | link | `https://youglish.com/pronounce/{word}/english`, tab mới |
| ⭐ difficulty | `difficulty` | 1–5, badge |

## 3. Nhãn nhanh (1 hàng)

- `part_of_speech.join(", ")` → vd "adj"
- `register` → vd "formal"
- `connotation` → map sang nhãn Việt + icon:
  - `positive` → 🙂 tích cực
  - `negative` → ⚠ tiêu cực
  - `neutral`  → • trung tính

## 4. Bảy mục gập/mở (dùng `<details>`)

### 4.1 Nghĩa (B1) — `open` mặc định
- `core_meaning_en` (chính, to)
- `vi_anchor` (phụ, nhỏ, dạng "neo" tiếng Việt)

### 4.2 Gốc từ + họ từ
- **Etymology:** danh sách `breakdown[]`, mỗi dòng `part` — `meaning` (`origin`).
  - badge `confidence`: high=xanh, medium=vàng, low=đỏ.
  - `note` ở dưới (chữ nghiêng).
- **Họ từ:** `word_family[]` — mỗi dòng `word` · `gloss_en` · `vi`.
- Nếu `word_family` rỗng: chỉ hiện etymology.

### 4.3 Mnemonic tiếng Việt
- `keyword` (đậm, như "móc câu")
- `image` (đoạn mô tả hình ảnh)

### 4.4 Ví dụ
- `examples[]`: câu (đậm/nghiêng phần từ nếu dễ) + dòng `why` (xám, "vì sao câu này").

### 4.5 Cụm đồng nghĩa — **ẩn nếu `synonym_cluster === null`**
- Tiêu đề: `theme_vi`.
- Bảng `members[]`, cột: **Từ | Mức (intensity) | Register | Ghi chú (note)**.
- Sắp theo `intensity` tăng dần. Tô đậm dòng có `word === card.word`.
- intensity render thành thanh/chấm 1–5 cho dễ liếc.

### 4.6 Nghĩa bẫy / phụ — **ẩn nếu `tricky_senses` rỗng**
- Mỗi item: `sense_en` (nghĩa), `example` (ví dụ), `trap` (⚠ cảnh báo bẫy GRE).

### 4.7 Trái nghĩa
- `antonyms[]` render thành các chip.

## 5. Trạng thái UI

| State | Hiển thị |
|---|---|
| idle | chỉ ô nhập + gợi ý "gõ 1 từ GRE" |
| loading | skeleton/spinner trên vùng thẻ, nút Enrich disabled |
| success | WordCard đầy đủ |
| error | banner đỏ + nút "Thử lại"; giữ lại từ vừa gõ |
| from-cache | giống success (có thể badge nhỏ "cache") |

## 6. Component tree (gợi ý)

```
App
├─ Enricher (input + nút)
└─ WordCard
   ├─ CardHeader (word, ipa, 🔊, youglish, difficulty)
   ├─ QuickLabels (pos, register, connotation)
   └─ Section[] (<details>)
      ├─ MeaningSection (open)
      ├─ EtymologySection
      ├─ MnemonicSection
      ├─ ExamplesSection
      ├─ SynonymClusterSection (nullable)
      ├─ TrickySensesSection (nullable)
      └─ AntonymsSection
```

## 7. A11y & phím tắt
- Nút 🔊 có `aria-label="Phát âm"`.
- `<details><summary>` mở/đóng được bằng Enter/Space (native).
- Enter trong ô nhập = Enrich.
