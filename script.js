import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 質問リスト
const questions = [
  "最近、職場で気になっていることは？",
  "その出来事は、どんな場面・状況で起こりましたか？",
  "その時どう感じましたか？",
  "何度か繰り返されていますか？",
  "相談しましたか？相談された方の対応は？",
  "仕事の成果にどう影響しましたか？",
  "なぜ起きていると思いますか？",
  "どう変わると良い職場になりますか？",
  "あなたにできたことはありますか？",
  "他の立場の人はどうするべきだったと思いますか？"
];

let currentStep = 0;
const answers = [];

const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const button = document.getElementById("send-button");
const summaryArea = document.getElementById("save-area");
const summaryBox = document.getElementById("ai-summary");
const categoryInput = document.getElementById("category");
const saveButton = document.getElementById("save-button");

function appendMessage(text, sender) {
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  msg.innerText = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function askNextQuestion() {
  if (currentStep < questions.length) {
    appendMessage(questions[currentStep], "bot");
  } else {
    appendMessage("AIが分析中です...", "bot");
    sendToChatGPT();
  }
}

button.addEventListener("click", () => {
  const userText = input.value.trim();
  if (!userText) return;
  appendMessage(userText, "user");
  answers.push(userText);
  input.value = "";
  currentStep++;
  setTimeout(askNextQuestion, 500);
});

window.onload = askNextQuestion;

async function sendToChatGPT() {
  const prompt = `
以下の質問とあなたの回答をもとにまとめた職場課題を140字程度で明確に言語化してください。言葉が足りない部分は飛躍した推測でなければ少しは追加してかまわないので、あなたのモヤモヤした悩みを職場課題として明確に論理的に言語化してください：

${questions.map((q, i) => `${q}\n→ ${answers[i]}`).join("\n")}
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer AIのAPIキー"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API 応答エラー:", data);
      appendMessage("AIの応答を取得できませんでした。", "bot");
      return;
    }

    const result = data.choices[0].message.content.trim();
    appendMessage("AIの分析結果：", "bot");
    appendMessage(result, "bot");

    summaryBox.value = result;
    summaryArea.style.display = "block";

  } catch (error) {
    console.error("通信エラー:", error);
    appendMessage("AIとの通信に失敗しました。", "bot");
  }
}

saveButton.addEventListener("click", async () => {
  const summary = summaryBox.value.trim();
  const category = categoryInput.value.trim();
  if (!summary) return;

  try {
    await addDoc(collection(db, "logs"), {
      summary: summary,
      answers: answers,
      category: category || "未分類",
      likes: 0,
      createdAt: serverTimestamp()
    });
    alert("保存しました！");
    window.location.href = "log.html";
  } catch (err) {
    console.error("保存エラー：", err);
  }

});
