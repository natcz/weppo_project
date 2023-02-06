const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);


app.use(express.static(__dirname + "/../client/"));
app.use(express.static(__dirname + "/../node_modules/"));
app.get('/', (_, res) => {
  res.sendFile(__dirname + '/index.html');
});

let connectedUsers = {}
let games = []

io.on('connection', (socket) => {
  connectedUsers[socket.id] = socket
  socket.on('disconnect', () => {
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});

io.on('connection', (socket) => {
  socket.on('disconnect', () => {
    let game = games.find(game => game.player_x != null && game.player_x[0] == socket.id || game.player_o != null && game.player_o[0] == socket.id)

    if (!game) {
      return;
    }

    leave_game(socket, game.id)
  })

  socket.on('start game', (name) => {
    let id = create_room()
    join(socket, name, id)
  })

  socket.on('join game', (name, game_id) => {
    join(socket, name, game_id)
  })

  socket.on('make move', (game_id, index) => {
    make_move(socket, game_id, index)
  })
});

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
// function declaration from https://www.programiz.com/javascript/examples/generate-random-strings
function generateString(length) {
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

function generate_code() {
  let code = generateString(8);
  return code;
}

function create_room() {
  let game_id = generate_code();
  games.push({
    "id": game_id,
    "player_x": null,
    "player_o": null,
    "board": [
      [null, null, null],
      [null, null, null],
      [null, null, null]],
    "status": "waiting",
    "turn": null
  })

  return game_id;
}

function close_room(game_id) {
  games = games.filter(game => game.id != game_id)
  if (games.length !== 0) {
    io.emit('room closed', { "game_id": game_id });
  }
}

function join(socket, name, game_id) {
  let existing_game = games.find(game => game.player_x != null && game.player_x[0] == socket.id || game.player_o != null && game.player_o[0] == socket.id)
  let game = games.find(game => game.id == game_id)
  if (!game) {
    io.emit('game not found', socket.id, game_id);
    return;
  }

  if (game.player_x == null) {
    game.player_x = [socket.id, name]
  } else if (game.player_o == null) {
    game.player_o = [socket.id, name]
  } else {
    io.emit('game full', socket.id, game_id);
    return;
  }

  if(existing_game) {
    leave_game(socket, existing_game.id)
  }


  if (game_ready(game_id)) {
    game.status = "started"
    game.board = [[null, null, null], [null, null, null], [null, null, null]]
    game.winner = null
    game.turn = game.player_x[0]
  }

  io.emit('game update', game);
}

function leave_game(socket, game_id) {
  let game = games.find(game => game.id == game_id)
  if (!game) {
    return;
  }

  if (game.player_x && game.player_x[0] == socket.id) {
    game.player_x = null
    game.turn = null
  } else if(game.player_o && game.player_o[0] == socket.id) {
    game.player_o = null
    game.turn = null
  } else {
    return;
  }

  if(!game.player_x && !game.player_o) {
    close_room(game_id)
  }

  game.status = "waiting"
  io.emit('game update', game)
}

function make_move(socket, game_id, index) {
  let game = games.find(game => game.id == game_id)

  if(!game || !game_ready(game.id)) {
    return;
  }

  if (game.turn != socket.id) {
    return;
  }

  let row = Math.floor(index / 3)
  let col = index % 3

  if (game.board[row][col] != null) {
    return;
  }

  let move_sign = game.player_x[0] == socket.id ? "X" : "O"

  let enemy = game.player_x[0] == socket.id ? game.player_o[0] : game.player_x[0]
  game.board[row][col] = move_sign

  if (check_win_condition(game)) {
    game.status = "finished"
    let winner = game.turn == game.player_x[0] ? game.player_x : game.player_o
    game.winner = winner;
    io.emit('game update', game);
    close_room(game_id)
    return;
  } else if (is_every_square_occupied(game)) {
    game.status = "draw"
    io.emit('game update', game);
    close_room(game_id)
    return;
  }

  game.turn = enemy;
  io.emit('game update', game);
}

function game_ready(game_id) {
  let game = games.find(game => game.id == game_id)
  return game.player_x != null && game.player_o != null
}

function check_win_condition(game) {
  let board = game.board
  let win = false

  for (let i = 0; i < 3; i++) {
    if (board[i][0] == board[i][1] && board[i][1] == board[i][2] && board[i][0] != null) {
      win = true
    }

    if (board[0][i] == board[1][i] && board[1][i] == board[2][i] && board[0][i] != null) {
      win = true
    }
  }

  if (board[0][0] == board[1][1] && board[1][1] == board[2][2] && board[0][0] != null) {
    win = true
  }

  if (board[0][2] == board[1][1] && board[1][1] == board[2][0] && board[0][2] != null) {
    win = true
  }

  return win
}

function is_every_square_occupied(game) {
  let board = game.board

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i][j] == null) {
        return false
      }
    }
  }

  return true
}
