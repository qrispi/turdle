// Global Variables
let winningWord = '';
let currentRow = 1;
let guess = '';
let gamesPlayed = [];
let apiWords;

// Query Selectors
const inputs = document.querySelectorAll('input');
const guessButton = document.querySelector('#guess-button');
const keyLetters = document.querySelectorAll('span');
const errorMessage = document.querySelector('#error-message');
const viewRulesButton = document.querySelector('#rules-button');
const viewGameButton = document.querySelector('#play-button');
const viewStatsButton = document.querySelector('#stats-button');
const gameBoard = document.querySelector('#game-section');
const letterKey = document.querySelector('#key-section');
const rules = document.querySelector('#rules-section');
const stats = document.querySelector('#stats-section');
const gameOverBox = document.querySelector('#game-over-section');
const gameOverGuessCount = document.querySelector('#game-over-guesses-count');
const gameOverGuessGrammar = document.querySelector('#game-over-guesses-plural');

// Event Listeners
inputs.forEach(input => input.addEventListener('keyup', (event) => event.key === 'Backspace' ? moveToLastInput(event) : moveToNextInput(event)));
keyLetters.forEach(letter => letter.addEventListener('click', clickLetter));
guessButton.addEventListener('click', submitGuess);
window.addEventListener('keypress', (event) => event.key === 'Enter' ? submitGuess() : null);
viewRulesButton.addEventListener('click', viewRules);
viewGameButton.addEventListener('click', viewGame);
viewStatsButton.addEventListener('click', fetchStats);

// Functions
fetchWords();

function fetchWords() {
  fetch('http://localhost:3001/api/v1/words')
      .then(response => response.json())
      .then(data => apiWords = data)
      .then(setGame)
      .catch(error => console.log(error));
}

function setGame() {
  currentRow = 1;
  winningWord = getRandomWord();
  updateInputPermissions();
}

function getRandomWord() {
  let randomIndex = Math.floor(Math.random() * 2500);
  return apiWords[randomIndex];
}

function updateInputPermissions() {
  inputs.forEach(input => !input.id.includes(`-${currentRow}-`) ? input.disabled = true : input.disabled = false);
  inputs[(currentRow - 1) * 5].focus();
}

function moveToNextInput(e) {
  let key = e.keyCode || e.charCode;
  if( key !== 8 && key !== 46 && key !== 13) {
    let indexOfNext = parseInt(e.target.id.split('-')[2]) + 1;
    if (indexOfNext < 30) {
      inputs[indexOfNext].focus();
    }
  }
}

function moveToLastInput(e) {
  let indexOfLast = parseInt(e.target.id.split('-')[2]) - 1;
  if (indexOfLast > -1) {
    inputs[indexOfLast].focus();
  }
}

function clickLetter(e) {
  let activeInput;
  let activeIndex;
  inputs.forEach((input, index) => {
    if(input.id.includes(`-${currentRow}-`) && !input.value && !activeInput) {
      activeInput = input;
      activeIndex = index;
    }
  });
  activeInput.value = e.target.innerText;
  inputs[activeIndex + 1].focus();
}

function submitGuess() {
  if (checkIsWord()) {
    errorMessage.innerText = '';
    compareGuess();
    if (checkForWin()) {
      setTimeout(endGame, 1000);
    } else if (currentRow < 6) {
      changeRow();
    } else {
      setTimeout(endGame, 1000);
    }
  } else {
    clearInvalidWord();
    errorMessage.innerText = 'Not a valid word. Try again!';
    setTimeout(clearErrorMessage, 2000);
  }
}

function checkIsWord() {
  guess = '';
  inputs.forEach(input => input.id.includes(`-${currentRow}-`) ? guess += input.value : null);
  return apiWords.includes(guess);
}

function clearInvalidWord() {
  inputs.forEach(input => input.id.includes(`-${currentRow}-`) ? input.value = '' : null);
  inputs[(currentRow - 1) * 5].focus();
}

function clearErrorMessage() {
  errorMessage.innerText = '';
}

function compareGuess() {
  let guessLetters = guess.split('');
  guessLetters.forEach((letter, i) => {
    if (winningWord.includes(letter) && winningWord.split('')[i] !== letter) {
      updateBoxColor(i, 'wrong-location');
      updateKeyColor(letter, 'wrong-location-key');
    } else if (winningWord.split('')[i] === letter) {
      updateBoxColor(i, 'correct-location');
      updateKeyColor(letter, 'correct-location-key');
    } else {
      updateBoxColor(i, 'wrong');
      updateKeyColor(letter, 'wrong-key');
    }
  });
}

