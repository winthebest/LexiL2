# Thiết kế Storage: **Thư viện từ vựng GRE L2**
*Tài liệu thiết kế lớp dữ liệu — đi kèm file kế hoạch & file UI/UX*

---

## 1. Mục tiêu & nguyên tắc

Store này trả lời hai câu: *"Mỗi từ nhập vào thì lưu cái gì?"* và *"Lưu sao để lần sau coi lại thật nhanh?"*

Ba nguyên tắc định hình mọi quyết định:

1. **Store là *thư viện enrich + lớp cá nhân của bạn*, KHÔNG phải bản sao của Magoosh.** Magoosh đã làm spaced-repetition (xem ảnh: New → Learning → Reviewing → Mastered). Vì thế store **không cố làm lịch ôn canh ề**; nó giữ thứ Magoosh *không có*: thẻ enrich giàu thông tin, mnemonic/ví dụ *do bạn tự làm*, và liên kết theo cụm đồng nghĩa / gốc từ. State học chỉ lưu **vừa đủ** để chạy drill riêng của app + tính 2 metric thật + gắn cờ leech.
2. **Tách lớp dữ liệu.** Nội dung do AI sinh (`card`) tách khỏi metadata (`meta`), tách khỏi đồ cá nhân (`mine`), tách khỏi trạng thái học (`state`). Lý do: khi *enrich lại* bằng model tốt hơn, `card` bị ghi đè nhưng **mnemonic và ví dụ của bạn không mất**.
3. **Backup là sống còn.** Bạn sẽ đổ công vào mnemonic tự chế + câu tự viết. `localStorage` có thể bị trình duyệt xóa sạch bất cứ lúc nào. Mất store = mất công sức không lấy lại được → **xuất JSON một-cú-bấm + nhắc backup định kỳ là bắt buộc**, không phải tùy chọn.

---

## 2. Lưu GÌ cho mỗi từ — bản ghi `WordRecord` (4 lớp)

```ts
interface WordRecord {
  // ── ĐỊNH DANH ──
  id: string;          // headword chuẩn hóa: lowercase, trim → "loquacious"
  headword: string;    // dạng hiển thị

  // ── LỚP 1: card (AI sinh — schema ở Mục 5 file kế hoạch) ──
  card: {
    ipa: string;
    syllable_stress: string;
    part_of_speech: string[];
    register: string;                 // formal | neutral | literary...
    connotation: "positive" | "negative" | "neutral";
    core_meaning_en: string;          // định nghĩa B1
    vi_anchor: string;                // mỏ neo tiếng Việt ngắn
    etymology: {
      breakdown: { part: string; type: string; meaning: string; origin: string }[];
      confidence: "high" | "medium" | "low";
      note: string;
    };
    word_family: { word: string; gloss_en: string; vi: string }[];
    mnemonic_vi: { keyword: string; image: string };
    examples: { sentence: string; why: string }[];
    synonym_cluster: null | {
      theme_vi: string;
      members: { word: string; intensity: number; register: string; note: string }[];
    };
    tricky_senses: { sense_en: string; example: string; trap: string }[];
    antonyms: string[];
    difficulty: number;               // 1–5
  };

  // ── LỚP 2: meta (xuất xứ / phiên bản) ──
  meta: {
    addedAt: number;                  // timestamp lần thêm
    source?: string;                  // "Magoosh: Common Words I"
    model: string;                    // "qwen3.7-plus"
    enrichVersion: number;            // tăng mỗi lần enrich lại
    enrichedAt: number;
    etymologyVerified: boolean;       // bạn đã đối chiếu etymonline chưa
  };

  // ── LỚP 3: mine (CỦA BẠN — giá trị cao nhất, sống sót qua re-enrich) ──
  mine: {
    mnemonic?: string;                // mnemonic bạn tự chế / chọn (đè cái AI)
    examples?: string[];              // câu BẠN viết
    notes?: string;                   // ghi chú tự do
    confusedWith?: string[];          // từ bạn hay lẫn với nó
    tags?: string[];                  // nhãn tự đặt: "đã thuộc chắc", "ôn lại"...
  };

  // ── LỚP 4: state (học — nhẹ; Magoosh giữ lịch chính) ──
  state: {
    status: "new" | "learning" | "known";
    seenCount: number;
    recall: { correct: number; incorrect: number };   // chiều SẢN XUẤT (nghĩa→từ)
    tc: { correct: number; incorrect: number };        // từ ngân hàng đề TC
    isLeech: boolean;                 // quên ≥ 3 lần → cần mã hóa lại
    lastReviewedAt?: number;
    archived?: boolean;               // xóa mềm (đừng hard-delete)
  };
}
```

