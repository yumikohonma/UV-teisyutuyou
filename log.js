// Firebaseからログを取得し、カテゴリごとに表示する
import { db } from './firebase-config.js';
import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// HTML内のログ表示エリアを取得
const logList = document.getElementById("log-list");

// Firestoreのコレクションを取得、作成日時順に並び替え
const logsRef = collection(db, "logs");
const q = query(logsRef, orderBy("createdAt", "desc"));

// カテゴリごとのログを格納するオブジェクト
const logsByCategory = {};

// Firestoreからデータ取得
getDocs(q).then((snapshot) => {
  snapshot.forEach((doc) => {
    const data = doc.data();
    const category = data.category || "未分類";
    if (!logsByCategory[category]) {
      logsByCategory[category] = [];
    }
    logsByCategory[category].push(data);
  });

  renderLogsByCategory();
}).catch((error) => {
  console.error("ログ取得エラー:", error);
  logList.innerHTML = "<p>ログの取得に失敗しました。</p>";
});

// カテゴリごとにHTMLを出力する関数
function renderLogsByCategory() {
  for (const category in logsByCategory) {
    const section = document.createElement("section");
    section.className = "log-category-section";

    const title = document.createElement("h2");
    title.textContent = category;
    section.appendChild(title);

    logsByCategory[category].forEach((log) => {
      const item = document.createElement("div");
      item.className = "log-item";
      item.innerHTML = `
        <p>${sanitize(log.summary)}</p>
        <small>${log.createdAt?.toDate().toLocaleString() || ""}</small>
        <hr>
      `;
      section.appendChild(item);
    });

    logList.appendChild(section);
  }
}

// セキュリティのためのHTMLサニタイズ関数
function sanitize(str) {
  const temp = document.createElement("div");
  temp.textContent = str;
  return temp.innerHTML;
}