function updateBoxColor(letterLocation, className) {
  let row = [];
  inputs.forEach(input => input.id.includes(`-${currentRow}-`) ? row.push(input) : null);
  row[letterLocation].classList.add(className);
}

function updateKeyColor(letter, className) {
  let keyLetter;
  keyLetters.forEach(key => key.innerText === letter ? keyLetter = key : null);
  keyLetter.classList.add(className);
}

function checkForWin() {
  return guess === winningWord;
}

function changeRow() {
  currentRow++;
  updateInputPermissions();
}

function endGame() {
  recordGameStats();
  changeGameOverText();
  viewGameOverMessage();
  setTimeout(startNewGame, 4000);
}

function recordGameStats() {
  fetch('http://localhost:3001/api/v1/games', {
    method: 'POST',
    body: JSON.stringify({solved: checkForWin(), guesses: currentRow}),
    headers: {
      'Content-Type': 'application/json'
    }
  }).catch(error => console.log(error));
}

function fetchStats() {
  fetch('http://localhost:3001/api/v1/games')
    .then(response => response.json())
    .then(json => gamesPlayed = json)
    .then(updateStats)
    .catch(error => console.log(error));
}

function updateStats() {
  const totalGamesSpan = document.getElementById('stats-total-games');
  const percentCorrectSpan = document.getElementById('stats-percent-correct');
  const averageGuessesSpan = document.getElementById('stats-average-guesses');
  let totalGames = gamesPlayed.length;
  let gamesWon = 0;
  let totalGuesses = 0;
  gamesPlayed.forEach(game => {
    if (game.solved) {
      gamesWon++;
    }
    totalGuesses += game.numGuesses;
  });
  if (totalGames > 0) {
    totalGamesSpan.innerText = totalGames;
    averageGuessesSpan.innerText = Math.round(totalGuesses / totalGames);
    percentCorrectSpan.innerText = Math.round((gamesWon / totalGames) * 100);
  }
  viewStats();
}

function changeGameOverText() {
  if (checkForWin()) {
    let guessCount = currentRow;
    let guessNoun;
    currentRow < 2 ? guessNoun = 'guess' : guessNoun = 'guesses';
    gameOverBox.innerHTML = 
      `<h3>Yay!</h3>
      <p class="informational-text">You did it! It took you ${guessCount} ${guessNoun} to find the correct word.</p>`;
  } else {
    gameOverBox.innerHTML = 
      `<h3>GAME OVER</h3>
      <p class="informational-text">You had 6 chances and you blew them all! Try again next time!</p>
      <h3>The word was: ${winningWord}</h3>`;
  }
}

function startNewGame() {
  clearGameBoard();
  clearKey();
  setGame();
  viewGame();
  // WHY DO I NEED THIS LINE????? SETGAME SHOULD BE DOING THIS!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  inputs[0].focus();
}

function clearGameBoard() {
  inputs.forEach(input => {
    input.value = '';
    input.classList.remove('correct-location', 'wrong-location', 'wrong');
  });
}

function clearKey() {
  keyLetters.forEach(key => key.classList.remove('correct-location-key', 'wrong-location-key', 'wrong-key'));
}

// Change Page View Functions
function viewRules() {
  letterKey.classList.add('hidden');
  gameBoard.classList.add('collapsed');
  rules.classList.remove('collapsed');
  stats.classList.add('collapsed');
  viewGameButton.classList.remove('active');
  viewRulesButton.classList.add('active');
  viewStatsButton.classList.remove('active');
}

function viewGame() {
  letterKey.classList.remove('hidden');
  gameBoard.classList.remove('collapsed');
  rules.classList.add('collapsed');
  stats.classList.add('collapsed');
  gameOverBox.classList.add('collapsed');
  viewGameButton.classList.add('active');
  viewRulesButton.classList.remove('active');
  viewStatsButton.classList.remove('active');
}

function viewStats() {
  letterKey.classList.add('hidden');
  gameBoard.classList.add('collapsed');
  rules.classList.add('collapsed');
  stats.classList.remove('collapsed');
  viewGameButton.classList.remove('active');
  viewRulesButton.classList.remove('active');
  viewStatsButton.classList.add('active');
}

function viewGameOverMessage() {
  gameOverBox.classList.remove('collapsed');
  letterKey.classList.add('hidden');
  gameBoard.classList.add('collapsed');
}