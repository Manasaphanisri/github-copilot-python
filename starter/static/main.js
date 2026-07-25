// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
let puzzle = [];

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
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = val;
      });
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function renderPuzzle(puz) {
  puzzle = puz;
  createBoardElement();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = puzzle[i][j];
      const inp = inputs[idx];
      if (val !== 0) {
        inp.value = val;
        inp.disabled = true;
        inp.className += ' prefilled';
      } else {
        inp.value = '';
        inp.disabled = false;
      }
    }
  }
}

async function newGame() {
  const res = await fetch('/new');
  const data = await res.json();
  renderPuzzle(data.puzzle);
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
    // stop timer and prompt to save score
    const seconds = stopTimer();
    promptAndSaveScore(seconds);
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
    const date = document.createElement('td'); date.innerText = new Date(list[i].dateISO).toLocaleString();
    row.appendChild(rank);
    row.appendChild(name);
    row.appendChild(time);
    row.appendChild(date);
    tbody.appendChild(row);
  }
}

function promptAndSaveScore(seconds) {
  try {
    const name = (window.prompt('You solved the puzzle! Enter name for leaderboard:', 'Guest') || 'Guest').slice(0, 32);
    const entry = { name, timeSeconds: Number(seconds) || 0, dateISO: new Date().toISOString() };
    saveScore(entry);
    renderLeaderboard();
    // show leaderboard panel
    const container = document.getElementById('leaderboard-container');
    if (container) {
      container.classList.remove('leaderboard-hidden');
      container.setAttribute('aria-hidden', 'false');
    }
  } catch (e) {
    // ignore
  }
}


// Wire buttons
window.addEventListener('load', () => {
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
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
  // initialize
  newGame();
  renderLeaderboard();
});