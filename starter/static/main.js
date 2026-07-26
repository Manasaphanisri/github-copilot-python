// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
let puzzle = [];
let currentSolution = [];
let hintsUsed = 0;
let currentDifficulty = 'medium';
let pendingScore = null;

function applyTheme(isDark) {
  document.body.classList.toggle('dark-theme', isDark);
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.checked = isDark;
    toggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
  }
}

function createBoardElement() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.innerHTML = '';
  for (let i = 0; i < SIZE; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'sudoku-row';
    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.className = 'sudoku-cell';
      input.dataset.row = i;
      input.dataset.col = j;
      input.setAttribute('aria-label', `Row ${i + 1}, Column ${j + 1}`);
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = val;
      });
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function setCellState(input, value, isLocked) {
  input.value = value;
  input.disabled = isLocked;
  input.className = 'sudoku-cell';
  if (isLocked) {
    input.classList.add('prefilled');
  }
}

function renderPuzzle(puz, solution = []) {
  puzzle = puz;
  currentSolution = solution;
  createBoardElement();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = puzzle[i][j];
      const inp = inputs[idx];
      if (val !== 0) {
        setCellState(inp, val, true);
      } else {
        inp.value = '';
        inp.disabled = false;
      }
    }
  }
}

async function newGame() {
  const difficultySelect = document.getElementById('difficulty-select');
  const selectedDifficulty = difficultySelect ? difficultySelect.value : 'medium';
  currentDifficulty = selectedDifficulty;
  hintsUsed = 0;
  updateHintCount();
  hideScoreEntryForm();
  const res = await fetch(`/new?difficulty=${encodeURIComponent(currentDifficulty)}`);
  const data = await res.json();
  renderPuzzle(data.puzzle, data.solution);
  document.getElementById('message').innerText = '';
  // start timer for this game
  startTimer();
}

async function checkSolution() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = [];
  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = inputs[idx].value;
      board[i][j] = val ? parseInt(val, 10) : 0;
    }
  }
  const res = await fetch('/check', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  const data = await res.json();
  const msg = document.getElementById('message');
  if (data.error) {
    msg.style.color = '#d32f2f';
    msg.innerText = data.error;
    return;
  }
  const incorrect = new Set(data.incorrect.map(x => x[0]*SIZE + x[1]));
  for (let idx = 0; idx < inputs.length; idx++) {
    const inp = inputs[idx];
    if (inp.disabled) continue;
    inp.className = 'sudoku-cell';
    if (incorrect.has(idx)) {
      inp.className = 'sudoku-cell incorrect';
    }
  }
  if (incorrect.size === 0) {
    msg.style.color = '#388e3c';
    msg.innerText = 'Congratulations! You solved it!';
    const seconds = stopTimer();
    showScoreEntryForm(seconds);
  } else {
    msg.style.color = '#d32f2f';
    msg.innerText = 'Some cells are incorrect.';
  }
}

// --- Timer and leaderboard utilities (client-only) ---
const LEADERBOARD_KEY = 'sudoku_leaderboard_v1';
let _timerInterval = null;
let _timerStart = null;

function startTimer() {
  // reset any existing
  if (_timerInterval) {
    clearInterval(_timerInterval);
    _timerInterval = null;
  }
  _timerStart = Date.now();
  document.getElementById('timer').innerText = formatTime(0);
  _timerInterval = setInterval(() => {
    const s = Math.floor((Date.now() - _timerStart) / 1000);
    document.getElementById('timer').innerText = formatTime(s);
  }, 1000);
}

function stopTimer() {
  if (_timerInterval) {
    clearInterval(_timerInterval);
    _timerInterval = null;
  }
  if (!_timerStart) return 0;
  const seconds = Math.round((Date.now() - _timerStart) / 1000);
  _timerStart = null;
  document.getElementById('timer').innerText = formatTime(seconds);
  return seconds;
}

function formatTime(totalSeconds) {
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const ss = String(totalSeconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY) || '[]';
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveLeaderboard(list) {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(list));
  } catch (e) {
    // ignore storage errors
  }
}

function saveScore(entry) {
  const list = loadLeaderboard();
  list.push(entry);
  // sort ascending by timeSeconds
  list.sort((a, b) => a.timeSeconds - b.timeSeconds || new Date(a.dateISO) - new Date(b.dateISO));
  const top = list.slice(0, 10);
  saveLeaderboard(top);
  return top;
}

