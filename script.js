let questions = [];
let currentQuestion = 0;
let score = 0;
let timerInterval;
let duration = 300;
let vocabData = [];
let totalQuestions = 30; // Default

function showSection(section) {
  document.querySelectorAll('.section').forEach(el => el.classList.add('hidden'));
  document.getElementById(`${section}-section`).classList.remove('hidden');
  if (section === 'vocab') renderVocab();
  if (section === 'result') renderScoreHistory();
}

function startQuiz() {
  const file = document.getElementById('excelFile').files[0];
  if (!file) {
    showAlert('Masukkan File Excel Terlebih Dahulu');
    return;
  }

  const difficulty = document.querySelector('input[name="difficulty"]:checked');
  if (!difficulty) {
    showAlert('Pilih tingkat kesulitan terlebih dahulu');
    return;
  }

  if (difficulty.value === 'easy') totalQuestions = 15;
  else if (difficulty.value === 'medium') totalQuestions = 30;
  else totalQuestions = 50;

  const reader = new FileReader();
  duration = parseInt(document.getElementById('duration').value);

  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    vocabData = jsonData.slice(1).map(row => ({ vocab: row[0], meaning: row[1] }));
    questions = [...vocabData]
      .sort(() => 0.5 - Math.random())
      .slice(0, totalQuestions);

    currentQuestion = 0;
    score = 0;
    showSection('quiz');
    showQuestion();
    startTimer();
  };

  reader.readAsArrayBuffer(file);
}

function showQuestion() {
  if (currentQuestion >= questions.length) return;

  const q = questions[currentQuestion];
  const options = [q.meaning];
  while (options.length < 5) {
    const other = vocabData[Math.floor(Math.random() * vocabData.length)].meaning;
    if (!options.includes(other)) options.push(other);
  }
  options.sort(() => 0.5 - Math.random());

  document.getElementById('quiz-content').innerHTML = `
    <div class="question">
      <h3>(${currentQuestion + 1}/${totalQuestions}) Apa arti dari: <strong>${q.vocab}</strong>?</h3>
      <div class="options">
        ${options.map((opt, i) => `
          <label>
            <input type="radio" name="answer" value="${opt}">
            ${String.fromCharCode(65 + i)}. ${opt}
          </label>`).join('')}
      </div>
      <button class="start-btn" onclick="checkAnswer()">Jawab</button>
      <div class="progress">Progress: ${currentQuestion + 1}/${totalQuestions}</div>
    </div>
  `;
}

function checkAnswer() {
  const selected = document.querySelector('input[name="answer"]:checked');
  const feedback = document.createElement('p');
  if (selected) {
    if (selected.value === questions[currentQuestion].meaning) {
      feedback.textContent = 'Benar!';
      feedback.style.color = 'green';
      score++;
    } else {
      feedback.textContent = `Salah. Jawaban yang benar: ${questions[currentQuestion].meaning}`;
      feedback.style.color = 'red';
    }
    document.getElementById('quiz-content').appendChild(feedback);
    setTimeout(() => {
      currentQuestion++;
      if (currentQuestion < totalQuestions) {
        showQuestion();
      } else {
        submitQuiz();
      }
    }, 1500);
  }
}

function submitQuiz() {
  const confirmBox = document.createElement('div');
  confirmBox.className = 'confirm-overlay';
  confirmBox.innerHTML = `
    <div class="confirm-box">
      <p>Apakah Anda yakin ingin menyelesaikan kuis?</p>
      <button onclick="confirmFinish(true)">Ya</button>
      <button onclick="confirmFinish(false)">Tidak</button>
    </div>
  `;
  document.body.appendChild(confirmBox);
}

function confirmFinish(confirmed) {
  const box = document.querySelector('.confirm-overlay');
  if (box) box.remove();
  if (confirmed) {
    clearInterval(timerInterval);
    showSection('result');
    document.getElementById('score').textContent = `Skor Anda: ${score} dari ${totalQuestions}`;
    saveScore(score);
  }
}

function startTimer() {
  let timeLeft = duration;
  const timerDisplay = document.getElementById('timer');
  function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `Sisa Waktu: ${minutes}m ${seconds}s`;
    if (timeLeft <= 0) {
      submitQuiz();
    } else {
      timeLeft--;
    }
  }
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
}

function renderVocab() {
  const list = document.getElementById('vocab-list');
  list.innerHTML = vocabData.map((v, i) => `
    <li>
      <strong>${v.vocab}</strong>: ${v.meaning}
    </li>`).join('');
}

function saveScore(score) {
  const history = JSON.parse(localStorage.getItem('scoreHistory') || '[]');
  history.push({ score, date: new Date().toLocaleString() });
  localStorage.setItem('scoreHistory', JSON.stringify(history));
}

function renderScoreHistory() {
  const history = JSON.parse(localStorage.getItem('scoreHistory') || '[]');
  const scoreDiv = document.getElementById('score-history');
  scoreDiv.innerHTML = '<h3>Riwayat Skor:</h3>' +
    '<ul>' +
    history.map(h => `<li>${h.date}: ${h.score}/${totalQuestions}</li>`).join('') +
    '</ul>';
}

function showAlert(message) {
  const alertBox = document.createElement('div');
  alertBox.className = 'custom-alert';
  alertBox.innerHTML = `
    <div class="custom-alert-content">
      <p>${message}</p>
      <button onclick="this.parentElement.parentElement.remove()">OK</button>
    </div>
  `;
  document.body.appendChild(alertBox);
}

function goBackToUpload() {
  document.getElementById('result-section').classList.add('hidden');
  document.getElementById('upload-section').classList.remove('hidden');
}
