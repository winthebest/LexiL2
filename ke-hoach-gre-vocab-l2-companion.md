# Kế hoạch xây dựng: **GRE Vocab L2 Companion**
*Công cụ cá nhân — tối ưu cho người Việt học 1000 từ GRE*
*LLM: Qwen (Alibaba Cloud Model Studio) — OpenAI-compatible + JSON mode. Mặc định `qwen3.7-plus`.*

---

## 0. Sản phẩm này là gì (1 dòng)

> Nhập **một** từ GRE → AI tự sinh ra một **"thẻ từ" hoàn chỉnh tối ưu cho người Việt**, gom tất cả phần xử lý L2 vào một lần.

Đây **không** phải app thay Magoosh (Magoosh lo lịch ôn + danh sách từ). Đây là **lớp xử lý cho người Việt** đặt song song: bạn thấy một từ khó ở Magoosh → đưa vào đây → nhận lại đúng những thứ flashcard tĩnh không cho bạn.

---

## 0.5 North star & thứ tự ưu tiên (ĐỌC TRƯỚC KHI BUILD BẤT CỨ GÌ)

**North star.** Mục tiêu không phải "có một app từ vựng tốt" mà là **bạn thuộc và dùng được 1000 từ GRE**. App chỉ tồn tại để làm 3 việc học có đòn bẩy cao nhất trở nên dễ + cá nhân hóa hơn: **mã hóa sâu → truy hồi đều → test sát đề thật**. Mỗi quyết định build soi qua một câu: *"cái này có làm tốt hơn một trong ba việc đó không?"* — không thì cắt.

**Hai metric thật (đừng đo cái khác).** Bỏ qua "số thẻ đã enrich" / "số feature đã xong" (vanity metric — tăng đều mà chẳng chứng minh bạn giỏi hơn). Chỉ đo:
1. **% thẻ đến hạn gọi-ra-đúng ngay lần đầu** (giữ được trí nhớ).
2. **Độ chính xác trên Text Completion / Sentence Equivalence** (dùng được trong ngữ cảnh — thứ GRE thật sự chấm).

Nâng cấp nào không kéo được một trong hai số này lên = trang trí.

**Lộ trình 4 pha** (app build gì ↔ để học gì):

| Pha | App build gì | Để học gì | Khi nào |
|---|---|---|---|
| **0** | v0 enrich (hoặc chỉ prompt Mục 5 + Anki tay) | Mã hóa sâu từ mới + recall đến hạn trên Magoosh, mỗi ngày | **Ngay tuần này** |
| **1** | Storage + bảng từ + **export Anki** (đừng xây lại SRS) | Đưa thẻ vào hệ ôn cách quãng thật — nơi trí nhớ hình thành | Sau ~2 tuần recall đều |
| **2a** | Drill phân biệt **cụm đồng nghĩa** (tái dùng `synonym_cluster`) | Sắc thái/register — điểm yếu L2 + thứ GRE chấm gắt nhất | Khi Pha 0–1 thành thói quen |
| **2b** | **Ngân hàng đề generate→verify** (TC 1 chỗ trống) | Test sát đề thật, lôi ra từ "tưởng thuộc mà không dùng được" | Sau cùng (khó-làm-đúng nhất) |
| **3** | Đánh bóng: drill nghe, thư viện mnemonic, cờ leech, batch... | Tùy chọn — đa số người không cần | Chỉ khi việc học chỉ ra nút thắt thật |

**Cổng chặn:** chưa cày recall đều ~2 tuần thì **chưa đủ dữ liệu để biết nên build gì tiếp** → đừng nhảy cóc qua Pha 0.

**Anti-goals (cắt thẳng):** không cào/tái hiện đề ETS (bản quyền); không xây lại SRS; không làm TC nhiều chỗ trống / Sentence Equivalence ở giai đoạn đầu; không fine-tune/ML; không đuổi theo "mnemonic hoàn hảo" cho từng từ. Mỗi thứ cắt đi là thời gian dồn cho việc thật.

