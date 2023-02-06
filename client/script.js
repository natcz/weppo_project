const start_game_btn = document.getElementById('start-game');
const play_existing_btn = document.getElementById('existing-game');
const tiles = Array.from(document.getElementsByClassName('tile'));
const game_code_display = document.getElementById('game-code-display');
const init_display = document.getElementById('init');
const TILE_SIZE = tiles[0].style.minWidth;

var game_state = {
  board: ['_', '_', '_',
    '_', '_', '_',
    '_', '_', '_'],
  player2: 'O',
  player1: 'X',
}
var player;
let current_game;

start_game_btn.addEventListener('click', start_game);
play_existing_btn.addEventListener('click', existing_game);

const socket = io();

socket.on('init', init);

socket.on('game update', game_update);

socket.on('game not found', (socket_id, code) => {
  if (socket.id == socket_id) {
    alert("Game not found: " + code);
  }
});

socket.on('game full', (socket_id, code) => {
  if (socket.id == socket_id) {
    alert(`Room ${code} is full!`);
  }
});

function init(player_num) {
  player = player_num;
  init_display.style.display = "none";
  game_screen.style.display = "inline-block";
  document.getElementById('board').style.display = "none";
}

function start_game() {
  let name = get_player_nickname();
  if (name != '') {
    socket.emit('start game', name);
  } else {
    alert("Please enter a nickname");
  }
}
function existing_game() {
  let name = get_player_nickname();
  if (name != '') {
    const game_code = get_game_code();
    socket.emit('join game', name, game_code);
  } else {
    alert("Please enter a nickname");
  }
}

function make_move(index) {
  if (!current_game) {
    return;
  }
  socket.emit('make move', current_game.id, index);
}

for (let i = 0; i < tiles.length; i++) {
  tiles[i].addEventListener("click", function() {
    make_move(i)
  });
}

function alert_winner(symbol) {
  if (game_state.player1 == symbol) {
    alert('The winner is player1!')
  }
  else {
    alert('The winner is player2!')
  }
}

function get_player_nickname() {
  return document.getElementById('entry_nick').value;
}

function get_game_code() {
  return document.getElementById('game-id').value;
}

function is_player_in(game) {
  if (game.player_x) {
    if (game.player_x[0] == socket.id) {
      return true;
    }
  }
  if (game.player_o) {
    if (game.player_o[0] == socket.id) {
      return true;
    }
  }

  return false;
}

function game_update(game) {
  if (current_game && !is_player_in(current_game)) {
    current_game = null;
    document.getElementById('board').style.display = 'none'
    document.getElementById('game-code-display').textContent = "";
  }
  if (!is_player_in(game)) {
    return;
  }

  current_game = game;
  document.getElementById('game-code-display').textContent = game.id;
  document.getElementById('board').style.display = 'grid'


  let enemy = "";
  if (!game.player_x || !game.player_o) {
    enemy = "Waiting for player to join..."
  }
  else if (game.player_x[0] == socket.id) {
    enemy = `Enemy: ${game.player_o[1]}`;
  } else if (game.player_o[0] == socket.id) {
    enemy = `Enemy: ${game.player_x[1]}`;
  }
  document.getElementById('enemy').textContent = enemy;

  if (game.turn == null) {
    document.getElementById('turn').textContent = "";
  } else if (game.turn == socket.id) {
    document.getElementById('turn').textContent = "Your turn";
  } else {
    document.getElementById('turn').textContent = "Enemy turn";
  }

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (game.board[i][j] == 'X') {
        tiles[i * 3 + j].textContent = 'X';
      } else if (game.board[i][j] == 'O') {
        tiles[i * 3 + j].textContent = 'O';
      } else {
        tiles[i * 3 + j].textContent = '';
      }
    }
  }

  if (game.winner) {
    if (game.winner[0] == socket.id) {
      alert("You won!");
    } else {
      alert("You lost!");
    }
    document.getElementById('turn').textContent = `The winner is ${game.winner[1]}`
  } else if (game.status === 'draw') {
    alert("It's a draw!");
    document.getElementById('turn').textContent = 'DRAW!'
  }
}

