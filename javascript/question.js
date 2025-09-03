// === user_id：固定不變 ===
let userId = localStorage.getItem("userId");
if (!userId) {
  userId = Date.now(); 
  localStorage.setItem("userId", userId);
}

// === session_id：每次測驗不同 ===
const sessionId = Date.now(); 

// 依當前 html 檔名推測 json
const currentPage = window.location.pathname.split("/").pop();
const jsonFilename = currentPage.replace(".html", ".json");

fetch(`../data/${jsonFilename}`)
  .then((res) => res.json())
  .then((data) => {
    const quizContainer = document.getElementById("quiz-container");
    const resultModal = document.getElementById("resultModal");
    const resultText = document.getElementById("resultText");
    const explanationText = document.getElementById("explanationText");

    const knowledge = data.knowledge || [];
    const attitude  = data.attitude  || [];

    // === Progress Bar State ===
    const progressBar  = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const totalQuestions = knowledge.length + attitude.length;
    let answeredCount = 0;              
    const clearedKnowledge = new Set(); 
    let lastCleared = false;            
    let lastAttitudeAnswered = false;   

    function updateProgress(done, total){
      const pct = total ? Math.round((done/total)*100) : 0;
      if (progressBar) progressBar.style.width = pct + '%';
      const wrap = document.querySelector('.progress-wrap');
      if (wrap) wrap.setAttribute('aria-valuenow', pct);
      if (progressText) progressText.textContent = `${done} / ${total}（${pct}%）`;
    }
    updateProgress(0, totalQuestions);

    // 狀態
    let mode = "knowledge_initial"; 
    let kIndex = 0;                 
    let aIndex = 0;                 

    // 錯題佇列（FIFO）
    const wrongQueue = [];
    const wrongSet = new Set();

    function renderQuestion(q) {
      const isKnowledge = q.type === "knowledge";
      const questionText = isKnowledge ? q.question : q.statement;

      const optionsHTML = q.options.map(opt => `
        <label>
          <input type="radio" name="option" value="${opt}"> 
            <span>${opt}</span>
        </label><br>
      `).join("");

      document.getElementById("quiz-questions").innerHTML = `
        <h2>${questionText}</h2>
        <form id="${q.id}">
          ${optionsHTML}
          <button type="button" class="question-botton" onclick="checkAnswer()">提交</button>
        </form>
      `;
    }

    function showNext() {
      if (mode === "knowledge_initial") {
        if (kIndex < knowledge.length) {
          const q = { ...knowledge[kIndex], type: "knowledge" };
          renderQuestion(q);
          return;
        }
        if (wrongQueue.length > 0) {
          mode = "knowledge_review";
          showNext();
          return;
        }
        mode = "attitude";
        showNext();
        return;
      }

      if (mode === "knowledge_review") {
        if (wrongQueue.length > 0) {
          const q = wrongQueue[0];
          renderQuestion(q);
          return;
        }
        mode = "attitude";
        showNext();
        return;
      }

      if (mode === "attitude") {
        if (aIndex < attitude.length) {
          const q = { ...attitude[aIndex], type: "attitude" };
          renderQuestion(q);
          return;
        }

        updateProgress(totalQuestions, totalQuestions);
        document.getElementById("quiz-questions").innerHTML = "";
        document.getElementById("quiz-finish").classList.remove("hidden");
      }
    }

    function enqueueWrong(q) {
      if (!wrongSet.has(q.id)) {
        wrongSet.add(q.id);
        wrongQueue.push(q);
      }
    }

    function renderTextWithLineBreaks(text) {
      if (!text) return "";
      return text.replace(/\n/g, "<br>");
    }

    // === 新增：送答題紀錄到後端 ===
    function sendAnswer(q, userAnswer, isCorrect) {
      fetch("https://quiz-backend-02dc.onrender.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "3jnDfg4nw0wSDkb4295NBJkdwhuf378S" // 你的 API key
        },
        body: JSON.stringify({
          user_id: userId,
          session_id: sessionId,
          question_id: q.id,
          selected_option: userAnswer,
          is_correct: isCorrect
        })
      })
      .then(res => res.json())
      .then(data => {
        console.log("✅ 已存進資料庫:", data);
      })
      .catch(err => {
        console.error("❌ 存資料失敗:", err);
      });
    }

    // === checkAnswer ===
    window.checkAnswer = function () {
      lastCleared = false;
      lastAttitudeAnswered = false;

      const selected = document.querySelector('input[name="option"]:checked');
      if (!selected) {
        alert("請先選擇一個答案！");
        return;
      }

      const userAnswer = selected.value;
      let isCorrect = null;   // 預設 null

      let q;
      if (mode === "knowledge_initial") {
        q = { ...knowledge[kIndex], type: "knowledge" };
      } else if (mode === "knowledge_review") {
        q = wrongQueue[0];
      } else {
        q = { ...attitude[aIndex], type: "attitude" };
      }

      if (q.type === "knowledge") {
        if (userAnswer === q.correct) {
          resultText.textContent = "✅ 答對了！";
          isCorrect = true;
          if (!clearedKnowledge.has(q.id)) {
            clearedKnowledge.add(q.id);
            lastCleared = true;
          }
          explanationText.textContent = q.feedback.correct;

          if (mode === "knowledge_review") {
            wrongSet.delete(q.id);
            wrongQueue.shift();
          }
        } else {
          resultText.textContent = "❌ 錯了唷～";
          isCorrect = false;
          explanationText.textContent = q.feedback.incorrect;
          enqueueWrong(q);
        }
      } else {
        const agreeOptions = ["同意", "非常同意"];
        const isAgree = agreeOptions.includes(userAnswer);
        resultText.textContent = "📝 回饋";
        lastAttitudeAnswered = true;
        explanationText.textContent = isAgree ? q.feedback.agree : q.feedback.disagree;
        isCorrect = null; // 態度題沒有正確性
      }

      // ✅ 這裡送答題紀錄
      sendAnswer(q, userAnswer, isCorrect);

      resultModal.classList.remove("hidden");
    };

    // === closeModal ===
    window.closeModal = function () {
      if (lastCleared) {
        answeredCount = Math.min(answeredCount + 1, totalQuestions);
        updateProgress(answeredCount, totalQuestions);
        lastCleared = false;
      }

      resultModal.classList.add("hidden");

      if (mode === "knowledge_initial") {
        kIndex += 1;
      } else if (mode === "attitude") {
        if (lastAttitudeAnswered) {
          answeredCount = Math.min(answeredCount + 1, totalQuestions);
          updateProgress(answeredCount, totalQuestions);
          lastAttitudeAnswered = false;
        }
        aIndex += 1;
      }

      showNext();
    };

    showNext();
  });
