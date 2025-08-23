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
    let answeredCount = 0;              // cleared questions count
    const clearedKnowledge = new Set(); // IDs of knowledge questions cleared (answered correctly at least once)
    let lastCleared = false;            // whether the last submission cleared a knowledge question
    let lastAttitudeAnswered = false;   // whether the last submission answered an attitude question

    function updateProgress(done, total){
      const pct = total ? Math.round((done/total)*100) : 0;
      if (progressBar) progressBar.style.width = pct + '%';
      const wrap = document.querySelector('.progress-wrap');
      if (wrap) wrap.setAttribute('aria-valuenow', pct);
      if (progressText) progressText.textContent = `${done} / ${total}（${pct}%）`;
    }
    updateProgress(0, totalQuestions);
// 狀態
    let mode = "knowledge_initial"; // knowledge_initial → knowledge_review → attitude
    let kIndex = 0;                 // 知識題目前索引（第一輪）
    let aIndex = 0;                 // 態度題目前索引

    // 錯題佇列（FIFO）與集合避免重複排隊
    const wrongQueue = [];
    const wrongSet = new Set();

    function renderQuestion(q) {
      const isKnowledge = q.type === "knowledge";
      const questionText = isKnowledge ? q.question : q.statement;

      const optionsHTML = q.options.map(opt => `
        <label>
          <input type="radio" name="option" value="${opt}"> ${opt}
        </label><br>
      `).join("");

      quizContainer.innerHTML = `
        <h2>• ${questionText}</h2>
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
        // 第一輪知識題結束，決定是否進入複習
        if (wrongQueue.length > 0) {
          mode = "knowledge_review";
          showNext();
          return;
        }
        // 沒有錯題就進態度題
        mode = "attitude";
        showNext();
        return;
      }

      if (mode === "knowledge_review") {
        if (wrongQueue.length > 0) {
          const q = wrongQueue[0]; // 取隊首
          renderQuestion(q);
          return;
        }
        // 錯題清空後，進入態度題
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
        // 全部完成
        updateProgress(totalQuestions, totalQuestions);
        quizContainer.innerHTML = "<h2>🎉 小測驗完成，感謝您的作答！</h2>";
      }
    }

    function enqueueWrong(q) {
      if (!wrongSet.has(q.id)) {
        wrongSet.add(q.id);
        wrongQueue.push(q);
      }
    }

    window.checkAnswer = function () {
      
      // progress flags reset
      lastCleared = false;
      lastAttitudeAnswered = false;
      const selected = document.querySelector('input[name="option"]:checked');
      if (!selected) {
        alert("請先選擇一個答案！");
        return;
      }

      const userAnswer = selected.value;

      // 依 mode 找到目前題目
      let q;
      if (mode === "knowledge_initial") {
        q = { ...knowledge[kIndex], type: "knowledge" };
      } else if (mode === "knowledge_review") {
        q = wrongQueue[0];
      } else {
        q = { ...attitude[aIndex], type: "attitude" };
      }

      // 判題 + 回饋
      if (q.type === "knowledge") {
        if (userAnswer === q.correct) {
          resultText.textContent = "✅ 答對了！";
          // progress: mark cleared if first time
          if (!clearedKnowledge.has(q.id)) {
            clearedKnowledge.add(q.id);
            lastCleared = true;
          }
          explanationText.textContent = q.feedback.correct;

          // 如果在複習階段答對，從佇列移除；在第一輪就對則不用進佇列
          if (mode === "knowledge_review") {
            wrongSet.delete(q.id);
            wrongQueue.shift();
          }
        } else {
          resultText.textContent = "❌ 錯了唷～";
          explanationText.textContent = q.feedback.incorrect;

          // 第一輪或複習只要答錯就（再次）確保在佇列中
          enqueueWrong(q);
        }
      } else {
        const agreeOptions = ["同意", "非常同意"];
        const isAgree = agreeOptions.includes(userAnswer);
        resultText.textContent = "📝 回饋";
        // progress: attitude question counts once per submission
        lastAttitudeAnswered = true;
        explanationText.textContent = isAgree ? q.feedback.agree : q.feedback.disagree;
      }

      resultModal.classList.remove("hidden");
    };

    window.closeModal = function () {
      
      // progress: if a knowledge question was cleared just now
      if (lastCleared) {
        answeredCount = Math.min(answeredCount + 1, totalQuestions);
        updateProgress(answeredCount, totalQuestions);
        lastCleared = false;
      }
resultModal.classList.add("hidden");

      // 移動指標／佇列
      if (mode === "knowledge_initial") {
        kIndex += 1;
      } else if (mode === "knowledge_review") {
        // 若上一題答對已從隊首移除，這裡不需要再動作；
        // 若答錯仍在隊首，下一次仍會出現相同題直到答對。
      } else if (mode === "attitude") {
        // progress: attitude question answered
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