**Vì sao 4 lớp:** `card` = AI, thay được; `meta` = biết từ này từ đâu/model nào/phiên bản nào; `mine` = thứ *chỉ bạn* tạo ra và *tuyệt đối không được mất* khi enrich lại; `state` = đủ để app tự test + tính metric, không lấn việc Magoosh. Khi muốn hiển thị, ưu tiên `mine.mnemonic` rồi mới tới `card.mnemonic_vi` (đồ tự chế nhớ hơn).

---

## 3. Các store khác

```ts
// Ngân hàng đề TC (Pha 2b) — khóa ngoài tới từ
interface TCQuestion {
  id: string;
  wordId: string;                     // ← WordRecord.id
  sentence: string; options: {id:string; word:string}[];
  answer: string; rationale: string; signalWords: string[];
  acceptedAt: number;                 // đã qua verify
  seen: boolean;                      // đừng lặp y câu cũ
  flags?: ("two_answers"|"too_easy"|"wrong_key"|"awkward")[];
}

// Nhật ký ôn — append-only, để DẪN XUẤT 2 metric (đừng lưu metric cứng)
interface ReviewEvent {
  ts: number; wordId: string;
  mode: "recall" | "tc" | "synonym";
  result: "correct" | "incorrect";
  gradedAs?: "forgot" | "hard" | "ok" | "easy";   // nút tự chấm
}

interface Settings {
  model: string;                      // qwen3.7-plus
  dailyNewLimit: number;              // ~10–20 (xem chiến lược deck)
  theme: "light" | "dark";
  lastBackupAt?: number;
  // ⚠️ KHÔNG lưu API key dạng plaintext ở store dùng chung — xem Mục 8
}
```

**Index dẫn xuất (không cần là store riêng, có thể tính khi cần):**
- **`clusterIndex`**: `theme_vi → [wordId]` — để duyệt theo cụm đồng nghĩa (signature). Tính từ `card.synonym_cluster` của các từ.
- **`rootIndex`**: `root → [wordId]` — để duyệt họ từ cùng gốc. Tính từ `card.etymology.breakdown`.

---

## 4. Chọn công nghệ lưu trữ

| | localStorage | **IndexedDB (qua Dexie.js)** ← khuyến nghị |
|---|---|---|
| Dung lượng | ~5MB (1000 thẻ giàu + đề TC sẽ **tràn**) | hàng trăm MB |
| Kiểu | chỉ string (phải `JSON.stringify` cả khối) | object + **index + query** thật |
| Truy vấn | tự lọc trong JS (chậm khi nhiều) | `where('status').equals('learning')`... |

- **Khuyến nghị:** dùng **Dexie.js** (wrapper IndexedDB nhẹ) làm store chính. Khai báo object stores: `words`, `questions`, `reviewLog`, `settings`. Đánh index trên `words`: `status`, `source`, `card.difficulty`, `card.connotation`, `meta.addedAt`, `state.isLeech`.
- **MVP nhanh:** nếu mới bắt đầu và < ~200 từ, `localStorage` tạm được; nhưng chuyển Dexie *trước khi* store phình to.
- **Caveat:** `localStorage`/IndexedDB **không chạy trong artifact trên Claude.ai** (xem Mục 4.4 file kế hoạch); app thật bạn deploy/chạy local thì bình thường.

