# Nguồn audio IPA

Màn IPA sử dụng các bản ghi âm vị độc lập được phân phối qua Wikimedia Commons.
Ứng dụng liên kết đến file gốc bằng `Special:Redirect/file` và không chỉnh sửa audio.

## Nguyên âm đơn và phụ âm

- Nguồn: các file thuộc nhóm **Audio files of phonetic samples** trên Wikimedia Commons.
- Tên file cụ thể được khai báo trong `src/lib/ipaAudio.js`.
- Phần lớn bản ghi do Peter Isotalo/Joni và các cộng tác viên Wikimedia thực hiện.
- Giấy phép của từng file được ghi trên trang mô tả file; các file mẫu chính được
  phát hành theo GFDL và/hoặc CC BY-SA.
- Ví dụ: [Voiceless bilabial plosive.ogg](https://commons.wikimedia.org/wiki/File:Voiceless_bilabial_plosive.ogg).

## Nguyên âm đôi

- `aʊ`: [LL-Q1860 (eng)-Pvanp7-aʊ (diphthong).wav](https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Pvanp7-aʊ_(diphthong).wav)
- `eə`: [LL-Q1860 (eng)-Pvanp7-ɛə (diphthong).wav](https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Pvanp7-ɛə_(diphthong).wav)
- `ʊə`: [LL-Q1860 (eng)-Pvanp7-ʊə (diphthong).wav](https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Pvanp7-ʊə_(diphthong).wav)
- Tác giả/người đọc: Pvanp7, dự án Lingua Libre; xem giấy phép cụ thể trên từng trang file.

Các nguyên âm đôi còn lại dùng một từ độc lập chỉ chứa âm cần luyện (`A`, `I`,
`O`, `oy`, `ear`) qua giọng đọc của thiết bị. Đây cũng là phương án dự phòng khi
trình duyệt không tải được bản ghi Wikimedia.
