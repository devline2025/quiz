function finishQuiz(score) {
  const userId = localStorage.getItem("userId");

  fetch("https://quiz-backend-02dc.onrender.com/answers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  })
    .then((res) => res.json())
    .then((data) => {
      const voucherMsg = document.getElementById("voucherMsg");
      if (data.url) {
        voucherMsg.innerHTML =
          `🎁 恭喜！您獲得禮卷：<br>
           <a href="${data.url}" target="_blank">👉 點我領取禮卷</a><br>
           🔢 驗證碼：<b>${data.code}</b>`;
      } else {
        voucherMsg.innerText = data.error;
      }
      document.getElementById("resultSection").style.display = "block";
    });
}