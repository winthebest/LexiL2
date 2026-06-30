// Lớp lưu trữ "Thư viện từ vựng GRE L2" — điểm vào công khai.
// Triển khai thiet-ke-storage-tu-vung-gre-l2.md trên Dexie/IndexedDB.
//
// Đây là MODULE SONG SONG, chưa thay localStorage cũ. Cách dùng nhanh:
//   import * as store from './lib/store'
//   await store.migrateFromLocalStorage()         // nhập dữ liệu app cũ 1 lần
//   await store.addWord('loquacious', { source })  // enrich (kiểm cache) + lưu
//   await store.searchWords('nói')                 // Library list
//   await store.getFamily('loqu')                  // Family/root lens
//   await store.computeMetrics()                   // 2 metric dẫn xuất
//   await store.exportJSON()                       // backup một-cú-bấm
//
// Trong dev, store còn được gắn vào window.greStore (xem main.jsx) để chạy thử
// nhanh từ DevTools mà không cần rewire UI.

export { db, DB_NAME, normalizeId, makeWordRecord, toCardLayer, recordToCard } from './db.js'

// Vòng đời + cache (Mục 6, 7.1–7.3, 7.9)
export {
  getWord,
  hasWord,
  cacheGet,
  cacheSet,
  addWord,
  updateWord,
  archiveWord,
  unarchiveWord,
  reEnrich,
  setEtymologyVerified,
  bulkImport,
} from './words.js'

// Lens & truy vấn (Mục 5)
export {
  allWords,
  searchWords,
  filterWords,
  sortWords,
  listClusters,
  getCluster,
  listRoots,
  getFamily,
  getLeeches,
  randomWords,
} from './lenses.js'

// Ôn / metric / ngân hàng đề (Mục 6, 7.6, 7.10)
export {
  logReview,
  computeMetrics,
  addQuestion,
  getQuestionsFor,
  nextUnseenQuestion,
  markSeen,
  flagQuestion,
  LEECH_THRESHOLD,
} from './review.js'

// Backup / xuất / nhập / settings (Mục 6, 7.4, 8)
export {
  getSettings,
  updateSettings,
  dumpAll,
  exportJSON,
  importJSON,
  backupNow,
  shouldRemindBackup,
  buildAnkiTsv,
  exportAnki,
} from './backup.js'

// Di trú từ localStorage cũ
export { migrateFromLocalStorage } from './migrate.js'