**Chi phí cơ hội (nói một lần, thẳng):** mỗi giờ ngồi code = một giờ *không* cày recall — mà recall mới làm bạn thuộc từ. **v0 + export Anki là đã đủ để thi tốt.** Build thêm hoàn toàn ổn nếu bạn quý việc build vì chính nó — chỉ đừng nhầm "thêm feature" với "tiến bộ về mục tiêu".

> **Mantra:** Build cái tối thiểu để mở khóa vòng học, rồi ngừng build và bắt đầu cày; chỉ quay lại code khi chính việc học chỉ ra một nút thắt thật.

---

## 1. Vòng lặp cốt lõi (the core loop)

```
[Bạn gõ 1 từ]  →  [App gọi Qwen với 1 prompt]  →  [model trả JSON có cấu trúc]  →  [App dựng thành "thẻ từ"]
```

Mọi feature enrichment chạy **tự động** trong bước này. Không có nút bấm riêng cho từng feature — gõ từ là ra hết.

### Hai loại feature (để rõ phạm vi)

| Nhóm | Khi nào chạy | Thuộc phiên bản |
|---|---|---|
| **A. Enrichment** (định nghĩa rút gọn, gốc từ + họ từ, mnemonic, IPA + audio, ví dụ, cụm đồng nghĩa, nghĩa bẫy) | **Tự động mỗi khi nhập từ** | **v0** (làm trước) |
| **B. Ôn tập theo thời gian** (lưu từ, ôn chủ động, lịch ôn, đoạn văn ngữ cảnh, drill nghe) | Trên các từ **đã lưu**, không gắn với việc nhập từ | v1 / v2 (tùy chọn) |

---

## 2. Pain point → phần nào trong thẻ giải quyết

| Pain point (người Việt học GRE) | Phần trong thẻ giải quyết |
|---|---|
| #1 Định nghĩa tiếng Anh chứa từ khó khác | `core_meaning_en` viết ở trình độ B1, ~2000 từ cơ bản |
| #2 Không có cầu nối gốc từ (cognate) | `etymology` (bóc tách gốc) + `word_family` (họ từ cùng gốc) |
| #2b Từ "trơ", không gắn được gốc nào | `mnemonic_vi` (nối âm Anh ↔ hình ảnh Việt) |
| #3 Dịch tiếng Việt làm sụp đổ phân biệt | `synonym_cluster` (xếp theo mức độ / sắc thái / register) |
| #4 Phát âm bị bỏ rơi | `ipa` + nút TTS + link Youglish |
| #5 Quá tải nhận thức | Thẻ chia **mục gập/mở**; lần đầu chỉ xem nghĩa lõi + audio |
| (bonus) Từ tần suất thấp không được củng cố | Đoạn văn ngữ cảnh — **v2** |

---

## 3. Đặc tả v0 — màn hình **Enricher**

### 3.1 Giao diện (1 màn hình duy nhất)

```
┌─────────────────────────────────────────────┐
│   [  ô nhập từ  ............ ]   [ Enrich ]   │
├─────────────────────────────────────────────┤
│   loquacious   /loʊˈkweɪʃəs/   🔊  ↗Youglish │
│   (adj)  •  formal  •  ⚠ hơi tiêu cực         │
│                                               │
│   ▸ Nghĩa (B1)        ← luôn mở               │
│   ▸ Gốc từ + họ từ    ← gập, bấm để mở        │
│   ▸ Mnemonic tiếng Việt                       │
│   ▸ Ví dụ                                      │
│   ▸ Cụm đồng nghĩa (bảng sắc thái)            │
│   ▸ Nghĩa bẫy / nghĩa phụ                      │
│   ▸ Trái nghĩa                                 │
└─────────────────────────────────────────────┘
```

