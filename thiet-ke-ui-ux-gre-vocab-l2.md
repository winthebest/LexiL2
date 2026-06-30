# Thiết kế UI/UX: **GRE Vocab L2 Companion**
*Tài liệu thiết kế giao diện — đi kèm file kế hoạch build*

---

## 1. Triết lý thiết kế (đọc trước — định hình mọi quyết định)

Giao diện này có **một việc quan trọng nhất**, và nó chống lại bản năng của chính nó:

> **UI phải làm việc *gọi-ra-chủ-động* trở thành đường dễ nhất, và làm việc *đọc thụ động* khó hơn.**

Vì sao? Một tấm thẻ enrich đẹp đẽ mời gọi bạn đọc lướt rồi gật gù "à biết rồi" — đó là **ảo giác nhận diện**, không phải trí nhớ. Nhiệm vụ của thiết kế là **chặn việc hé lộ đáp án sau một lần cố nhớ**. Mọi màn hình soi qua câu: *"cái này đang bắt người dùng nhớ lại, hay đang chiều họ đọc lại?"*

Từ đó sinh ra **hai chế độ của cùng một tấm thẻ**:

| Chế độ | Khi nào | Hành vi UI |
|---|---|---|
| **ENCODE** (mã hóa) | Lần đầu gặp từ (màn Enricher) | Hiện tất cả — để nạp sâu: nghĩa, gốc, mnemonic, ví dụ |
| **RECALL** (truy hồi) | Ôn từ đã lưu (phiên ôn) | **Giấu hết**, hỏi → bắt gõ/đoán → *rồi mới* hé lộ |

