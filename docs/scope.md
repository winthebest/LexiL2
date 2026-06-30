# SCOPE — GRE Vocab L2 Companion

> Tài liệu phạm vi. Trả lời 1 câu hỏi: **cái gì nằm trong, cái gì nằm ngoài.**
> Nguồn: `ke-hoach-gre-vocab-l2-companion.md`.

## 1. Một dòng

Nhập **một** từ GRE → AI sinh ra một **"thẻ từ" hoàn chỉnh tối ưu cho người Việt**, gom toàn bộ xử lý L2 vào một lần gọi.

Đây **không** phải app thay Magoosh. Magoosh lo lịch ôn + danh sách 1000 từ. App này là **lớp xử lý L2 cho người Việt** đặt song song.

## 2. Người dùng

- 1 người dùng duy nhất (công cụ cá nhân).
- Người Việt, đang học ~1000 từ GRE, có nền tiếng Anh ~B1.
- Chạy local trên máy cá nhân (xem ràng buộc bảo mật ở ADR-0005).

## 3. Trong phạm vi (v0)

| # | Hạng mục | Ghi chú |
|---|---|---|
| S1 | Màn hình **Enricher** 1 màn | ô nhập từ + nút Enrich |
| S2 | Gọi Qwen 1 prompt → JSON có cấu trúc | OpenAI-compatible, JSON mode |
| S3 | Render **WordCard** từ JSON | header + nhãn nhanh + 7 mục gập/mở |
| S4 | TTS phát âm | `speechSynthesis` của trình duyệt |
| S5 | Link Youglish | `https://youglish.com/pronounce/{word}/english` |
| S6 | Chống quá tải: chỉ "Nghĩa (B1)" mở sẵn | còn lại gập |
| S7 | Cache theo từ (localStorage) | tránh gọi lại API cho cùng 1 từ |
| S8 | Xử lý lỗi: loading / error / JSON parse fail | bọc try/catch |

## 4. Ngoài phạm vi v0 (đẩy sang v1/v2)

| # | Hạng mục | Phiên bản |
|---|---|---|
| O1 | Lưu từ + màn "Từ đã lưu" | v1 |
| O2 | Ôn tập chủ động (gõ lại từ) | v1 |
| O3 | Lịch ôn SM-2 / FSRS | v2 |
| O4 | Máy chế tạo đoạn văn ngữ cảnh | v2 |
| O5 | Drill nghe | v2 |
| O6 | Proxy server giữ key | khi deploy công khai |
| O7 | Đăng nhập / nhiều người dùng | không làm |

## 5. Ràng buộc

- **LLM:** Qwen (Alibaba Cloud Model Studio), OpenAI-compatible + JSON mode. Mặc định `qwen3.7-plus`.
- **Region:** Singapore (ap-southeast-1) — nơi có free quota.
- **Không** set `max_tokens` khi bật JSON mode. **Tắt** thinking mode.
- **Không** deploy công khai bản để key trong bundle (`VITE_`).
- Stack: Vite + React + Tailwind.

## 6. Tiêu chí "xong v0" (Definition of Done)

- [ ] Gõ `loquacious` → nhận thẻ đầy đủ đúng schema ở `contract.md`.
- [ ] Mục "Nghĩa (B1)" mở sẵn, 7 mục còn lại gập/mở được.
- [ ] Nút 🔊 đọc từ; link Youglish mở đúng.
- [ ] Gọi lại cùng từ → lấy từ cache, không gọi API.
- [ ] Lỗi mạng / JSON hỏng → hiện thông báo, không vỡ app.
