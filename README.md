# GRE Vocab L2 Companion

Công cụ cá nhân: gõ **một** từ GRE → AI (Qwen) dựng một **thẻ từ** tối ưu cho người Việt
(nghĩa B1, gốc từ + họ từ, mnemonic tiếng Việt, ví dụ, cụm đồng nghĩa theo sắc thái, nghĩa bẫy, trái nghĩa).

> Đây không phải app thay Magoosh. Đây là **lớp xử lý L2 cho người Việt** đặt song song.

## Tài liệu

| File | Nội dung |
|---|---|
| [docs/scope.md](docs/scope.md) | Phạm vi: trong / ngoài, Definition of Done |
| [docs/prd.md](docs/prd.md) | Product Requirements: user stories, FR/NFR |
| [docs/adr.md](docs/adr.md) | Architecture Decision Records |
| [docs/contract.md](docs/contract.md) | Hợp đồng API + prompt lõi + JSON schema |
| [docs/card.md](docs/card.md) | Đặc tả render WordCard |

## Chạy local

```bash
npm install
cp .env.example .env   # rồi điền key + WorkspaceId
npm run dev
```

> Chưa có key cũng chạy được: bấm **"Xem thẻ mẫu (offline)"** để render thẻ `loquacious` từ fixture.

## Cấu hình `.env`

Lấy ở Alibaba Cloud **Model Studio**, region **Singapore (ap-southeast-1)** (nơi có free quota).
Bật **"Free Quota Only"** để hết quota thì dừng, không tự trừ tiền.

```
VITE_DASHSCOPE_API_KEY=sk-...
VITE_DASHSCOPE_WORKSPACE_ID=llm-...
VITE_QWEN_MODEL=qwen3.7-plus   # tùy chọn
```

## ⚠️ Bảo mật (đọc kỹ)

Tiền tố `VITE_` đẩy key vào **bundle trình duyệt** → **chỉ chạy local, KHÔNG deploy công khai**.
Khi muốn deploy: dựng **proxy nhỏ** (Vercel/Cloudflare Worker) giữ key ở server, frontend chỉ đổi base URL.
Chi tiết: [docs/adr.md](docs/adr.md) ADR-0005.

## Stack

Vite + React + Tailwind v4. LLM: Qwen qua endpoint OpenAI-compatible, JSON mode, ghim `qwen3.7-plus`.

## Trạng thái

- **v0 (xong):** Enricher + WordCard + TTS + Youglish + cache localStorage + proxy dev (`/api/enrich`).
- **v1 (xong):**
  - ✅ Lưu từ (nút ☆/★) + màn "Từ đã lưu" (tìm/xem/xóa).
  - ✅ Ôn chủ động: tab "Ôn tập" — hiện nghĩa B1 + gợi ý → gõ lại từ → chấm đúng/sai + điểm phiên.
- **v2 (xong):**
  - ✅ Lịch ôn **SM-2**: tab "Ôn tập" chỉ hiện từ đến hạn; sai → quay lại sau 1 ngày; đúng (Khó/Tốt/Dễ) → giãn khoảng cách.
  - ✅ **Đoạn văn ngữ cảnh**: tab "Đoạn văn" — chọn ≥2 từ → Qwen viết đoạn văn nhồi đủ các từ, tô sáng từ đích.
  - ✅ **Drill nghe**: tab "Drill nghe" — TTS đọc từ → đoán nghĩa → hiện đáp án → tự đánh giá.
- **v3 (đang mở rộng):**
  - ✅ **Collocations** trong WordCard: AI sinh 4–7 cụm tự nhiên, ưu tiên academic/formal/GRE khi phù hợp.
  - ✅ **Cụm từ**: gom collocations từ các từ đã lưu, tìm kiếm/lọc theo pattern, register, từ gốc.
  - ✅ **Flashcard**: lật thẻ nhanh từ các từ đã lưu, nghe phát âm, tự chấm để cập nhật lịch SRS.

### Các tab
`Enricher` (tra từ) · `Từ đã lưu` · `Flashcard` · `Cụm từ` · `Ôn tập` (SM-2) · `Đoạn văn` · `Drill nghe` · `Đồng bộ`.

## Đồng bộ laptop ↔ điện thoại

App có màn **Đồng bộ** để đẩy/kéo snapshot JSON của toàn bộ dữ liệu `gre-l2:*`
lên Supabase. Chạy SQL trong [docs/supabase-sync.sql](docs/supabase-sync.sql), rồi điền:

- Supabase URL
- anon key
- profile id
- sync secret tự đặt

Bật **Tự đẩy/kéo** để thiết bị đang học tự đẩy thay đổi lên cloud; thiết bị còn lại
sẽ tự kéo snapshot mới khi mở app hoặc quay lại tab.

## Deploy cá nhân

Project có sẵn Vercel Serverless Functions cho `/api/enrich`, `/api/passage`,
`/api/generate`, `/api/verify`, nên deploy production vẫn giữ Qwen key ở server.
Xem [docs/deploy-vercel.md](docs/deploy-vercel.md).

## Cài lên điện thoại dạng PWA

Sau khi deploy HTTPS, mở URL bằng Safari trên iPhone → Share → **Add to Home
Screen**. App có manifest, icon và service worker để chạy như web app độc lập.
