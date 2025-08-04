
fetch("baby_ch3.json")
  .then((res) => res.json())
  .then((data) => {
    const quizContainer = document.getElementById("quiz-container");
    const resultModal = document.getElementById("resultModal");
    const resultText = document.getElementById("resultText");
    const explanationText = document.getElementById("explanationText");

    const allQuestions = [...data.knowledge.map(q => ({ ...q, type: "knowledge" })), 
                          ...data.attitude.map(q => ({ ...q, type: "attitude" }))];

    let currentIndex = 0;

    function showQuestion(index) {
      const q = allQuestions[index];
      const isKnowledge = q.type === "knowledge";

      let optionsHTML = "";
      if (isKnowledge) {
        optionsHTML = q.options.map(opt => `
          <label><input type="radio" name="option" value="${opt}"> ${opt}</label><br>
        `).join("");
      } else {
        optionsHTML = q.options.map(opt => `
          <label><input type="radio" name="option" value="${opt}"> ${opt}</label><br>
        `).join("");
      }

      const questionText = isKnowledge ? q.question : q.statement;

      quizContainer.innerHTML = `
        <h2>${index + 1}. ${questionText}</h2>
        <form id="${q.id}">
          ${optionsHTML}
          <button type="button" onclick="checkAnswer()">提交</button>
        </form>
      `;
    }

    window.checkAnswer = function () {
      const selected = document.querySelector('input[name="option"]:checked');
      if (!selected) return;

      const userAnswer = selected.value;
      const q = allQuestions[currentIndex];

      if (q.type === "knowledge") {
        if (userAnswer === q.correct) {
          resultText.textContent = "✅ 答對了！";
          explanationText.textContent = q.feedback.correct;
        } else {
          resultText.textContent = "❌ 不對唷～";
          explanationText.textContent = q.feedback.incorrect;
        }
      } else {
        const agreeOptions = ["同意", "非常同意"];
        const isAgree = agreeOptions.includes(userAnswer);
        resultText.textContent = "📝 回饋";
        explanationText.textContent = isAgree ? q.feedback.agree : q.feedback.disagree;
      }

      resultModal.classList.remove("hidden");
    };

    window.closeModal = function () {
      resultModal.classList.add("hidden");
      currentIndex++;
      if (currentIndex < allQuestions.length) {
        showQuestion(currentIndex);
      } else {
        quizContainer.innerHTML = "<h2>🎉 小測驗完成，感謝您的作答！</h2>";
      }
    };

    showQuestion(currentIndex);
  });
