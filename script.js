fetch("iron_1.json")
  .then((res) => res.json())
  .then((data) => {
    const container = document.getElementById("quiz-container");

    function renderKnowledgeSection(titleText, questions, sectionId) {
      const section = document.createElement("div");
      section.id = sectionId;

      const title = document.createElement("h2");
      title.textContent = titleText;
      section.appendChild(title);

      questions.forEach((q, index) => {
        const qDiv = document.createElement("div");
        qDiv.className = "question";

        const qText = document.createElement("p");
        qText.textContent = `${index + 1}. ${q.question}`;
        qDiv.appendChild(qText);

        const optionsDiv = document.createElement("div");
        optionsDiv.className = "options";

        for (const key in q.options) {
          const label = document.createElement("label");
          label.innerHTML = `<input type="radio" name="${q.id}" value="${key}">  ${q.options[key]}`;
          optionsDiv.appendChild(label);
        }

        qDiv.appendChild(optionsDiv);

        const resultDiv = document.createElement("div");
        resultDiv.className = "result";
        resultDiv.style.display = "none";
        resultDiv.dataset.correct = q.correct;
        resultDiv.dataset.options = JSON.stringify(q.options);
        resultDiv.dataset.qid = q.id;
        qDiv.appendChild(resultDiv);

        section.appendChild(qDiv);
      });

      const button = document.createElement("button");
      button.textContent = "提交";
      button.onclick = () => {
        const results = section.querySelectorAll(".result");
        results.forEach((result) => {
          const selected = section.querySelector(`input[name="${result.dataset.qid}"]:checked`);
          const correct = result.dataset.correct;
          const options = JSON.parse(result.dataset.options);

          if (selected) {
            if (selected.value === correct) {
              result.textContent = `🎉 答對了！正確答案是 ${correct}. ${options[correct]}`;
              result.style.color = "green";
            } else {
              result.textContent = `❌ 答錯了。正確答案是 ${correct}. ${options[correct]}`;
              result.style.color = "red";
            }
          } else {
            result.textContent = "⚠️ 尚未作答。";
            result.style.color = "gray";
          }

          result.style.display = "block";
        });

        button.disabled = true;
        button.textContent = "已提交";
      };

      section.appendChild(button);
      container.appendChild(section);
    }

    function renderAttitudeSection(titleText, questions, sectionId) {
      const section = document.createElement("div");
      section.id = sectionId;

      const title = document.createElement("h2");
      title.textContent = titleText;
      section.appendChild(title);

      const options = ["非常同意", "同意", "不同意", "非常不同意"];

      questions.forEach((q, index) => {
        const qDiv = document.createElement("div");
        qDiv.className = "question";

        const qText = document.createElement("p");
        qText.textContent = `${index + 1}. ${q.question}`;
        qDiv.appendChild(qText);

        const optionsDiv = document.createElement("div");
        optionsDiv.className = "options";

        options.forEach((opt) => {
          const label = document.createElement("label");
          label.innerHTML = `<input type="radio" name="${q.id}" value="${opt}">  ${opt}`;
          optionsDiv.appendChild(label);
        });

        qDiv.appendChild(optionsDiv);
        section.appendChild(qDiv);
      });

      const resultDiv = document.createElement("div");
      resultDiv.className = "result";
      resultDiv.style.display = "none";
      resultDiv.style.color = "green";
      resultDiv.textContent = "✅ 已提交";
      section.appendChild(resultDiv);

      const button = document.createElement("button");
      button.textContent = "提交";
      button.onclick = () => {
        resultDiv.style.display = "block";
        button.disabled = true;
        button.textContent = "已提交";
      };

      section.appendChild(button);
      container.appendChild(section);
    }

    // 渲染順序
    renderKnowledgeSection("💡為什麼孕期容易缺鐵？貧血風險與影響", data.knowledge1, "k1");
    renderAttitudeSection("💬 你的想法", data.attitude1, "a1");
    renderKnowledgeSection("💡鐵的來源：食物來源與影響吸收食物", data.knowledge2, "k2");
    renderAttitudeSection("💬 你的想法", data.attitude2, "a2");

    // 建立補充連結區塊
    const infoLink = document.createElement("div");
    infoLink.style.marginTop = "50px";
    infoLink.innerHTML = `
        <a href="https://devline2025.github.io/A_anemia-pregnancy/" target="_blank"
            style="color: #d96b00; text-decoration: underline;">
            🔗 點我回顧孕期補鐵的小知識吧！
        </a>
    `;

    // 加到 body 最後
    document.body.appendChild(infoLink);
  });
