# Deploy Vercel — GRE Vocab L2 Companion

## 1. Chuẩn bị

Project đã có sẵn Vercel Serverless Functions:

- `api/enrich.js`
- `api/passage.js`
- `api/generate.js`
- `api/verify.js`

Frontend vẫn gọi cùng-origin `/api/*`, nên sau deploy không cần đổi code client.

## 2. Env vars trên Vercel

Vào Vercel Project → Settings → Environment Variables, thêm:

```text
DASHSCOPE_API_KEY=sk-...
DASHSCOPE_WORKSPACE_ID=llm-...
QWEN_MODEL=qwen3.7-plus
QWEN_VERIFIER_MODEL=qwen3.7-max
```

`QWEN_MODEL` và `QWEN_VERIFIER_MODEL` là tùy chọn, nhưng nên đặt rõ để dễ kiểm soát.

Không đặt các key này thành `VITE_*` khi deploy production.

## 3. Build settings

Vercel thường tự nhận Vite. Nếu cần nhập thủ công:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

## 4. Sau khi deploy

1. Mở URL Vercel trên laptop.
2. Vào tab Đồng bộ, điền Supabase config một lần.
3. Mở cùng URL trên điện thoại.
4. Vào Thêm → Đồng bộ, điền cùng Supabase config, bấm Kéo về lần đầu.
5. Bật Tự đẩy/kéo trên cả hai thiết bị.
6. Trên iPhone, mở URL bằng Safari → Share → Add to Home Screen để cài như PWA.

Từ lúc đó, laptop lưu/ôn từ sẽ tự đẩy lên Supabase; điện thoại mở app hoặc quay lại
tab sẽ tự kéo snapshot mới.

## 5. Bảo mật cá nhân

Không public URL rộng rãi. Nếu có thể, bật một lớp bảo vệ ở Vercel/Cloudflare
hoặc đặt domain khó đoán, vì `/api/*` dùng quota Qwen của bạn.