function renderLeaderboard() {
  const tbody = document.querySelector('#leaderboard-table tbody');
  if (!tbody) return;
  const list = loadLeaderboard();
  tbody.innerHTML = '';
  for (let i = 0; i < list.length; i++) {
    const row = document.createElement('tr');
    const rank = document.createElement('td'); rank.innerText = String(i + 1);
    const name = document.createElement('td'); name.innerText = list[i].name || 'Guest';
    const time = document.createElement('td'); time.innerText = formatTime(list[i].timeSeconds || 0);
    const difficulty = document.createElement('td'); difficulty.innerText = list[i].difficulty || 'Medium';
    const hints = document.createElement('td'); hints.innerText = String(list[i].hintsUsed || 0);
    row.appendChild(rank);
    row.appendChild(name);
    row.appendChild(time);
    row.appendChild(difficulty);
    row.appendChild(hints);
    tbody.appendChild(row);
  }
}

function updateHintCount() {
  const countEl = document.getElementById('hint-count');
  if (countEl) {
    countEl.innerText = `Hints: ${hintsUsed}`;
  }
}

function revealHint() {
  if (!currentSolution || currentSolution.length === 0) return;
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv ? boardDiv.getElementsByTagName('input') : [];
  for (let idx = 0; idx < inputs.length; idx++) {
    const inp = inputs[idx];
    if (inp.disabled || inp.value) continue;
    const row = Number(inp.dataset.row);
    const col = Number(inp.dataset.col);
    const correctValue = currentSolution[row][col];
    if (correctValue && correctValue !== 0) {
      inp.value = String(correctValue);
      inp.classList.add('hinted');
      hintsUsed += 1;
      updateHintCount();
      document.getElementById('message').innerText = 'Hint revealed.';
      return;
    }
  }
  document.getElementById('message').innerText = 'No more hints available.';
}

let pendingScoreSeconds = null;

function showScoreEntryForm(seconds) {
  pendingScoreSeconds = Number(seconds) || 0;
  const container = document.getElementById('score-entry-container');
  if (container) {
    container.classList.remove('leaderboard-hidden');
    container.setAttribute('aria-hidden', 'false');
    const input = document.getElementById('player-name');
    if (input) {
      input.value = '';
      input.focus();
    }
  }
}

function hideScoreEntryForm() {
  const container = document.getElementById('score-entry-container');
  if (container) {
    container.classList.add('leaderboard-hidden');
    container.setAttribute('aria-hidden', 'true');
  }
  const form = document.getElementById('score-entry-form');
  if (form) {
    form.reset();
  }
}

function savePendingScoreFromForm(event) {
  if (event) event.preventDefault();
  const input = document.getElementById('player-name');
  const name = (input && input.value ? input.value : 'Guest').trim().slice(0, 32) || 'Guest';
  const entry = {
    name,
    timeSeconds: pendingScoreSeconds || 0,
    difficulty: currentDifficulty || 'medium',
    hintsUsed,
    dateISO: new Date().toISOString()
  };
  saveScore(entry);
  renderLeaderboard();
  hideScoreEntryForm();
  const leaderboard = document.getElementById('leaderboard-container');
  if (leaderboard) {
    leaderboard.classList.remove('leaderboard-hidden');
    leaderboard.setAttribute('aria-hidden', 'false');
  }
}

// Wire buttons
function initializeApp() {
  if (window.__sudokuAppInitialized) {
    return;
  }
  window.__sudokuAppInitialized = true;

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('change', () => applyTheme(themeToggle.checked));
    applyTheme(themeToggle.checked);
  }

  const newGameButton = document.getElementById('new-game');
  if (newGameButton) newGameButton.addEventListener('click', newGame);

  const checkButton = document.getElementById('check-solution');
  if (checkButton) checkButton.addEventListener('click', checkSolution);

  const hintButton = document.getElementById('use-hint');
  if (hintButton) hintButton.addEventListener('click', revealHint);

  const viewBtn = document.getElementById('view-leaderboard');
  if (viewBtn) viewBtn.addEventListener('click', () => {
    renderLeaderboard();
    const c = document.getElementById('leaderboard-container');
    if (c) { c.classList.remove('leaderboard-hidden'); c.setAttribute('aria-hidden', 'false'); }
  });

  const closeBtn = document.getElementById('close-leaderboard');
  if (closeBtn) closeBtn.addEventListener('click', () => {
    const c = document.getElementById('leaderboard-container');
    if (c) { c.classList.add('leaderboard-hidden'); c.setAttribute('aria-hidden', 'true'); }
  });

  const scoreCloseBtn = document.getElementById('close-score-entry');
  if (scoreCloseBtn) scoreCloseBtn.addEventListener('click', hideScoreEntryForm);

  const scoreForm = document.getElementById('score-entry-form');
  if (scoreForm) scoreForm.addEventListener('submit', savePendingScoreFromForm);

  updateHintCount();
  newGame();
  renderLeaderboard();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
window.addEventListener('load', initializeApp);