---

## 5. Cách "coi lại thuận tiện" — các lens & truy vấn (phần cốt lõi bạn hỏi)

Đây là lý do store tồn tại: 6 cách *vào lại* dữ liệu, map thẳng sang màn hình ở file UI/UX.

1. **Library list** — danh sách tất cả từ, với:
   - **Tìm:** theo headword / nghĩa / `vi_anchor` / gốc từ.
   - **Lọc:** status • deck nguồn • connotation • register • difficulty • leech ⚑ • "có mnemonic của tôi" • tag • thêm sau ngày X.
   - **Sắp xếp:** A–Z • mới thêm • độ khó • hay quên nhất • vừa ôn gần đây.
2. **Single card** — xem một thẻ đầy đủ (tái dùng view ENCODE).
3. **Cluster lens** ★ — duyệt theo *cụm đồng nghĩa* (dùng `clusterIndex`), hiển thị bằng **phổ cường độ** (signature). Đây là nơi store phát huy: thấy cả họ "phê phán" cạnh nhau theo sắc thái.
4. **Family / root lens** — duyệt *họ từ cùng gốc* (dùng `rootIndex`): mở gốc `loqu` → thấy loquacious, eloquent, circumlocution... học cả cụm.
5. **Leech list** — chỉ những từ `isLeech`, để **mã hóa lại** (mnemonic mới), đừng lặp thẻ cũ.
6. **Surfacing ngẫu nhiên / "từ hôm nay"** — bốc đại vài từ cũ cho ôn tình cờ.

> Mẹo: với người Việt, hai lens **cluster** và **root** là thứ Magoosh *không có* và giá trị nhất khi coi lại — chúng biến "1000 từ rời" thành "các họ có quy luật".

---

## 6. API store (các hàm cần implement)

```ts
// ── Thêm / sửa / vòng đời ──
addWord(headword, source?)            // enrich (kiểm cache trước) → chuẩn hóa → lưu (chống trùng)
getWord(id) / updateWord(id, patch)
archiveWord(id)                       // xóa MỀM (state.archived = true)
reEnrich(id)                          // gọi model lại → ghi đè `card`, GIỮ `mine`, bump enrichVersion

// ── Truy xuất (Mục 5) ──
searchWords(query)                    // headword | core_meaning_en | vi_anchor | root
filterWords({status, source, connotation, register, difficulty, isLeech, hasMine, tag, addedAfter})
sortWords(by)
getCluster(theme) / listClusters()
getFamily(root)   / listRoots()
getLeeches()

// ── Ôn / metric ──
logReview(event)                      // cập nhật state.recall|tc + append reviewLog; tự set isLeech khi incorrect ≥ 3
computeMetrics()                      // → { recallFirstTry: %, tcAccuracy: % }  (2 metric ở Mục 0.5)

// ── Ngân hàng đề ──
getQuestionsFor(wordId) / addQuestion(q) / flagQuestion(id, flag) / markSeen(id)

// ── Cache / xuất / nhập / backup ──
cacheGet(word) / cacheSet(word, card) // tránh tốn token lại (store từ ĐÃ enrich chính là cache)
exportAnki()                          // CSV/deck cho Anki
exportJSON() / importJSON(file)       // backup & khôi phục toàn bộ
bulkImport(words[])                   // nhập cả một deck Magoosh một lượt
backupNow()                           // ghi snapshot + cập nhật Settings.lastBackupAt
```

---

## 7. Tiện ích nên thêm (từ kinh nghiệm — phần bạn mời tôi bổ sung)

