const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = 3004;

const box = 20;
const players = {};
let food = createFood();

app.use(express.static(path.join(__dirname, 'public')));

function createFood() {
  return {
    x: Math.floor(Math.random() * 20) * box,
    y: Math.floor(Math.random() * 20) * box,
  };
}

function moveSnake(snake, direction) {
  const head = { ...snake[0] };
  if (direction === 'UP') head.y -= box;
  if (direction === 'DOWN') head.y += box;
  if (direction === 'LEFT') head.x -= box;
  if (direction === 'RIGHT') head.x += box;
  snake.unshift(head);
  return snake;
}

function checkCollision(snake) {
  const head = snake[0];
  return (
    head.x < 0 || head.x >= 400 ||
    head.y < 0 || head.y >= 400 ||
    snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)
  );
}

io.on('connection', socket => {
  console.log(`Player joined: ${socket.id}`);

  players[socket.id] = {
    snake: [{ x: 100, y: 100 }],
    direction: 'RIGHT',
    score: 0,
    color: '#' + Math.floor(Math.random() * 16777215).toString(16),
  };

  socket.on('direction', dir => {
    players[socket.id].direction = dir;
  });

  socket.on('disconnect', () => {
    console.log(`Player left: ${socket.id}`);
    delete players[socket.id];
  });
});

setInterval(() => {
  for (const id in players) {
    const player = players[id];
    player.snake = moveSnake(player.snake, player.direction);

    const head = player.snake[0];

    if (head.x === food.x && head.y === food.y) {
      player.score += 10;
      food = createFood();
    } else {
      player.snake.pop();
    }

    if (checkCollision(player.snake)) {
      player.snake = [{ x: 100, y: 100 }];
      player.direction = 'RIGHT';
      player.score = 0;
    }
  }

  io.emit('gameState', {
    players,
    food,
  });
}, 160);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
