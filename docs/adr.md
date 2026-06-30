# ADR — Architecture Decision Records

> Mỗi mục là một quyết định kiến trúc: bối cảnh → quyết định → hệ quả.
> Trạng thái: Accepted (v0).

---

## ADR-0001 — Stack: Vite + React + Tailwind

**Bối cảnh:** Người dùng code được chút, muốn chạy nhanh và dễ mở rộng.
**Quyết định:** Dùng **Vite + React** (template `react`), style bằng **Tailwind CSS**.
**Lý do:** `npm run dev` là có ngay; HMR nhanh; React dễ chia component (WordCard, các mục gập/mở); Tailwind khỏi viết CSS tay.
**Hệ quả:** Cần Node + npm. Build ra static, deploy được mọi nơi (nhưng xem ADR-0005 về key).
**Phương án loại:** 1 file `index.html` + React qua CDN — tối giản hơn nhưng khó mở rộng v1/v2.

---

## ADR-0002 — LLM: Qwen qua endpoint OpenAI-compatible, ghim `qwen3.7-plus`

**Bối cảnh:** Cần model bám prompt tốt, JSON mode ổn định, rẻ cho input ngắn.
**Quyết định:** Dùng **Qwen** (Alibaba Cloud Model Studio), gọi qua **OpenAI-compatible** API. Mặc định ghim **`qwen3.7-plus`**.
**Lý do:** Mỗi model đủ điều kiện có **1tr token free** (Singapore, 90 ngày). `qwen3.7-plus` mới nhất, input ngắn ở bậc giá rẻ. Ghim bản cụ thể để chủ động giá/hành vi (thay vì alias `qwen-plus`).
**Hệ quả:** Có thể nâng `qwen3.7-max` cho từ khó, `qwen3.6-flash` cho quét nhanh — cấu hình qua biến model.
**Phương án loại:** OpenAI/Claude — không có free quota tương đương cho usecase này.

---

## ADR-0003 — Region Singapore (ap-southeast-1)

**Bối cảnh:** Free quota chỉ tồn tại ở một khu vực.
**Quyết định:** Tạo workspace + key ở **region Singapore**. Endpoint dạng
`https://{WorkspaceId}.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions`.
**Hệ quả:** `WorkspaceId` lấy trong console, đưa vào `.env`. Bật **"Free Quota Only"** để hết quota thì dừng, không tự trừ tiền.

---

## ADR-0004 — JSON mode, không `max_tokens`, tắt thinking

**Bối cảnh:** Cần JSON sạch, không markdown fences, không bị cắt cụt.
**Quyết định:** Bật `response_format: {"type":"json_object"}`. **Không** set `max_tokens`. **Tắt** thinking mode.
**Lý do:** Prompt đã chứa chữ "JSON" (điều kiện hợp lệ). JSON mode tự ép JSON sạch. `max_tokens` dễ cắt cụt JSON. Thinking mode không tương thích JSON mode và tốn token.
**Hệ quả:** Vẫn bọc `JSON.parse` trong try/catch phòng hờ. Lỗi parse → báo lỗi + cho retry.

---

## ADR-0005 — Bảo mật API key: local `.env` cho v0, proxy cho deploy

**Bối cảnh:** Frontend-only gọi LLM sẽ lộ key nếu deploy công khai; còn vướng CORS.
**Quyết định (v0, đã triển khai):** Frontend KHÔNG gọi thẳng DashScope (vướng CORS + lộ key).
Thay vào đó dùng **proxy ngay trong Vite dev server**: middleware `POST /api/enrich`
trong `vite.config.js` chạy phía Node, đọc key từ `.env` (tên `DASHSCOPE_*`, fallback
`VITE_DASHSCOPE_*`), gọi Qwen rồi trả JSON về. Key **không** vào bundle trình duyệt.
**Quyết định (khi deploy):** Chuyển middleware này thành function thật (Vercel/Cloudflare
Worker) — logic y hệt, chỉ đổi nơi chạy; frontend vẫn gọi `/api/enrich`.
**Hệ quả:** `.env` nằm trong `.gitignore`. `enrichWord` chỉ gọi `/api/enrich` (cùng origin →
không CORS). Đổi `vite.config.js` phải **restart `npm run dev`**. `vite preview`/static build
chưa có proxy nên cần function thật mới chạy ngoài dev.

---

## ADR-0006 — Cache + lưu trữ: localStorage cho v0/v1

**Bối cảnh:** Tránh gọi API lại cho cùng một từ; chuẩn bị cho "Từ đã lưu" ở v1.
**Quyết định:** Cache kết quả enrich theo key = từ chuẩn hóa, lưu `localStorage`.
**Hệ quả:** Nhiều dữ liệu hơn (v1+) thì chuyển IndexedDB. Cache là nguồn cho danh sách "Từ đã lưu" về sau.

---

## ADR-0007 — Chống quá tải bằng `<details>` gập/mở

**Bối cảnh:** Pain #5 — quá tải nhận thức khi gặp từ mới.
**Quyết định:** Mỗi mục thẻ là một `<details>`; chỉ "Nghĩa (B1)" có thuộc tính `open`.
**Lý do:** `<details>` native: keyboard-accessible, không cần JS state, "cách lười mà hiệu quả".
**Hệ quả:** UX nhất quán; dễ render từ schema.
