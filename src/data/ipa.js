const p = (symbol, type, keyword, guide, examples, pair = '') => ({
  symbol,
  type,
  keyword,
  guide,
  examples: examples.map(([word, ipa, meaning]) => ({ word, ipa, meaning })),
  pair,
})

export const IPA_SOUNDS = [
  // Nguyên âm đơn
  p('iː', 'vowel', 'see', 'Kéo hai khóe môi sang ngang, lưỡi nâng cao; giữ âm dài.', [['see', '/siː/', 'nhìn thấy'], ['green', '/ɡriːn/', 'màu xanh'], ['complete', '/kəmˈpliːt/', 'hoàn thành']], 'ɪ'),
  p('ɪ', 'vowel', 'sit', 'Miệng thả lỏng hơn /iː/, âm ngắn và lưỡi thấp hơn một chút.', [['sit', '/sɪt/', 'ngồi'], ['little', '/ˈlɪtəl/', 'nhỏ'], ['system', '/ˈsɪstəm/', 'hệ thống']], 'iː'),
  p('e', 'vowel', 'bed', 'Hạ hàm vừa phải, môi hơi mở; âm ngắn và rõ.', [['bed', '/bed/', 'cái giường'], ['head', '/hed/', 'cái đầu'], ['ready', '/ˈredi/', 'sẵn sàng']], 'æ'),
  p('æ', 'vowel', 'cat', 'Mở miệng rộng, lưỡi thấp và hướng ra trước.', [['cat', '/kæt/', 'con mèo'], ['bad', '/bæd/', 'xấu'], ['family', '/ˈfæməli/', 'gia đình']], 'e'),
  p('ɑː', 'vowel', 'father', 'Mở miệng, lưỡi thấp và lùi sau; kéo âm dài.', [['father', '/ˈfɑːðər/', 'cha'], ['car', '/kɑːr/', 'xe hơi'], ['start', '/stɑːrt/', 'bắt đầu']], 'ʌ'),
  p('ɒ', 'vowel', 'hot', 'Mở miệng, môi hơi tròn; âm ngắn. Âm này chủ yếu gặp trong Anh–Anh.', [['hot', '/hɒt/', 'nóng'], ['clock', '/klɒk/', 'đồng hồ'], ['problem', '/ˈprɒbləm/', 'vấn đề']], 'ɔː'),
  p('ɔː', 'vowel', 'thought', 'Môi tròn, lưỡi lùi sau; giữ âm dài.', [['thought', '/θɔːt/', 'suy nghĩ'], ['law', '/lɔː/', 'luật'], ['morning', '/ˈmɔːrnɪŋ/', 'buổi sáng']], 'ɒ'),
  p('ʊ', 'vowel', 'book', 'Môi hơi tròn, lưỡi nâng phía sau; phát âm ngắn.', [['book', '/bʊk/', 'quyển sách'], ['good', '/ɡʊd/', 'tốt'], ['woman', '/ˈwʊmən/', 'phụ nữ']], 'uː'),
  p('uː', 'vowel', 'blue', 'Chu môi tròn, lưỡi nâng cao phía sau; giữ âm dài.', [['blue', '/bluː/', 'màu xanh'], ['food', '/fuːd/', 'thức ăn'], ['improve', '/ɪmˈpruːv/', 'cải thiện']], 'ʊ'),
  p('ʌ', 'vowel', 'cup', 'Miệng mở tự nhiên, lưỡi ở giữa và thả lỏng; âm ngắn.', [['cup', '/kʌp/', 'cái cốc'], ['love', '/lʌv/', 'yêu'], ['country', '/ˈkʌntri/', 'đất nước']], 'ɑː'),
  p('ɜː', 'vowel', 'bird', 'Môi trung tính, lưỡi ở giữa; kéo dài. Giọng Mỹ thường có âm /r/.', [['bird', '/bɜːrd/', 'con chim'], ['work', '/wɜːrk/', 'làm việc'], ['learn', '/lɜːrn/', 'học']], 'ə'),
  p('ə', 'vowel', 'about', 'Âm schwa rất nhẹ và ngắn, chỉ xuất hiện ở âm tiết không nhấn.', [['about', '/əˈbaʊt/', 'về'], ['support', '/səˈpɔːrt/', 'hỗ trợ'], ['teacher', '/ˈtiːtʃər/', 'giáo viên']], 'ɜː'),

  // Nguyên âm đôi
  p('eɪ', 'diphthong', 'day', 'Bắt đầu ở /e/ rồi trượt lên /ɪ/; không tách thành hai âm.', [['day', '/deɪ/', 'ngày'], ['name', '/neɪm/', 'tên'], ['create', '/kriˈeɪt/', 'tạo ra']]),
  p('aɪ', 'diphthong', 'my', 'Mở miệng ở /a/ rồi nâng lưỡi, khép dần về /ɪ/.', [['my', '/maɪ/', 'của tôi'], ['time', '/taɪm/', 'thời gian'], ['decide', '/dɪˈsaɪd/', 'quyết định']]),
  p('ɔɪ', 'diphthong', 'boy', 'Bắt đầu với môi tròn rồi trượt về /ɪ/.', [['boy', '/bɔɪ/', 'cậu bé'], ['choice', '/tʃɔɪs/', 'lựa chọn'], ['enjoy', '/ɪnˈdʒɔɪ/', 'thưởng thức']]),
  p('aʊ', 'diphthong', 'now', 'Mở rộng ở /a/, sau đó chu môi và trượt về /ʊ/.', [['now', '/naʊ/', 'bây giờ'], ['house', '/haʊs/', 'ngôi nhà'], ['allow', '/əˈlaʊ/', 'cho phép']]),
  p('oʊ', 'diphthong', 'go', 'Bắt đầu ở âm giữa rồi chu môi, trượt về /ʊ/.', [['go', '/ɡoʊ/', 'đi'], ['home', '/hoʊm/', 'nhà'], ['open', '/ˈoʊpən/', 'mở']]),
  p('ɪə', 'diphthong', 'near', 'Từ /ɪ/ trượt về âm giữa /ə/. Thường gặp trong Anh–Anh.', [['near', '/nɪər/', 'gần'], ['here', '/hɪər/', 'ở đây'], ['serious', '/ˈsɪəriəs/', 'nghiêm túc']]),
  p('eə', 'diphthong', 'hair', 'Từ /e/ trượt về /ə/; giọng Mỹ thường kết hợp rõ với /r/.', [['hair', '/heər/', 'tóc'], ['care', '/keər/', 'quan tâm'], ['prepare', '/prɪˈpeər/', 'chuẩn bị']]),
  p('ʊə', 'diphthong', 'tour', 'Từ /ʊ/ trượt về /ə/; nhiều giọng hiện đại đọc gần /ɔː/.', [['tour', '/tʊər/', 'chuyến đi'], ['pure', '/pjʊər/', 'tinh khiết'], ['during', '/ˈdjʊərɪŋ/', 'trong khi']]),

  // Phụ âm
  p('p', 'consonant', 'pen', 'Khép hai môi, giữ hơi rồi bật ra; dây thanh không rung.', [['pen', '/pen/', 'bút'], ['happy', '/ˈhæpi/', 'vui'], ['stop', '/stɒp/', 'dừng']], 'b'),
  p('b', 'consonant', 'book', 'Giống /p/ nhưng dây thanh rung khi bật môi.', [['book', '/bʊk/', 'sách'], ['about', '/əˈbaʊt/', 'về'], ['job', '/dʒɒb/', 'công việc']], 'p'),
  p('t', 'consonant', 'tea', 'Đầu lưỡi chạm lợi trên rồi bật hơi; dây thanh không rung.', [['tea', '/tiː/', 'trà'], ['water', '/ˈwɔːtər/', 'nước'], ['cat', '/kæt/', 'mèo']], 'd'),
  p('d', 'consonant', 'dog', 'Vị trí như /t/ nhưng dây thanh rung.', [['dog', '/dɒɡ/', 'chó'], ['ready', '/ˈredi/', 'sẵn sàng'], ['good', '/ɡʊd/', 'tốt']], 't'),
  p('k', 'consonant', 'key', 'Cuống lưỡi chạm vòm mềm rồi bật hơi; không rung.', [['key', '/kiː/', 'chìa khóa'], ['school', '/skuːl/', 'trường học'], ['back', '/bæk/', 'phía sau']], 'ɡ'),
  p('ɡ', 'consonant', 'go', 'Vị trí như /k/ nhưng dây thanh rung.', [['go', '/ɡoʊ/', 'đi'], ['again', '/əˈɡen/', 'lại'], ['big', '/bɪɡ/', 'lớn']], 'k'),
  p('f', 'consonant', 'fish', 'Răng trên chạm nhẹ môi dưới, thổi hơi; không rung.', [['fish', '/fɪʃ/', 'cá'], ['coffee', '/ˈkɒfi/', 'cà phê'], ['life', '/laɪf/', 'cuộc sống']], 'v'),
  p('v', 'consonant', 'voice', 'Vị trí như /f/ nhưng dây thanh rung.', [['voice', '/vɔɪs/', 'giọng nói'], ['seven', '/ˈsevən/', 'bảy'], ['love', '/lʌv/', 'yêu']], 'f'),
  p('θ', 'consonant', 'think', 'Đặt đầu lưỡi nhẹ giữa hai răng và thổi hơi; không rung.', [['think', '/θɪŋk/', 'nghĩ'], ['author', '/ˈɔːθər/', 'tác giả'], ['truth', '/truːθ/', 'sự thật']], 'ð'),
  p('ð', 'consonant', 'this', 'Vị trí như /θ/ nhưng dây thanh rung.', [['this', '/ðɪs/', 'này'], ['mother', '/ˈmʌðər/', 'mẹ'], ['breathe', '/briːð/', 'thở']], 'θ'),
  p('s', 'consonant', 'see', 'Đưa hơi qua khe hẹp giữa lưỡi và lợi; không rung.', [['see', '/siː/', 'nhìn'], ['lesson', '/ˈlesən/', 'bài học'], ['bus', '/bʌs/', 'xe buýt']], 'ʃ'),
  p('z', 'consonant', 'zoo', 'Vị trí như /s/ nhưng dây thanh rung.', [['zoo', '/zuː/', 'sở thú'], ['easy', '/ˈiːzi/', 'dễ'], ['eyes', '/aɪz/', 'đôi mắt']], 's'),
  p('ʃ', 'consonant', 'she', 'Môi hơi tròn, lưỡi gần vòm sau lợi; thổi hơi không rung.', [['she', '/ʃiː/', 'cô ấy'], ['nation', '/ˈneɪʃən/', 'quốc gia'], ['fish', '/fɪʃ/', 'cá']], 's'),
  p('ʒ', 'consonant', 'vision', 'Vị trí như /ʃ/ nhưng dây thanh rung.', [['vision', '/ˈvɪʒən/', 'tầm nhìn'], ['usual', '/ˈjuːʒuəl/', 'thường lệ'], ['garage', '/ɡəˈrɑːʒ/', 'ga-ra']], 'dʒ'),
  p('h', 'consonant', 'hat', 'Đẩy hơi nhẹ qua thanh môn; không siết cổ.', [['hat', '/hæt/', 'mũ'], ['behind', '/bɪˈhaɪnd/', 'phía sau'], ['home', '/hoʊm/', 'nhà']]),
  p('tʃ', 'consonant', 'chair', 'Bắt đầu như /t/, nhả ngay sang /ʃ/; không rung.', [['chair', '/tʃeər/', 'ghế'], ['teacher', '/ˈtiːtʃər/', 'giáo viên'], ['watch', '/wɒtʃ/', 'xem']], 'dʒ'),
  p('dʒ', 'consonant', 'job', 'Bắt đầu như /d/, nhả sang /ʒ/; dây thanh rung.', [['job', '/dʒɒb/', 'công việc'], ['magic', '/ˈmædʒɪk/', 'phép thuật'], ['large', '/lɑːrdʒ/', 'lớn']], 'tʃ'),
  p('m', 'consonant', 'man', 'Khép hai môi, cho hơi thoát qua mũi; dây thanh rung.', [['man', '/mæn/', 'đàn ông'], ['summer', '/ˈsʌmər/', 'mùa hè'], ['time', '/taɪm/', 'thời gian']], 'n'),
  p('n', 'consonant', 'no', 'Đầu lưỡi chạm lợi trên, hơi qua mũi.', [['no', '/noʊ/', 'không'], ['dinner', '/ˈdɪnər/', 'bữa tối'], ['sun', '/sʌn/', 'mặt trời']], 'ŋ'),
  p('ŋ', 'consonant', 'sing', 'Cuống lưỡi chạm vòm mềm, hơi qua mũi; không thêm âm /g/.', [['sing', '/sɪŋ/', 'hát'], ['English', '/ˈɪŋɡlɪʃ/', 'tiếng Anh'], ['long', '/lɒŋ/', 'dài']], 'n'),
  p('l', 'consonant', 'light', 'Đầu lưỡi chạm lợi trên, hơi thoát qua hai bên lưỡi.', [['light', '/laɪt/', 'ánh sáng'], ['yellow', '/ˈjeloʊ/', 'màu vàng'], ['feel', '/fiːl/', 'cảm thấy']], 'r'),
  p('r', 'consonant', 'red', 'Cong nhẹ lưỡi nhưng không chạm vòm; môi hơi tròn.', [['red', '/red/', 'màu đỏ'], ['around', '/əˈraʊnd/', 'xung quanh'], ['car', '/kɑːr/', 'xe hơi']], 'l'),
  p('j', 'consonant', 'yes', 'Lưỡi nâng gần vòm cứng rồi trượt nhanh vào nguyên âm.', [['yes', '/jes/', 'vâng'], ['use', '/juːz/', 'sử dụng'], ['young', '/jʌŋ/', 'trẻ']], 'dʒ'),
  p('w', 'consonant', 'we', 'Chu môi như /uː/ rồi mở nhanh vào nguyên âm.', [['we', '/wiː/', 'chúng tôi'], ['away', '/əˈweɪ/', 'đi xa'], ['quick', '/kwɪk/', 'nhanh']], 'v'),
]

export const IPA_GROUPS = [
  { id: 'vowel', label: 'Nguyên âm đơn', description: '12 âm' },
  { id: 'diphthong', label: 'Nguyên âm đôi', description: '8 âm' },
  { id: 'consonant', label: 'Phụ âm', description: '24 âm' },
]

export const CONTRAST_PAIRS = [
  ['iː', 'ɪ', 'sheep', 'ship'],
  ['e', 'æ', 'bed', 'bad'],
  ['uː', 'ʊ', 'fool', 'full'],
  ['ɑː', 'ʌ', 'cart', 'cut'],
  ['θ', 'ð', 'think', 'this'],
  ['s', 'ʃ', 'sip', 'ship'],
  ['tʃ', 'dʒ', 'cheap', 'jeep'],
  ['l', 'r', 'light', 'right'],
  ['p', 'b', 'pig', 'big'],
  ['t', 'd', 'ten', 'den'],
  ['k', 'ɡ', 'coat', 'goat'],
  ['f', 'v', 'fan', 'van'],
]

export function findSound(symbol) {
  return IPA_SOUNDS.find((sound) => sound.symbol === symbol)
}
