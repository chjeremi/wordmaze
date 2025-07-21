// game.js

function initGamePage(levelsData) {
  if (typeof initIndexPage === 'function') {
    initIndexPage();
  }

  let level = parseInt(localStorage.getItem('last_visited_level')) || 1;
  let persistentTotalScore = parseInt(localStorage.getItem('persistent_total_score') || '0');
  let currentSessionScoreGain = 0;

  const currentLevelData = levelsData.find(lvl => lvl.level === level);

  if (!currentLevelData) {
    alert(`Data untuk Level ${level} tidak ditemukan.`);
    window.location.hash = '#level-select';
    return;
  }

  const scoreElement = document.getElementById('score');
  const levelDisplayElement = document.getElementById('levelDisplay');
  const nextLevelBtn = document.getElementById('nextLevelBtn');
  const gridContainer = document.getElementById('grid-container');
  const selectionOverlay = document.getElementById('selectionOverlay');
  const currentDragLine = document.getElementById('currentDragLine');

  if (scoreElement) scoreElement.innerText = `Skor: ${persistentTotalScore}`;
  if (levelDisplayElement) levelDisplayElement.innerText = `Level ${level}`;
  if (nextLevelBtn) nextLevelBtn.style.display = 'none';

  function getCenterCoordinates(element) {
    const gridRect = gridContainer.getBoundingClientRect();
    const cellRect = element.getBoundingClientRect();
    return {
      x: (cellRect.left + cellRect.width / 2) - gridRect.left,
      y: (cellRect.top + cellRect.height / 2) - gridRect.top
    };
  }

  async function loadLevel(currentLevelData) {
    const { gridSize, words } = currentLevelData;
    const grid = document.getElementById('grid');
    if (!grid) return;

    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    gridContainer.style.width = `${gridSize * 50 + (gridSize - 1) * 5}px`;
    gridContainer.style.height = `${gridSize * 50 + (gridSize - 1) * 5}px`;
    selectionOverlay.innerHTML = '';

    const wordsListElement = document.getElementById('words');
    if (!wordsListElement) return;

    wordsListElement.innerHTML = '';
    words.forEach(word => {
      const li = document.createElement('li');
      li.innerText = word;
      li.id = 'word-' + word;
      wordsListElement.appendChild(li);
    });

    const directions = [
      [0, 1], [0, -1], [1, 0], [-1, 0],
      [1, 1], [-1, -1], [1, -1], [-1, 1]
    ];

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const matrix = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
    const positions = {};

    for (let word of words) {
      let placed = false;
      const shuffledDirs = directions.sort(() => Math.random() - 0.5);
      for (const [dx, dy] of shuffledDirs) {
        for (let attempt = 0; attempt < 100 && !placed; attempt++) {
          const startRow = Math.floor(Math.random() * gridSize);
          const startCol = Math.floor(Math.random() * gridSize);
          const endRow = startRow + dx * (word.length - 1);
          const endCol = startCol + dy * (word.length - 1);

          if (endRow < 0 || endRow >= gridSize || endCol < 0 || endCol >= gridSize) continue;

          let canPlace = true;
          for (let i = 0; i < word.length; i++) {
            const r = startRow + dx * i;
            const c = startCol + dy * i;
            if (matrix[r][c] && matrix[r][c] !== word[i]) {
              canPlace = false;
              break;
            }
          }

          if (canPlace) {
            positions[word] = [];
            for (let i = 0; i < word.length; i++) {
              const r = startRow + dx * i;
              const c = startCol + dy * i;
              matrix[r][c] = word[i];
              positions[word].push([r, c]);
            }
            placed = true;
          }
        }
        if (placed) break;
      }
    }

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (!matrix[i][j]) matrix[i][j] = letters[Math.floor(Math.random() * letters.length)];
      }
    }

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.innerText = matrix[i][j];
        cell.dataset.row = i;
        cell.dataset.col = j;
        grid.appendChild(cell);
      }
    }

    let isDragging = false;
    let dragPath = [];
    let lastRow = null, lastCol = null;
    let dragDirection = null;
    let firstCellPixelCoords = { x: 0, y: 0 };

    function getCell(row, col) {
      return document.querySelector(`[data-row='${row}'][data-col='${col}']`);
    }

    function arraysEqual(a, b) {
      if (a.length !== b.length) return false;
      const sortedA = [...a].sort((p1, p2) => p1[0] - p2[0] || p1[1] - p2[1]);
      const sortedB = [...b].sort((p1, p2) => p1[0] - p2[0] || p1[1] - p2[1]);
      for (let i = 0; i < sortedA.length; i++) {
        if (sortedA[i][0] !== sortedB[i][0] || sortedA[i][1] !== sortedB[i][1]) return false;
      }
      return true;
    }

    function checkLevelCompletion() {
      const allFound = words.every(w => document.getElementById('word-' + w).classList.contains('found'));
      if (allFound) {
        if (nextLevelBtn) nextLevelBtn.style.display = 'inline-block';
      }
    }

    function checkWordDrag() {
      let foundWord = null;
      for (const [word, coords] of Object.entries(positions)) {
        const sortedDragPath = [...dragPath].sort((p1, p2) => p1[0] - p2[0] || p1[1] - p2[1]);
        if (arraysEqual(coords, sortedDragPath)) {
          const wordElement = document.getElementById('word-' + word);
          if (wordElement && !wordElement.classList.contains('found')) {
            coords.forEach(pos => {
              const cell = getCell(pos[0], pos[1]);
              if (cell) cell.classList.add('found');
            });
            currentSessionScoreGain += 10;
            if (scoreElement) scoreElement.innerText = `Skor: ${persistentTotalScore + currentSessionScoreGain}`;
            wordElement.classList.add('found');
            foundWord = word;
            break;
          } else if (wordElement && wordElement.classList.contains('found')) {
            foundWord = word;
            break;
          }
        }
      }
      checkLevelCompletion();
      return foundWord;
    }

    gridContainer.addEventListener('mousedown', handleStart);
    gridContainer.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);

    gridContainer.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleStart(e.touches[0]);
    }, { passive: false });

    gridContainer.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
      handleMove({ target: touch, clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
    }, { passive: false });

    document.addEventListener('touchend', handleEnd);

    function handleStart(e) {
      const cell = e.target;
      if (!cell || !cell.classList.contains('cell')) return;
      isDragging = true;
      dragPath = [];
      dragDirection = null;
      lastRow = parseInt(cell.dataset.row);
      lastCol = parseInt(cell.dataset.col);
      cell.classList.add('selected');
      dragPath.push([lastRow, lastCol]);
      firstCellPixelCoords = getCenterCoordinates(cell);
      currentDragLine.style.left = `${firstCellPixelCoords.x}px`;
      currentDragLine.style.top = `${firstCellPixelCoords.y}px`;
      currentDragLine.style.display = 'block';
      currentDragLine.style.width = '0px';
      currentDragLine.style.transform = 'rotate(0deg)';
    }

    function handleMove(e) {
      if (!isDragging) return;

      const clientX = e.clientX;
      const clientY = e.clientY;
      if (clientX === undefined || clientY === undefined) return;

      const gridRect = gridContainer.getBoundingClientRect();
      const currentMouseX = clientX - gridRect.left;
      const currentMouseY = clientY - gridRect.top;

      const dx = currentMouseX - firstCellPixelCoords.x;
      const dy = currentMouseY - firstCellPixelCoords.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;

      currentDragLine.style.width = `${length}px`;
      currentDragLine.style.transform = `rotate(${angle}deg)`;

      const cell = document.elementFromPoint(clientX, clientY);
      if (!cell || !cell.classList.contains('cell')) return;

      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      const isInPath = dragPath.some(p => p[0] === row && p[1] === col);

      if (isInPath) {
        if (dragPath.length > 1 && dragPath[dragPath.length - 2][0] === row && dragPath[dragPath.length - 2][1] === col) {
          const removedCellCoords = dragPath.pop();
          const removedCell = getCell(removedCellCoords[0], removedCellCoords[1]);
          if (removedCell) removedCell.classList.remove('selected');
          lastRow = dragPath[dragPath.length - 1][0];
          lastCol = dragPath[dragPath.length - 1][1];
        }
        return;
      }

      const dr = row - lastRow;
      const dc = col - lastCol;

      if (Math.abs(dr) <= 1 && Math.abs(dc) <= 1 && (dr !== 0 || dc !== 0)) {
        if (!dragDirection && dragPath.length === 1) {
          dragDirection = [dr, dc];
        }

        const expectedRow = dragPath[0][0] + dragDirection[0] * dragPath.length;
        const expectedCol = dragPath[0][1] + dragDirection[1] * dragPath.length;

        if (row === expectedRow && col === expectedCol) {
          cell.classList.add('selected');
          dragPath.push([row, col]);
          lastRow = row;
          lastCol = col;
        }
      }
    }

    function handleEnd() {
      if (!isDragging) return;
      isDragging = false;
      currentDragLine.style.display = 'none';
      currentDragLine.style.width = '0px';

      const foundWord = checkWordDrag();
      if (foundWord) {
        const firstCell = getCell(dragPath[0][0], dragPath[0][1]);
        const lastCell = getCell(dragPath[dragPath.length - 1][0], dragPath[dragPath.length - 1][1]);
        if (firstCell && lastCell) {
          const startCoords = getCenterCoordinates(firstCell);
          const endCoords = getCenterCoordinates(lastCell);
          const dx = endCoords.x - startCoords.x;
          const dy = endCoords.y - startCoords.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;

          const persistentLine = document.createElement('div');
          persistentLine.className = 'found-word-line';
          persistentLine.style.left = `${startCoords.x}px`;
          persistentLine.style.top = `${startCoords.y}px`;
          persistentLine.style.width = `${length}px`;
          persistentLine.style.transform = `rotate(${angle}deg)`;
          selectionOverlay.appendChild(persistentLine);
        }
      }

      document.querySelectorAll('.selected').forEach(c => c.classList.remove('selected'));
      dragPath = [];
      dragDirection = null;
      lastRow = null;
      lastCol = null;
    }
  }

  loadLevel(currentLevelData);

  if (nextLevelBtn) {
    nextLevelBtn.onclick = () => {
      persistentTotalScore += currentSessionScoreGain;
      localStorage.setItem('persistent_total_score', persistentTotalScore);
      currentSessionScoreGain = 0;

      if (level < levelsData.length) {
        level++;
        localStorage.setItem('last_visited_level', level);
      } else {
        alert("Selamat! Anda telah menyelesaikan semua level!");
        localStorage.setItem('last_visited_level', 1);
      }
      window.location.hash = '#level-select';
    };
  }

  const logoutButton = document.getElementById('logout');
  if (logoutButton) logoutButton.remove();
}