Năm nguyên tắc dẫn đường:
1. **Recall trước, reveal sau.** Trong chế độ RECALL, đáp án luôn bị che sau một hành động cố nhớ.
2. **Hé lộ dần (progressive disclosure).** Thẻ chia mục gập/mở → chống quá tải nhận thức (pain #5).
3. **Một hành động chính mỗi màn.** Vòng lặp hằng ngày phải ít ma sát — đừng bắt người dùng chọn lựa nhiều.
4. **Tự-chấm thật thà.** UI không được "dụ" bấm "Tôi nhớ rồi"; nút "Quên/Khó" phải dễ bấm ngang "Dễ".
5. **Tĩnh, lấy chữ làm gốc, không phân tâm.** Đây là công cụ đọc–nghĩ; typography quan trọng hơn hiệu ứng.

---

## 2. Hệ token thiết kế

Hướng thẩm mỹ: **"tờ phiếu tiêu bản từ vựng" (lexicon specimen sheet)** — mỗi từ là một mẫu vật được mổ xẻ (gốc Latin/Hy Lạp như giải phẫu), trên giấy từ điển, mực in đậm. *Cố ý tránh* look mặc định (giấy kem + serif thời trang + accent đất nung); ở đây accent là **mực chàm**, serif là kiểu **từ điển**, và mọi lựa chọn đều bám bối cảnh *người Việt học phát âm + từ nguyên*.

### 2.1 Bảng màu (light)
```
--ink            #221E18   chữ chính (near-black ấm, "mực" không phải đen tuyền)
--paper          #F6F4EF   nền (giấy từ điển, ấm rất nhẹ — KHÔNG phải kem cliché)
--paper-raised   #FCFBF7   mặt thẻ
--rule           #E4DECF   đường kẻ tóc / divider (mảnh, có chức năng chia mục)
--indigo         #27406E   ACCENT chính — mực chàm: link, nút primary, tiêu điểm
--indigo-soft    #EAEEF6   nền nhạt của accent (hover, vùng được chọn)
```
**Màu ngữ nghĩa (CÓ CHỨC NĂNG — mã hóa sắc thái, không trang trí):**
```
--pos   #2E7D5B   sắc thái tích cực  (chấm/nhãn)
--neg   #B4452F   sắc thái tiêu cực
--neu   #6B6256   trung tính
--ok    #2E7D5B   đáp án đúng / "nhớ được"
--miss  #B4452F   sai / "quên"
```
**Dark mode** (công cụ dùng buổi tối nhiều → cần): đảo `--ink ⇄ paper` sang nền mực sâu `#16140F`, chữ `#ECE6D8`, accent sáng hơn `#7E9AD6`. Giữ nguyên hệ màu ngữ nghĩa (chỉ tăng độ sáng ~15%).

### 2.2 Typography (chọn riêng cho bối cảnh — đọc kỹ phần Việt/IPA)
| Vai trò | Font đề xuất | Vì sao |
|---|---|---|
| Headword + nội dung tiếng Anh | **Spectral** (serif màn hình, chất "từ điển") | Có cá tính nhưng dễ đọc; KHÔNG phải serif high-contrast kiểu tạp chí |
| UI + **toàn bộ tiếng Việt** | **Be Vietnam Pro** | Font *thiết kế cho tiếng Việt* — dấu thanh đẹp, đúng audience L2 |
| **IPA / phiên âm** | **Gentium Plus** hoặc **Charis SIL** (SIL) | Font ngôn ngữ học, phủ ký hiệu IPA chuẩn — phần lớn font khác render IPA sai |
| Số liệu / mã | **IBM Plex Mono** | Cho intensity, phím tắt, JSON debug |

⚠️ **Gotcha bắt buộc xử lý:** nhiều font render *tốt dấu tiếng Việt* HOẶC *tốt IPA*, hiếm khi cả hai. Vì thế **tách vai**: tiếng Việt dùng Be Vietnam Pro, chuỗi IPA bọc trong class riêng dùng Gentium. Test thật chuỗi `/ɪˈpɪtəmi/` và `"khoa trương, ba hoa"` trên mọi trình duyệt trước khi chốt.

**Thang cỡ chữ:** headword 32–40px (Spectral, weight 500); nghĩa 18–20px; nhãn/caption 13px uppercase letter-spacing 0.06em; IPA 16px Gentium. Dòng văn bản tiếng Anh `line-height: 1.6`.

### 2.3 Layout & nhịp
Một cột, lấy việc đọc làm trung tâm, nhiều khoảng trắng (`max-width ~640px` cho vùng nội dung). Mục trong thẻ ngăn bằng **đường kẻ tóc** (`--rule`) — divider *mã hóa cấu trúc*, không viền bo trang trí. Bo góc thẻ nhỏ (`6px`). **Keyboard-first**: mọi hành động chính có phím tắt (xem 11).

### 2.4 Signature element — **Phổ cường độ cụm đồng nghĩa**
Thứ duy nhất "bạo" và đáng nhớ của app — và *cũng chính là* lời giải cho pain point sâu nhất (tiếng Việt làm sụp đổ phân biệt). Thay vì list đồng nghĩa rời, vẽ một **thanh ngang: nhẹ → gắt**, track có gradient mát→ấm để củng cố ẩn dụ "cường độ = độ nóng", mỗi từ một **chấm sắc thái** (pos/neg/neu), từ đang học được nhấn:

```
Cụm "nói nhiều"            nhẹ ◁───────────────────────▷ gắt
        ░░░░░░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓  (track mát→ấm)
   talkative      loquacious     voluble    garrulous     verbose
     ●neu          ◆formal        ◆formal     ●neg          ◆neg
                  ▲ (từ đang học — viền indigo, đậm)
```
Người dùng **thấy** được cái mà bản dịch tiếng Việt giấu đi. Mọi nơi khác giữ "yên tĩnh" để signature này nổi.

---

## 3. Bản đồ màn hình (theo pha trong Mục 0.5)

| Màn hình | Pha | Vai trò |
|---|---|---|
| **Enricher** (ENCODE) | v0 | Gõ từ → thẻ enrich đầy đủ |
| **Phiên ôn** (RECALL) | v1 | Truy hồi chủ động các từ đến hạn — *trái tim việc học* |
| **Bảng từ / Dashboard** | v1 | Danh sách từ đã lưu + nút "Ôn ngay" + 2 metric thật |
| **Drill cụm đồng nghĩa** | v2a | Câu chỗ trống + chọn từ hợp sắc thái |
| **Luyện đề TC** | v2b | Ngân hàng đề generate→verify |
| **Settings** | v0+ | API key, chọn model, export Anki |

---

## 4. Đặc tả từng màn hình

### 4.1 Enricher — chế độ ENCODE (v0)
```
┌──────────────────────────────────────────────┐
│  [ ô nhập từ ........................ ] [Enrich ⏎]│
├──────────────────────────────────────────────┤
│  loquacious        /loʊˈkweɪʃəs/   🔊  ↗Youglish│
│  adj  •  ◆ formal  •  ● trung tính              │
│ ───────────────────────────────────────────────│
│  ▾ Nghĩa (B1)                       [luôn mở]   │
│      tending to talk a lot                      │
│      vi · lắm lời, hoạt ngôn                     │
│  ▸ Gốc từ + họ từ                               │
│  ▸ Mnemonic 🧠                                  │
│  ▸ Ví dụ                                         │
│  ▸ Cụm đồng nghĩa        ← signature spectrum   │
│  ▸ Nghĩa bẫy ⚠                                  │
│  ▸ Trái nghĩa                                    │
│ ───────────────────────────────────────────────│
│  [ + Lưu vào bảng từ ]        [ Tạo lại mnemonic ]│
└──────────────────────────────────────────────┘
```
- **Tương tác:** chỉ "Nghĩa" mở sẵn; các mục khác gập (`<details>`). Gốc từ hiển thị dạng khối morpheme nối nhau (`loqu · -acious`) như nhãn tiêu bản. "Tạo lại mnemonic" gọi lại API để bạn chọn cái hợp não → lưu cái đó.
- **Trạng thái:** *loading* = skeleton từng mục (không spinner toàn màn — xem 6); *empty* = ô nhập + gợi ý "Gõ một từ GRE để xem thẻ"; *error* = "Không tạo được thẻ. Thử lại." + nút Thử lại (giọng UI, không xin lỗi).
- **Vì sao:** đây là lần *nạp sâu* nên cho xem hết; nhưng khuyến khích thói quen "đoán họ từ trước khi mở" bằng cách để mục Gốc-từ gập lại.

### 4.2 Phiên ôn — chế độ RECALL (v1) ★ màn quan trọng nhất
**Bước 1 — Hỏi (đáp án bị che hoàn toàn):**
```
┌──────────────────────────────────────────────┐
│  Đến hạn: 12 / 40                       Esc thoát│
├──────────────────────────────────────────────┤
│                                                 │
│   Nghĩa:  tending to talk a lot                 │   ← prompt = NGHĨA
│   vi · lắm lời, hoạt ngôn                        │     (hoặc 🔊 nghe → đoán)
│                                                 │
│   Từ này là gì?                                 │
│   [ gõ lại từ .............................. ]   │   ← sản xuất chủ động
│                                                 │
│              [ Hiện đáp án  ⏎ ]                 │   ← cổng hé lộ
└──────────────────────────────────────────────┘
```
**Bước 2 — Hé lộ + tự chấm:**
```
┌──────────────────────────────────────────────┐
│   loquacious   ✓  (bạn gõ: "loquacious")        │
│   ── thẻ enrich đầy đủ hiện ra ở đây ──          │
│                                                 │
│   Nhớ tới đâu? (chấm thật thà)                  │
│   [ Quên ]   [ Khó ]   [ Tạm ]   [ Dễ ]         │   ← 4 nút CÂN BẰNG
└──────────────────────────────────────────────┘
```
- **Hướng truy hồi:** prompt là *nghĩa* → đáp án là *từ* (sản xuất khó hơn, khắc sâu hơn nhận diện). Biến thể: 🔊 đọc từ (không chữ) → đoán nghĩa, vá lỗ hổng âm thanh.
- **Quy tắc thiết kế cốt tử:** 4 nút chấm **cùng kích thước, cùng độ nổi** — KHÔNG tô "Dễ" xanh to để dụ. "Quên/Khó" được tô màu `--miss/--neg` bình thản, không gây xấu hổ. Điểm chấm → feed thẳng lịch ôn (Anki/FSRS).
- **Trạng thái done:** hết từ đến hạn = màn "Xong phiên — 40/40" + 1 dòng metric (xem 4.3), KHÔNG ép "ôn thêm".

### 4.3 Bảng từ / Dashboard (v1)
```
┌──────────────────────────────────────────────┐
│           ▣  Ôn 40 từ đến hạn   ⏎              │   ← 1 CTA lớn duy nhất
│                                                 │
│  Nhớ lần đầu: 78%   ·   Đúng TC: 64%            │   ← 2 metric THẬT (Mục 0.5)
├──────────────────────────────────────────────┤
│  Lọc: [Tất cả] [Đến hạn] [Hay quên ⚑] [Khó]    │
│  ─────────────────────────────────────────────  │
│  loquacious   ◆formal ●neu    đến hạn hôm nay   │
│  obdurate     ◆formal ●neg    ⚑ leech (quên 4×) │
│  ...                                            │
└──────────────────────────────────────────────┘
```
- Hành động chính rõ ràng là **"Ôn ngay"** — không phải tường thống kê. Chỉ hiện **2 metric thật**, bỏ vanity ("số thẻ đã tạo"). Từ **leech** (hay quên) được gắn cờ ⚑ để xử lý riêng (mã hóa lại, đừng lặp thẻ cũ).

### 4.4 Drill cụm đồng nghĩa (v2a)
```
┌──────────────────────────────────────────────┐
│  Although she is usually reserved, tonight she │
│  was unexpectedly ____, talking to everyone.   │
│                                                 │
│  ○ taciturn   ○ loquacious   ○ terse           │
│  ○ aloof      ○ morose                          │
│              [ Trả lời ⏎ ]                      │
└──────────────────────────────────────────────┘
   ↓ sau khi trả lời
│  ✓ loquacious — và tô SÁNG từ tín hiệu "Although"│
│  + phổ cường độ của cụm, định vị từ vừa chọn     │
```
- Tái dùng `synonym_cluster` trong storage làm lựa chọn. **Sau khi trả lời, tô sáng từ tín hiệu** ("Although") → dạy *logic*, không chỉ đáp án. Hiện kèm signature spectrum để củng cố sắc thái.

### 4.5 Luyện đề TC (v2b)
```
┌──────────────────────────────────────────────┐
│  Câu 3 / 10                              ⚑ flag │
├──────────────────────────────────────────────┤
│  [đề Text Completion một chỗ trống]            │
│  ○ A ... ○ B ... ○ C ... ○ D ... ○ E           │
│              [ Trả lời ⏎ ]                      │
└──────────────────────────────────────────────┘
   ↓ sau trả lời: đáp án đúng + giải thích + tô từ tín hiệu
```
- Nút **⚑ flag** mở 4 lựa chọn phản hồi của Mục 10.10: *"Hai đáp án đúng / Quá dễ / Sai đáp án / Câu lủng củng"* → log làm dữ liệu lọc bank + tinh chỉnh prompt. Đừng lặp y câu cũ cho một từ.

### 4.6 Settings (v0+)
Gọn: ô **API key** (Model Studio, region Singapore), chọn **model** (`qwen3.7-plus` mặc định / `max` / `flash`), chỉ báo quota free còn lại, nút **Export sang Anki**. Mỗi mục một dòng giải thích bằng giọng người dùng ("Khóa để gọi AI tạo thẻ", không phải "API credential").

---

## 5. Thư viện component (tái dùng)
- **WordCard** — props `mode: "encode" | "recall"`; chứa các mục gập/mở. Lõi của cả Enricher lẫn bước-2 phiên ôn.
- **RevealGate** — bọc nội dung, chỉ hiện sau hành động; xương sống của chế độ RECALL.
- **RecallInput** — ô gõ lại từ + so khớp mềm (bỏ qua hoa/thường, dấu cách thừa).
- **GradeBar** — 4 nút Quên/Khó/Tạm/Dễ cân bằng.
- **ConnotationDot / RegisterChip** — chấm `--pos/--neg/--neu` + nhãn formal/literary. **Không chỉ dựa vào màu** — luôn kèm chữ (accessibility).
- **IntensitySpectrum** — signature; nhận mảng `members` từ `synonym_cluster`.
- **EtymologyBlocks** — morpheme nối nhau, hover hiện nghĩa từng phần.
- **AudioButton** — `speechSynthesis`; đổi icon khi đang phát.
- **TCQuestion** — đề + lựa chọn + trạng thái sau-trả-lời (tô từ tín hiệu) + nút flag.
- **SkeletonCard / EmptyState / ErrorState** — trạng thái tải/rỗng/lỗi nhất quán.

---

## 6. Microinteraction & phản hồi
- **Tải khi gọi AI (enrich/sinh đề):** dùng **skeleton từng mục** đổ dần, KHÔNG spinner toàn màn. Hiện phần nào xong render phần đó (định nghĩa thường ra trước) → cảm giác nhanh.
- **Reveal:** mở mục/đáp án bằng fade + giãn cao 150ms, ease-out. Tôn trọng `prefers-reduced-motion` (tắt animation).
- **Đúng/Sai:** chỉ một dấu ✓/✗ + đổi viền màu `--ok/--miss`; **không** confetti, không âm thanh chói (giữ tĩnh, tránh thưởng tốc độ).
- **Audio:** icon 🔊 → ◼ khi đang phát; nếu TTS đọc sai từ hiếm, có link Youglish ngay cạnh.
- **Phím tắt:** mọi phản hồi tức thì để dùng được hoàn toàn bằng bàn phím.

---

## 7. Responsive / mobile
Desktop là môi trường chính (power-tool, gõ nhiều). Nhưng **phiên ôn phải chạy tốt trên điện thoại** (recall lúc di chuyển rất giá trị): một cột, nút chấm to đủ chạm, ô gõ lại nổi trên bàn phím ảo. Enricher trên mobile: thu các chip xuống, mục gập vẫn nguyên. Quality floor: chạy tốt tới khổ ~360px, focus bàn phím luôn thấy.

---

## 8. Accessibility + đặc thù Việt/IPA
- **Không bao giờ chỉ dùng màu** để báo sắc thái/đúng-sai → luôn kèm nhãn chữ hoặc icon.
- **Tương phản** ink/paper đạt WCAG AA; kiểm cả màu ngữ nghĩa trên nền giấy.
- **Focus thấy rõ** (viền `--indigo` 2px) cho mọi phần tử bấm được.
- **Việt + IPA** (nhắc lại vì hay hỏng): tải đủ subset Vietnamese của Be Vietnam Pro; bọc IPA bằng font SIL. Test chuỗi có dấu nặng/ngã + ký hiệu /ə/, /ʃ/, /ˈ/.
- **Screen reader:** ô gõ lại có label; nút chấm có aria-label ("Quên", "Dễ"...).

---

## 9. Viết chữ trong UI (copy là vật liệu thiết kế)
- **Active voice, đặt tên theo cái người dùng điều khiển.** Nút nói đúng việc nó làm: *"Lưu vào bảng từ"* (không phải "Submit"); *"Hiện đáp án"* (không phải "Toggle"). Hành động giữ **một tên xuyên suốt** (nút "Lưu" → toast "Đã lưu").
- **Rỗng & lỗi là lúc dẫn hướng, không phải tâm trạng.** Màn rỗng là lời mời hành động ("Gõ một từ GRE để bắt đầu"); lỗi nói rõ chuyện gì + cách sửa, **không xin lỗi, không mơ hồ**.
- **Sentence case, động từ thật, không chữ thừa.** Mỗi phần tử làm đúng một việc.

---

## 10. Anti-pattern UI (đừng làm)
- **Đừng auto-reveal** nghĩa/đáp án trong chế độ RECALL — phá hỏng toàn bộ giá trị học.
- **Đừng** để ô gõ lại *dưới* đáp án, hay làm nút "Tôi nhớ rồi" to/xanh nổi bật → ép chấm gian.
- **Đừng** nhồi thẻ thành tường badge/màu; giữ một signature (phổ cường độ), còn lại yên tĩnh.
- **Đừng dùng dark pattern giữ chân:** không streak gây áp lực/guilt, không thông báo "đừng bỏ rơi tôi", không thưởng tốc độ (nó khuyến khích chấm dối). Đây là công cụ học cá nhân — thiết kế cho **luyện tập đều, thật thà, bền vững**, không phải tối đa thời-gian-trên-app.
- **Đừng** lặp y đúng một câu hỏi cho một từ (test trí nhớ về *câu*, không phải *từ*).

---

## 11. Ghi chú implementation
- **Tailwind** + CSS variables ở trên (map token → `theme.extend`). Cẩn thận specificity selector (đừng để class cancel margin/padding lẫn nhau).
- **Font:** self-host hoặc dùng đúng subset; Be Vietnam Pro (subset `vietnamese`), Gentium Plus cho `.ipa`, Spectral cho `.en`, IBM Plex Mono cho `.data`.
- **Collapsible:** dùng `<details>`/`<summary>` cho v0 (rẻ, accessible sẵn); v1 trở đi dùng state nếu cần animation mượt.
- **Phím tắt đề xuất:** `⏎` = hành động chính (Enrich / Hiện đáp án / Trả lời); `1–4` = chấm Quên/Khó/Tạm/Dễ; `Space` = phát audio; `Esc` = thoát phiên; `/` = focus ô nhập.
- **State:** giữ trong React state (đừng dùng localStorage *trong artifact* nếu thử trên Claude.ai; app thật deploy thì localStorage/IndexedDB bình thường — xem file kế hoạch Mục 4.4).
- **Tái dùng `<WordCard>`** ở cả Enricher và bước-2 phiên ôn để giao diện nhất quán và đỡ code.

---

*Nguyên tắc để dán lên màn hình khi thiết kế: mỗi màn hình phải bắt người dùng **nhớ lại**, không phải mời họ **đọc lại**. Mọi thứ đẹp đẽ của thẻ chỉ để lần mã hóa đầu sâu hơn — còn trí nhớ là do lặp lại sự gắng sức nhớ, và UI tồn tại để bảo vệ điều đó.*