1. **Chuẩn hóa + chống trùng khi thêm.** `id = headword.toLowerCase().trim()`. Từ đã có → *update* chứ không tạo bản trùng. Hỏi: "Từ này đã có, enrich lại?".
2. **Cache token.** Trước khi gọi API, kiểm store: đã enrich rồi thì dùng lại, khỏi tốn quota. (Store ĐÃ enrich *chính là* cache; chỉ cần một cache nhỏ riêng cho từ "xem thử chưa lưu" nếu muốn.)
3. **Versioning + re-enrich an toàn.** Sau này có model tốt hơn → `reEnrich` ghi đè `card`, **giữ nguyên `mine`**, tăng `enrichVersion`. Không bao giờ mất đồ tự chế.
4. **Backup/restore + nhắc định kỳ.** Nút "Xuất JSON" luôn thấy; nếu `now - lastBackupAt > 7 ngày` → nhắc nhẹ "Sao lưu thư viện?". Cho **import lại** để khôi phục khi đổi máy/mất dữ liệu.
5. **Xóa mềm (archive), không hard-delete.** Lỡ tay vẫn khôi phục được; library mặc định ẩn `archived`.
6. **Tự động hóa leech.** `recall.incorrect ≥ 3` (hoặc trượt liên tiếp) → `isLeech = true` → nổi lên Leech lens kèm gợi ý "tạo mnemonic mới". Đây là vòng phản hồi học quan trọng.
7. **Bảo trì liên kết.** Khi thêm từ mới thuộc cụm/gốc đã có → tự nối vào `clusterIndex`/`rootIndex` để lens luôn đầy đủ.
8. **Cờ chất lượng / verify từ nguyên.** Hiện `etymology.confidence`; nút "Đã đối chiếu etymonline" → set `etymologyVerified`. Nút "Thẻ sai" → đánh dấu re-enrich.
9. **Nhập cả deck Magoosh.** `bulkImport` nhận danh sách từ (vd dán cả "Common Words I") → enrich theo lô (dùng `qwen3.6-flash` cho rẻ, kiểm cache) → vào library.
10. **Lịch sử nhẹ + metric dẫn xuất.** Đừng lưu metric cứng; lưu `reviewLog` rồi `computeMetrics()` tính ra → số liệu luôn thật và truy được nguồn.

---

## 8. Quyền riêng tư / API key
Đừng nhét API key vào `Settings` lưu plaintext nếu app có thể deploy. Dùng `.env` lúc dev (xem Mục 4.3 file kế hoạch), hoặc proxy giữ key ở server. Store dữ liệu *học* thì không nhạy cảm; *key* thì có. Tách bạch hai thứ.

---

## 9. Lộ trình build store (theo pha Mục 0.5)
- **v0:** chỉ cần cache enrich (kiểm trùng) + `addWord`/`getWord`. Đủ để máy enrich không gọi lại API thừa.
- **v1:** lên Dexie + Library list (search/filter/sort) + **export/backup**. Đây là lúc store thành "thư viện coi lại được".
- **v2:** Cluster lens + Family lens + nối `questions` (TC bank) + `computeMetrics()`. Đây là giá trị riêng vượt Magoosh.

---

## 10. Anti-pattern (đừng làm)
- **Đừng dựng lại spaced-repetition của Magoosh trong store** — để Magoosh giữ lịch; chỉ mở rộng `state` (thêm ease/interval/due) *nếu* sau này bạn bỏ Magoosh.
- **Đừng hard-delete** — dùng archive.
- **Đừng quên backup** — store không có bản sao = một lần xóa cache là mất hết.
- **Đừng để `mine` bị `card` ghi đè** khi enrich lại — đây là lỗi mất-dữ-liệu đau nhất.
- **Đừng lưu trùng** cùng một từ; chuẩn hóa `id`.
- **Đừng lưu metric cứng** — dẫn xuất từ `reviewLog`.
- **Đừng nhét API key** vào store dùng chung.

---

*Nguyên tắc để nhớ: store này không phải để *chứa* từ, mà để *coi lại nhanh và mã hóa lại sâu*. Hai thứ quý nhất trong đó là (1) đồ bạn tự tạo — `mine` — và (2) các liên kết cụm/gốc; hãy bảo vệ cái thứ nhất bằng backup, và khai thác cái thứ hai bằng cluster/family lens.*
