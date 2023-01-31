const start_game_btn = document.getElementById('start-game');
const play_existing_btn = document.getElementById('existing-game');
const player_nickname = document.getElementById('entry_nick').value;
const tiles = Array.from(document.getElementsByClassName('tile'));
const game_code_input = document.getElementById('game-id');
const game_screen = document.getElementById('game-screen');
const game_code_display = document.getElementById('game-code-display');
const init_display = document.getElementById('init');
const TILE_SIZE = tiles[0].style.minWidth;

var game_state = {
    board: ['_','_','_',
            '_','_','_',
            '_','_','_']
}
var player;
start_game_btn.addEventListener('click', start_game);
play_existing_btn.addEventListener('click', existing_game);

const io = require('socket.io')();
var socket = io();

socket.on('init', init);

function init(player_num){
    player = player_num;
    init_display.style.display = "none";
    game_screen.style.display = "inline-block";
}

const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
// function declaration from https://www.programiz.com/javascript/examples/generate-random-strings
function generateString(length) {
    let result = ' ';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

function generate_code(){
    let code = generateString(8);
    game_code_display.innerText = code;
    return code;
}
function start_game(){
    let game_code = generate_code()
    socket.emit('start_game', game_code)
}
function existing_game(){
    const game_code = game_code_input.value;
    socket.emit('existing_game', game_code);
}