**Nguyên tắc chống quá tải (pain #5):** chỉ mục "Nghĩa (B1)" mở sẵn; các mục còn lại **gập lại**, bạn bấm để mở khi cần. Lần gặp đầu chỉ liếc nghĩa + nghe phát âm là đủ.

### 3.2 Các phần hiển thị của thẻ
Ánh xạ 1–1 với JSON ở Mục 5: tiêu đề (từ + IPA + audio + Youglish), nhãn nhanh (loại từ • register • sắc thái), rồi 7 mục gập/mở.

### 3.3 Audio + IPA + Youglish
- **TTS:** dùng sẵn của trình duyệt — `speechSynthesis` (miễn phí, không cần thư viện).
- **Youglish:** chỉ là một link — `https://youglish.com/pronounce/{word}/english` — để nghe từ trong video thật.
- **IPA:** lấy thẳng từ JSON model trả về.

---

## 4. Kiến trúc kỹ thuật

### 4.1 Stack đề xuất (cho người code được chút)
- **Vite + React** — chuẩn, nhẹ, chạy `npm run dev` là có ngay. (Nếu muốn tối giản hơn nữa: một file `index.html` + React qua CDN cũng được, nhưng Vite dễ mở rộng về sau.)
- **Tailwind CSS** — để style nhanh, khỏi viết CSS tay (tùy chọn).
- **Không cần backend cho v0** nếu chạy local (xem cảnh báo bảo mật ở 4.3).

### 4.2 Luồng dữ liệu
```
WordInput (state: từ)
   └─ gọi enrichWord(word)
        └─ fetch → Qwen (endpoint OpenAI-compatible, prompt ở Mục 5)
             └─ response_format:json_object → JSON.parse(choices[0].message.content)
                  └─ render <WordCard data={...} />
```

### 4.3 API key & bảo mật ⚠️ (đọc kỹ)
Lấy **API key** ở Alibaba Cloud **Model Studio** (`modelstudio.console.alibabacloud.com`), chọn **region Singapore (ap-southeast-1)** — vì free quota chỉ tồn tại ở khu vực này. Key có dạng `sk-...`. Có 2 đường dùng:

- **Đường nhanh (chỉ chạy local, KHÔNG deploy công khai):** để key trong `.env` với tiền tố `VITE_`. Lưu ý: tiền tố `VITE_` **đẩy key vào bundle trình duyệt** → chỉ an toàn khi máy bạn tự dùng, tuyệt đối đừng deploy công khai. Gọi thẳng từ trình duyệt cũng có thể vướng **CORS**.
- **Đường an toàn (khuyến nghị nếu sau này deploy):** dựng một **proxy nhỏ** (vài dòng trên Vercel/Cloudflare Worker) giữ key ở server, frontend chỉ gọi proxy. Hết lo lộ key và CORS.

> Bật **"Free Quota Only"** trong console để khi hết quota dịch vụ **dừng** thay vì tự trừ tiền pay-as-you-go.

> Muốn thử nhanh mà chưa cần dựng gì: nhờ tôi dựng prototype ngay trong khung chat (prototype đó chạy bằng Claude, nhưng app thật của bạn trỏ sang Qwen).

Chi tiết model/giá/endpoint cập nhật tại `https://www.alibabacloud.com/help/en/model-studio`.

### 4.4 (Tùy chọn, cho v1) Lưu trữ
App của riêng bạn (deploy thật/chạy local) thì **dùng `localStorage` được bình thường** — lưu danh sách từ đã enrich + mnemonic bạn thích. Nhiều dữ liệu hơn thì chuyển sang IndexedDB. (Cache kết quả còn để khỏi gọi API lại cho cùng một từ → tiết kiệm.)

### 4.5 Chọn model & chia quota free (Qwen)
Mỗi model đủ điều kiện có **riêng 1 triệu token miễn phí** (region Singapore, hạn 90 ngày) → bạn có thể chia việc cho nhiều model, mỗi cái một suất:

| Model | Vai trò | Giá Singapore (~/1M token, input ngắn) |
|---|---|---|
| **`qwen3.7-plus`** | **Mặc định** — mới nhất, bám prompt tốt, JSON mode ổn định | ~$0.32 in / $1.28 out (giá theo bậc; input ngắn của ta ở bậc rẻ) |
| `qwen3.7-max` | Từ khó/quan trọng — nhạy sắc thái + mnemonic sáng tạo nhất | ~$1.25 in / $3.75 out |
| `qwen3.6-flash` | Quét nhanh số lượng lớn / từ dễ | ~$0.19 in / $1.13 out |

- **Alias vs ghim:** `qwen-plus` là alias ổn định (không đổi giữa các bản, ~$0.40/$1.20); `qwen3.7-plus` là bản mới nhất được "ghim" (rẻ hơn cho input ngắn). App cá nhân nên **ghim `qwen3.7-plus`** để chủ động.
- App này **không cần "thinking mode"** — tắt nó đi: vừa rẻ/nhanh hơn, vừa là điều kiện bắt buộc để dùng JSON mode.
- Prompt mỗi từ rất ngắn (~1.5–2K token) → luôn nằm ở bậc giá rẻ; cộng với cache, free quota dư cho cả list 1000 từ.

---

## 5. ⭐ Prompt lõi + JSON schema + ví dụ (trái tim của app)

### 5.1 Prompt gửi cho model
> Gửi nguyên văn dưới đây làm **system message**, rồi đưa tên từ vào **user message**. Khuyến nghị model: `qwen3.7-plus` (mặc định); từ khó thì `qwen3.7-max`. Bật **JSON mode** (`response_format: {"type":"json_object"}`) — prompt đã chứa chữ "JSON" nên hợp lệ, và JSON mode tự ép trả JSON sạch (khỏi phải bóc code fences). **Đừng set `max_tokens`** khi bật JSON mode (dễ cắt cụt JSON).

```text
You are an expert lexicographer and a Vietnamese ESL teacher. Your job is to
turn ONE GRE word into a study card optimized for a VIETNAMESE learner.

Hard rules:
- Write `core_meaning_en` using ONLY common English words (around the most
  frequent 2000). No hard words inside the definition.
- Etymology: give ONLY well-established etymology. Set `confidence` honestly to
  "high" | "medium" | "low". NEVER invent folk etymology to look clever.
- `word_family`: only words that GENUINELY share the same root. If the family is
  small, return a small list. Do not pad it.
- `mnemonic_vi`: create a vivid Vietnamese keyword mnemonic that links the English
  SOUND to the MEANING. Make it concrete and a little absurd (easier to remember).
- `synonym_cluster`: include ONLY if the word belongs to a meaningful GRE synonym
  group; otherwise set it to null. Rank members by intensity and note register +
  connotation so the Vietnamese learner can tell them apart (this is the #1 thing
  Vietnamese translations destroy).
- `tricky_senses`: include the secondary/"trap" senses GRE loves; empty array if none.
- Output STRICT, VALID JSON ONLY. No markdown code fences, no commentary, no preamble.

JSON shape:
{
  "word": string,
  "ipa": string,
  "syllable_stress": string,          // e.g. "loh-KWAY-shuhs"
  "part_of_speech": string[],
  "register": string,                 // "neutral" | "formal" | "literary" | ...
  "connotation": string,              // "positive" | "negative" | "neutral"
  "core_meaning_en": string,          // B1 level, ~2000-word vocabulary
  "vi_anchor": string,                // short Vietnamese gloss (1-4 words)
  "etymology": {
    "breakdown": [
      { "part": string, "type": string, "meaning": string, "origin": string }
    ],
    "confidence": string,
    "note": string
  },
  "word_family": [
    { "word": string, "gloss_en": string, "vi": string }
  ],
  "mnemonic_vi": { "keyword": string, "image": string },
  "examples": [ { "sentence": string, "why": string } ],
  "synonym_cluster": null | {
    "theme_vi": string,
    "members": [
      { "word": string, "intensity": number, "register": string, "note": string }
    ]
  },
  "tricky_senses": [ { "sense_en": string, "example": string, "trap": string } ],
  "antonyms": string[],
  "difficulty": number                // 1-5
}

The word is: 
```

### 5.2 Ví dụ output (từ `loquacious`)
*(Để bạn thấy app sẽ nhận về gì và render thành thẻ ra sao.)*

```json
{
  "word": "loquacious",
  "ipa": "/loʊˈkweɪʃəs/",
  "syllable_stress": "loh-KWAY-shuhs",
  "part_of_speech": ["adjective"],
  "register": "formal",
  "connotation": "neutral",
  "core_meaning_en": "tending to talk a lot",
  "vi_anchor": "lắm lời, hoạt ngôn",
  "etymology": {
    "breakdown": [
      { "part": "loqu", "type": "root", "meaning": "to speak", "origin": "Latin (loqui)" },
      { "part": "-acious", "type": "suffix", "meaning": "tending to / full of", "origin": "Latin" }
    ],
    "confidence": "high",
    "note": "Cùng gốc 'loqu' với rất nhiều từ GRE khác — học gốc này mở khóa cả họ."
  },
  "word_family": [
    { "word": "eloquent", "gloss_en": "fluent and persuasive in speech", "vi": "hùng biện" },
    { "word": "circumlocution", "gloss_en": "using too many words; talking around a point", "vi": "nói vòng vo" },
    { "word": "soliloquy", "gloss_en": "speaking your thoughts aloud when alone", "vi": "độc thoại" },
    { "word": "grandiloquent", "gloss_en": "using big, showy language", "vi": "khoa trương, ba hoa" },
    { "word": "loquacity", "gloss_en": "the quality of talking a lot", "vi": "tính lắm lời" }
  ],
  "mnemonic_vi": {
    "keyword": "loa",
    "image": "Âm đầu 'loqua-' nghe như 'loa'. Hình dung một cái loa phường mở hết cỡ, ra rả nói cả ngày không nghỉ — đó là người loquacious."
  },
  "examples": [
    { "sentence": "The loquacious tour guide barely paused for breath, naming every shop we passed.",
      "why": "Cho thấy sắc thái 'nói nhiều đến mức hơi mệt cho người nghe'." },
    { "sentence": "Normally reserved, she grew surprisingly loquacious after a glass of wine.",
      "why": "Đặt cạnh 'reserved' để làm nổi nghĩa, và cho thấy đây là từ trang trọng." }
  ],
  "synonym_cluster": {
    "theme_vi": "nói nhiều",
    "members": [
      { "word": "talkative",  "intensity": 2, "register": "neutral",  "note": "trung tính, đời thường nhất" },
      { "word": "loquacious", "intensity": 3, "register": "formal",   "note": "trang trọng, trôi chảy, không hẳn chê" },
      { "word": "voluble",    "intensity": 3, "register": "formal",   "note": "nói nhanh, trôi như suối" },
      { "word": "garrulous",  "intensity": 4, "register": "neutral",  "note": "TIÊU CỰC: nói lan man về chuyện vặt" },
      { "word": "verbose",    "intensity": 4, "register": "formal",   "note": "TIÊU CỰC: thừa chữ, nhất là trong VIẾT" }
    ]
  },
  "tricky_senses": [],
  "antonyms": ["taciturn", "reticent", "laconic", "reserved"],
  "difficulty": 4
}
```

---

## 6. Hướng dẫn build từng bước

0. **Lấy API key:** kích hoạt **Model Studio** ở Alibaba Cloud, chọn **region Singapore** (để có free quota), tạo key `sk-...`. Bật "Free Quota Only" cho an toàn.
1. **Dựng dự án:**
   ```bash
   npm create vite@latest gre-l2 -- --template react
   cd gre-l2 && npm install && npm run dev
   ```
2. **Tạo `.env`** (cùng cấp `package.json`):
   ```
   VITE_DASHSCOPE_API_KEY=sk-...
   ```
   (Đọc lại cảnh báo bảo mật ở 4.3.)
3. **Viết `enrichWord(word)`** — `fetch` tới endpoint **OpenAI-compatible** của Qwen (Singapore): `https://{WorkspaceId}.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions` (lấy `WorkspaceId` trong console). Body: `model: "qwen3.7-plus"`, `messages` (system = prompt Mục 5, user = từ), `response_format: {type:"json_object"}`, **không** set `max_tokens`. Parse: `JSON.parse(data.choices[0].message.content)` (bọc `try/catch`).
4. **Tạo `<WordCard data={...} />`** — render các phần theo schema; mỗi mục là một khối **gập/mở** (`<details>` của HTML là cách lười mà hiệu quả).
5. **Thêm phát âm:**
   ```js
   const say = (w) => speechSynthesis.speak(new SpeechSynthesisUtterance(w));
   ```
6. **Thêm link Youglish:** `https://youglish.com/pronounce/${word}/english`.
7. **(v1) Lưu từ:** nút "Lưu" → đẩy object vào `localStorage`; thêm màn hình "Từ đã lưu".
8. **Lặp & tinh chỉnh** prompt cho tới khi thẻ ra đúng ý.

---

## 7. Mở rộng v1 / v2 (tùy chọn — chỉ làm nếu thấy cần)

- **v1 — Lưu & ôn:** lưu thẻ vào `localStorage`; hàng đợi ôn **chủ động** (hiện định nghĩa → bạn *gõ lại* từ, không chỉ lật thẻ).
- **v2 — Lịch ôn thông minh:** thuật toán kiểu SM-2/FSRS để từ khó quay lại dày hơn.
- **v2 — Máy chế tạo ngữ cảnh:** một prompt khác, đưa 5–7 từ đến hạn ôn → model viết một đoạn văn ngắn ở trình độ bạn nhồi đủ các từ đó (chữa gốc rễ: từ hiếm không được củng cố ngoài đời).
- **v2 — Drill nghe:** TTS đọc từ → bạn đoán nghĩa (gắn dấu vết âm thanh).

---

## 8. Rủi ro & lưu ý

| Rủi ro | Cách xử lý |
|---|---|
| AI **bịa từ nguyên** (folk etymology) | Prompt đã ép `confidence` + chỉ dùng gốc đã công nhận; với từ quan trọng nên đối chiếu **etymonline.com** |
| **JSON parse lỗi** | **JSON mode** (`response_format`) gần như loại bỏ; vẫn bọc `try/catch` phòng hờ. Nhớ **không** set `max_tokens` (tránh cắt cụt JSON) và **tắt thinking mode** (không tương thích JSON mode) |
| **Chi phí API** | Mỗi model có **1tr token free** (Singapore, 90 ngày); mỗi từ chỉ ~1.5–2K token; **cache** kết quả để không gọi lại |
| **Lộ API key / CORS** | Xem 4.3 — local để key trong `.env` (đừng deploy công khai); deploy thì dựng proxy nhỏ |
| **TTS đọc sai** từ hiếm | Đối chiếu bằng **Youglish/Forvo** cho những từ lạ |

---

## 9. Checklist bắt đầu

- [ ] Kích hoạt Model Studio (region **Singapore**) + tạo API key + bật "Free Quota Only"
- [ ] `npm create vite` dựng khung React
- [ ] Dán prompt ở Mục 5 vào hàm `enrichWord`
- [ ] Gọi thử với 1 từ, in JSON ra console — chỉnh prompt tới khi đẹp
- [ ] Dựng `<WordCard>` với các mục gập/mở
- [ ] Thêm nút 🔊 (speechSynthesis) + link Youglish
- [ ] (v1) Thêm lưu từ vào localStorage

---

## 10. Pha 2b — Ngân hàng đề GRE: luồng **generate → verify**

> Đây là Pha 2b trong Mục 0.5 — **làm sau cùng**, vì nó *cần* storage (Pha 1) và là phần khó-làm-đúng nhất. Đừng build trước khi vòng recall đã thành thói quen.

### 10.1 Nguyên tắc cốt lõi (đọc kỹ — 90% bản build hỏng ở đây)
Ra đề GRE **không phải bài toán "sinh ra", mà là bài toán "kiểm soát chất lượng".** Một câu Text Completion (TC) đạt chuẩn phải có **đúng MỘT đáp án bị logic của câu ép buộc** (qua tín hiệu tương phản/nhân quả). LLM dở đúng chỗ này: hay đẻ câu mà 2–3 đáp án cùng vừa, hoặc tự chấm sai đáp án của chính nó. Hệ quả bắt buộc: **không bao giờ tin đáp án do model tự gán** → phải tách **sinh** khỏi **kiểm**.

### 10.2 Kiến trúc 2 pass
```
Generator (qwen3.7-plus)
   └─ sinh câu TC + đáp án dự kiến + distractor
        └─ Verifier (qwen3.7-max) — CONTEXT SẠCH, KHÔNG thấy đáp án dự kiến
             └─ tự giải: chọn 1 đáp án tốt nhất + liệt kê MỌI đáp án cũng vừa
                  └─ so khớp → ACCEPT / REJECT → (reject thì sinh lại)
```
Hai điều bắt buộc: (a) verifier chạy ở **call riêng, context sạch** (không nối lịch sử với generator); (b) lý tưởng dùng **model khác/mạnh hơn** generator để tránh "tự đóng dấu cho bài của mình".

### 10.3 Ràng buộc generator (đừng cho tự do)
Không bảo "viết câu GRE cho từ X". Đưa **công thức**: chỉ định quan hệ logic (tương phản / nhân quả / tiếp nối), **bắt buộc có từ-tín-hiệu rõ ràng** (although, because, thus, despite...), và đáp án phải bị tín hiệu đó ép. TC một chỗ trống = **đúng 5 lựa chọn**, target word = đáp án đúng, tất cả cùng từ loại + register gần nhau.

**Chiến lược distractor (chỗ tinh tế nhất):** ưu tiên distractor bị **logic/polarity loại** (từ sẽ vừa *nếu tín hiệu đảo chiều*) — đây mới cho câu một-đáp-án sạch. Near-synonym từ `synonym_cluster` chỉ dùng **khi sắc thái/polarity của câu loại nó rõ ràng**, dùng dè dặt — vì synonym dễ cũng-vừa → câu lủng. (Việc luyện phân biệt thuần near-synonym để dành cho **drill Pha 2a** và cho **Sentence Equivalence** sau này, nơi *cặp* đồng nghĩa mới là thiết kế đúng.) Verifier ở 10.6 chính là lưới chặn các câu lủng này.

### 10.4 Schema JSON

**Generator trả về:**
```json
{
  "target_word": "string",
  "logic_relation": "contrast | cause_effect | continuation",
  "signal_words": ["string"],
  "sentence": "string chứa đúng một ____",
  "options": [ { "id": "A", "word": "string" } ],   // đúng 5, id A–E
  "intended_answer": "A",
  "rationale": "vì sao tín hiệu ép ra target",
  "distractors": [ { "id": "B", "why_wrong": "string" } ]
}
```

**Verifier trả về** (KHÔNG được cho xem `intended_answer`/`rationale`):
```json
{
  "best_answer": "A",
  "all_fitting": ["A"],          // MỌI lựa chọn cũng vừa — phải đúng độ dài 1
  "reasoning": "string",
  "confidence": "high | medium | low"
}
```

### 10.5 Prompt generator
```text
You are a GRE item writer creating ONE single-blank Text Completion question to
test whether a learner can DEPLOY a target word in context (not just recall it).

You are given: TARGET_WORD (must be the correct answer); TARGET_INFO (meaning,
register, connotation); CLUSTER (near-synonyms — possible distractors); POOL
(other same-difficulty words — possible distractors).

Hard requirements:
1. Write ONE sentence (GRE register) with exactly one blank written as "____".
2. Choose a LOGIC RELATION and make it explicit with a SIGNAL WORD:
   - contrast (although, despite, yet, far from, rather than)
   - cause_effect (because, since, thus, consequently, so ... that)
   - continuation/restatement (indeed, in fact, ;, and so)
   The signal must FORCE the blank: a careful reader can defend exactly one option.
3. The correct answer MUST be TARGET_WORD, and its specific MEANING + CONNOTATION
   must be what the sentence requires — not a vague topical fit.
4. Exactly 5 options (target + 4 distractors), same part of speech, similar register.
   Distractors must be PLAUSIBLE BUT WRONG:
   - Prefer distractors ruled out by LOGIC/POLARITY (a word that would fit if the
     signal were reversed). These make clean single-answer items.
   - Use a CLUSTER near-synonym ONLY if the sentence's precise nuance/polarity
     clearly rules it out. If unsure, do not use one.
   - NEVER include two options that both satisfy the sentence. Exactly one fits.
5. Output STRICT VALID JSON only (the given schema). No commentary.
```

### 10.6 Prompt verifier *(call riêng, context sạch)*
```text
You are an expert GRE test-taker. You are given a single-blank Text Completion
sentence and 5 options. You do NOT know the intended answer.

Task:
1. Identify the signal word(s) and the logic relation.
2. Choose the SINGLE best option that the sentence's logic forces.
3. CRITICALLY: list EVERY option that also defensibly fits — be strict and honest.
   A well-formed item has exactly one defensible answer; if you can justify two,
   list both in "all_fitting" (this flags a broken item).
4. Output STRICT VALID JSON only (the given schema). No commentary.
```

### 10.7 Logic chấp nhận / loại
```js
const q = await generate(word, info, cluster, pool); // qwen3.7-plus, JSON mode
const v = await verify(q.sentence, q.options);        // qwen3.7-max, CONTEXT SẠCH, JSON mode

const accept =
  v.best_answer === q.intended_answer &&
  v.all_fitting.length === 1 &&
  v.all_fitting[0] === q.intended_answer &&
  v.confidence !== "low";

if (accept) bank.add(word, q);
else { /* sinh lại ≤ 3 lần; vẫn fail thì bỏ qua từ này trong lô */ }

// LUÔN log mọi lần reject kèm v.all_fitting + v.reasoning → dữ liệu chỉnh prompt
```

### 10.8 Lấy distractor từ storage
Tái dùng dữ liệu sẵn có: truyền `synonym_cluster` của từ làm **CLUSTER**, và vài từ cùng `difficulty` làm **POOL**. Vừa khó thật, vừa không phải tạo data mới (xem lại 10.3 về việc dùng near-synonym dè dặt).

### 10.9 Sinh theo lô + ngân hàng đề
- **Just-in-time:** chỉ sinh cho **từ đến hạn ôn**, KHÔNG sinh trước cả 1000 từ → tiết kiệm quota.
- **Async/qua đêm:** verify nhân đôi số call + chậm → chạy nền cho các từ sắp đến hạn, phục vụ tức thì khi ôn.
- **Cache thành bank:** `word → [câu đã accept]`. Mỗi từ giữ vài câu.
- **Đừng lặp đúng câu cũ:** khi ôn một từ, phục vụ câu **chưa gặp** (hoặc sinh mới). Lặp y câu là test trí nhớ về *câu*, không phải về *từ*.
- **Tách quota:** generator ăn quota `qwen3.7-plus`, verifier ăn quota `qwen3.7-max` → nhân đôi ngân sách free.

### 10.10 Vòng phản hồi chất lượng (bạn = tập eval)
Mỗi câu có nút: **"Hai đáp án đúng" / "Quá dễ" / "Sai đáp án" / "Câu lủng củng".** Log lại để (a) loại câu rác khỏi bank, (b) làm dữ liệu tinh chỉnh prompt generator/verifier. Đây là cái biến quy trình từ cảm tính sang kỹ thuật.

### 10.11 Hiệu chỉnh độ khó bằng đề chính thức ETS (thước đo vàng)
Giữ ~20–40 câu TC **chính thức** (PowerPrep / Official Guide — bạn có quyền dùng hợp pháp). Định kỳ làm xen kẽ vài câu chính thức để **cảm chuẩn độ khó + độ tự nhiên**, rồi so câu AI sinh với chuẩn đó và chỉnh prompt cho khớp register/độ khó. Đây là dùng tài liệu **sở hữu hợp pháp làm thước đo** — **KHÔNG cào/nhân bản đề trên web** (vi phạm bản quyền ETS, và đáp án trên web mở thường rác → học sai).

### 10.12 Phạm vi & anti-pattern
- **Làm trước:** TC **một chỗ trống**. **Để sau:** Sentence Equivalence (cần *cặp* đồng nghĩa làm 2 đáp án đúng — chỗ `synonym_cluster` mới phát huy đúng vai). **Hoãn:** TC nhiều chỗ trống.
- **Anti-pattern (đừng):** tin đáp án model tự gán; bỏ bước verify; dùng toàn near-synonym làm distractor; lặp y đúng câu cũ; **cào đề ETS trên mạng**.
- **Nhớ định nghĩa sản phẩm:** deliverable không phải *"máy sinh câu hỏi"* mà là **"ngân hàng đề đã kiểm chứng, nối vào vòng ôn cách quãng"** — sai một câu thì từ đó **nổi lại** ở hàng ôn VÀ lần sau ra một câu *khác*.

---

*Bước v0 gói gọn đúng cái bạn mô tả: gõ từ → ra thẻ đầy đủ. Mọi thứ ở Mục 7 trở đi là tùy chọn, không bắt buộc.*
