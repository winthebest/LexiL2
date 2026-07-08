# CONTRACT — API & Data

> Hợp đồng giữa app và LLM. Đây là **nguồn sự thật** cho request, prompt, và schema JSON.
> Mọi thay đổi schema phải cập nhật ở đây trước, rồi mới sửa code.

## 1. Endpoint

```
POST https://{WorkspaceId}.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions
Authorization: Bearer {VITE_DASHSCOPE_API_KEY}
Content-Type: application/json
```

- `{WorkspaceId}` và key lấy ở Model Studio (region Singapore). Xem ADR-0003/0005.

## 2. Request body

```json
{
  "model": "qwen3.7-plus",
  "messages": [
    { "role": "system", "content": "<PROMPT LÕI mục 4>" },
    { "role": "user",   "content": "<từ cần tra>" }
  ],
  "response_format": { "type": "json_object" },
  "temperature": 0.7,
  "enable_thinking": false
}
```

Quy tắc bắt buộc (ADR-0004):
- **CÓ** `response_format: {"type":"json_object"}`.
- **KHÔNG** set `max_tokens`.
- **Tắt** thinking (`enable_thinking: false`).

## 3. Response → parse

```
data.choices[0].message.content  → chuỗi JSON → JSON.parse() → WordData
```

Bọc `JSON.parse` trong try/catch. Lỗi → ném lên cho UI hiện thông báo + cho retry.

## 4. Prompt lõi (system message) — nguyên văn

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
- `collocations`: include 4-7 common, natural collocations for the target word.
  Prefer academic, formal, or GRE-relevant collocations when they are natural and commonly used.
  Each item must be a short phrase, such as "an impertinent remark" or "pose a threat", not a full sentence.
  Include a mix of common patterns when applicable: adjective+noun, verb+noun, noun+verb, adverb+adjective, or prepositional phrases.
  Do not invent rare, awkward, or technically possible but unnatural combinations.
  If the word has limited natural collocations, provide fewer high-quality collocations rather than forcing the count.
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
  "syllable_stress": string,
  "part_of_speech": string[],
  "register": string,
  "connotation": string,
  "core_meaning_en": string,
  "vi_anchor": string,
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
  "collocations": [
    {
      "phrase": string,
      "pattern": string,
      "vi": string,
      "example": string,
      "note": string,
      "register": string
    }
  ],
  "synonym_cluster": null | {
    "theme_vi": string,
    "members": [
      { "word": string, "intensity": number, "register": string, "note": string }
    ]
  },
  "tricky_senses": [ { "sense_en": string, "example": string, "trap": string } ],
  "antonyms": string[],
  "difficulty": number
}

