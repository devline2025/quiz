document.addEventListener("DOMContentLoaded", () => {
  fetch("../html/quiz_content.html") 
    .then(res => res.text())
    .then(data => {
      document.getElementById("quiz_content").innerHTML = data;  
    })
    .catch(err => console.error("載入 content.html 失敗:", err));
});
