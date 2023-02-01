const io = require('socket.io')();




io.on('connection', client => {

    client.on('start_game', new_game);
    client.on('existing_game', join_game);
  
    function join_game(game_code) {
      client.join(game_code);
      client.number = 2;
      client.emit('init', 'player2');
    }
  
    function new_game(game_code) {
      client.join(game_code);
      client.number = 1;
      client.emit('init', 'player1');
    }

  });
  
io.listen(process.env.PORT || 3000);