The word is:
```

> User message = chỉ tên từ (vd: `loquacious`).

## 5. Schema WordData (chuẩn hóa cho code)

| Field | Kiểu | Bắt buộc | Ghi chú render |
|---|---|---|---|
| `word` | string | ✓ | header |
| `ipa` | string | ✓ | header, vd `/loʊˈkweɪʃəs/` |
| `syllable_stress` | string | ✓ | vd `loh-KWAY-shuhs` |
| `part_of_speech` | string[] | ✓ | nhãn nhanh |
| `register` | string | ✓ | `neutral`/`formal`/`literary`/… |
| `connotation` | string | ✓ | `positive`/`negative`/`neutral` |
| `core_meaning_en` | string | ✓ | mục Nghĩa (B1), mở sẵn |
| `vi_anchor` | string | ✓ | gloss Việt 1–4 từ |
| `etymology.breakdown[]` | {part,type,meaning,origin} | ✓ | mục Gốc từ |
| `etymology.confidence` | string | ✓ | badge high/medium/low |
| `etymology.note` | string | ✓ | ghi chú |
| `word_family[]` | {word,gloss_en,vi} | ✓ (có thể rỗng) | họ từ |
| `mnemonic_vi` | {keyword,image} | ✓ | mục Mnemonic |
| `examples[]` | {sentence,why} | ✓ | mục Ví dụ |
| `collocations[]` | {phrase,pattern,vi,example,note,register} | ✓ (có thể rỗng) | mục Collocations |
| `synonym_cluster` | null \| {theme_vi, members[]} | ✓ (nullable) | ẩn mục nếu null |
| `synonym_cluster.members[]` | {word,intensity,register,note} | — | bảng sắc thái |
| `tricky_senses[]` | {sense_en,example,trap} | ✓ (có thể rỗng) | ẩn nếu rỗng |
| `antonyms` | string[] | ✓ | mục Trái nghĩa |
| `difficulty` | number 1–5 | ✓ | badge header |

### Quy ước phòng thủ khi render
- `synonym_cluster === null` → ẩn mục Cụm đồng nghĩa.
- `collocations.length === 0` → ẩn mục Collocations.
- `tricky_senses.length === 0` → ẩn mục Nghĩa bẫy.
- `word_family.length === 0` → vẫn hiện mục Gốc từ (chỉ etymology).
- Field thiếu → coi như rỗng, không vỡ UI.

## 6. Ví dụ output đầy đủ (`loquacious`)

Xem khối JSON mẫu trong kế hoạch gốc (`ke-hoach-gre-vocab-l2-companion.md` mục 5.2).
Dùng làm fixture cho test render `WordCard` ở chế độ offline.

## 7. Endpoint proxy (frontend gọi cùng origin)

Frontend KHÔNG gọi thẳng DashScope mà gọi proxy dev (ADR-0005). Hai endpoint:

### 7.1 `POST /api/enrich` (v0)
- Request: `{ "word": string }`
- Response 200: `{ "data": WordData }` (schema mục 5)
- Lỗi: `{ "error": string }` với mã 400/500/502/…

### 7.2 `POST /api/passage` (v2 — đoạn văn ngữ cảnh)
- Request: `{ "words": string[] (>=2), "level": "B1"|"B2"|"C1" }`
- System prompt: `PASSAGE_PROMPT` (src/lib/prompt.js).
- User message: `JSON.stringify({ level, target_words })`.
- Response 200: `{ "data": { "passage": string, "title_vi": string, "targets_used": string[] } }`
  - `passage` bọc mỗi từ đích trong `[[...]]` để frontend tô sáng.
- Lỗi: `{ "error": string }`.

### 7.3 `POST /api/generate` (Pha 2b — sinh câu TC)
- Request: `{ "word": string, "info": {meaning,register,connotation}, "cluster": string[], "pool": string[] }`
- System prompt: `GENERATOR_PROMPT`. Model: mặc định (`qwen3.7-plus`), `temperature: 0.9`.
- User message: `JSON.stringify({ TARGET_WORD, TARGET_INFO, CLUSTER, POOL })`.
- Response 200: `{ "data": { target_word, logic_relation, signal_words[], sentence, options[5]{id,word}, intended_answer, rationale, distractors[]{id,why_wrong} } }`
- `sentence` chứa đúng một `____`. `options` đúng 5, id A–E.

### 7.4 `POST /api/verify` (Pha 2b — kiểm chứng độc lập)
- **Call riêng, context sạch, model mạnh hơn** (`qwen3.7-max`), `temperature: 0`. KHÔNG nhận `intended_answer`/`rationale`.
- Request: `{ "sentence": string, "options": [{id,word}] (đúng 5) }`
- System prompt: `VERIFIER_PROMPT`.
- Response 200: `{ "data": { best_answer, all_fitting[], reasoning, confidence:"high|medium|low" } }`
- **Accept** (lib/questions.js) khi: `best_answer === intended_answer` & `all_fitting.length === 1` & `all_fitting[0] === intended_answer` & `confidence !== "low"`. Sai → sinh lại ≤ 3 lần, log reject.

### 7.5 Cổng điều kiện (lib/gates.js) — ép kỷ luật lộ trình Mục 0.5
| Tính năng | Mở khóa khi |
|---|---|
| Xuất Anki (Pha 1) | ≥ 5 từ đã lưu |
| Drill phân biệt (Pha 2a) | ≥ 5 từ · ≥ 7 ngày ôn · ≥ 50 lượt ôn |
| Ngân hàng đề (Pha 2b) | ≥ 10 từ · ≥ 14 ngày ôn · ≥ 100 lượt ôn |

Tiến độ ôn ghi ở `lib/progress.js` (theo ngày). Chưa đủ → UI khóa nhưng vẫn cho "Xem thử".
