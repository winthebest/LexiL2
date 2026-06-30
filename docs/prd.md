# PRD — GRE Vocab L2 Companion (v0)

> Product Requirements. Cái gì người dùng cần làm được, và app cư xử ra sao.

## 1. Bối cảnh & vấn đề

Người Việt học GRE gặp các pain point mà flashcard tĩnh không giải quyết:

| Pain | Mô tả | Phần thẻ giải quyết |
|---|---|---|
| #1 | Định nghĩa tiếng Anh lại chứa từ khó khác | `core_meaning_en` viết ở B1 (~2000 từ) |
| #2 | Không có cầu nối gốc từ | `etymology` + `word_family` |
| #2b | Từ "trơ", không gắn gốc nào | `mnemonic_vi` (nối âm Anh ↔ hình ảnh Việt) |
| #3 | Dịch tiếng Việt làm sụp đổ phân biệt sắc thái | `synonym_cluster` (xếp theo intensity / register / connotation) |
| #4 | Phát âm bị bỏ rơi | `ipa` + TTS + Youglish |
| #5 | Quá tải nhận thức | thẻ chia mục gập/mở; lần đầu chỉ xem nghĩa lõi + audio |

## 2. Vòng lặp cốt lõi

```
[gõ 1 từ] → [gọi Qwen 1 prompt] → [JSON có cấu trúc] → [dựng WordCard]
```

Mọi enrichment chạy **tự động** trong 1 bước. Không có nút riêng cho từng feature.

## 3. User stories (v0)

- **US-1** — Là người học, tôi gõ một từ và bấm Enrich để nhận thẻ đầy đủ.
- **US-2** — Tôi thấy ngay nghĩa B1 + IPA + audio mà không phải mở gì thêm (chống quá tải).
- **US-3** — Tôi bấm mở từng mục (gốc từ, mnemonic, ví dụ, đồng nghĩa, nghĩa bẫy, trái nghĩa) khi cần.
- **US-4** — Tôi bấm 🔊 để nghe máy đọc từ; bấm Youglish để nghe người thật đọc.
- **US-5** — Khi tôi gõ lại từ đã tra, app trả kết quả tức thì từ cache.
- **US-6** — Khi API lỗi hoặc JSON hỏng, app báo lỗi rõ ràng và cho thử lại.

## 4. Yêu cầu chức năng

### FR-1 Ô nhập & Enrich
- Input text + nút **Enrich**. Enter cũng kích hoạt.
- Trim, lowercase để chuẩn hóa key cache. Bỏ qua chuỗi rỗng.
- Trong lúc gọi: nút disabled + trạng thái loading.

### FR-2 Gọi LLM
- POST tới endpoint OpenAI-compatible của Qwen (xem `contract.md`).
- `model: "qwen3.7-plus"`, system = prompt lõi, user = từ.
- `response_format: {type:"json_object"}`. **Không** `max_tokens`. Tắt thinking.
- Parse `JSON.parse(choices[0].message.content)` trong try/catch.

### FR-3 WordCard
- **Header:** từ • IPA • 🔊 • ↗Youglish.
- **Nhãn nhanh:** part_of_speech • register • connotation (sắc thái).
- **7 mục gập/mở** (dùng `<details>`):
  1. Nghĩa (B1) — `core_meaning_en` + `vi_anchor` — **mở sẵn (`open`)**.
  2. Gốc từ + họ từ — `etymology` (+ badge confidence) + `word_family`.
  3. Mnemonic tiếng Việt — `mnemonic_vi.keyword` + `image`.
  4. Ví dụ — `examples[]` (sentence + why).
  5. Cụm đồng nghĩa — bảng `synonym_cluster.members` (ẩn mục nếu null).
  6. Nghĩa bẫy / phụ — `tricky_senses[]` (ẩn nếu rỗng).
  7. Trái nghĩa — `antonyms[]`.
- Badge `difficulty` (1–5) ở header.

### FR-4 Audio & Youglish
- `say(word)` = `speechSynthesis.speak(new SpeechSynthesisUtterance(word))`.
- Youglish = link mở tab mới.

### FR-5 Cache
- Key = từ đã chuẩn hóa. Lưu object JSON vào `localStorage`.
- Tra cache trước khi gọi API.

## 5. Yêu cầu phi chức năng

- **Hiệu năng:** kết quả cache trả < 50ms; gọi API hiển thị loading.
- **Độ bền:** JSON hỏng / mạng lỗi không làm vỡ UI.
- **Chi phí:** cache + prompt ngắn (~1.5–2K token) → nằm trong free quota.
- **A11y:** nút có aria-label; `<details>` cho phép keyboard.

## 6. Chỉ số thành công

- Tra 1 từ → thẻ đúng schema, không lỗi parse, trong < 1 lần thử lại.
- Tra lại từ đã có → 0 lần gọi API.

## 7. Liên kết

- Phạm vi: `scope.md`
- Quyết định kỹ thuật: `adr.md`
- Hợp đồng dữ liệu/API: `contract.md`
- Đặc tả render thẻ: `card.md`
