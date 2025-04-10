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

app.use(express.static(path.join(__dirname, 'public'))); // Serves static frontend

// Function to generate random food position
function createFood() {
  return {
    x: Math.floor(Math.random() * 20) * box,
    y: Math.floor(Math.random() * 20) * box,
  };
}

// Function to move the snake based on direction
function moveSnake(snake, direction) {
  const head = { ...snake[0] };
  if (direction === 'UP') head.y -= box;
  if (direction === 'DOWN') head.y += box;
  if (direction === 'LEFT') head.x -= box;
  if (direction === 'RIGHT') head.x += box;
  snake.unshift(head); // Add new head to the front
  return snake;
}

// Function to check for wall or self-collision
function checkCollision(snake) {
  const head = snake[0];
  return (
    head.x < 0 || head.x >= 400 ||
    head.y < 0 || head.y >= 400 ||
    snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)
  );
}

// Handle new player connection
io.on('connection', socket => {
  console.log(`Player joined: ${socket.id}`);

  // Initialize player object
  players[socket.id] = {
    snake: [{ x: 100, y: 100 }],
    direction: 'RIGHT',
    score: 0,
    color: '#' + Math.floor(Math.random() * 16777215).toString(16),
  };

  // Handle direction change
  socket.on('direction', dir => {
    players[socket.id].direction = dir;
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Player left: ${socket.id}`);
    delete players[socket.id];
  });
});

// Game loop
setInterval(() => {
  for (const id in players) {
    const player = players[id];
    player.snake = moveSnake(player.snake, player.direction);

    const head = player.snake[0];

    // If player eats the food
    if (head.x === food.x && head.y === food.y) {
      player.score += 10;
      food = createFood();
    } else {
      player.snake.pop(); // Remove tail if food not eaten
    }

    // Check for collisions
    if (checkCollision(player.snake)) {
      player.snake = [{ x: 100, y: 100 }];
      player.direction = 'RIGHT';
      player.score = 0;
    }
  }

  // Send updated game state to all clients
  io.emit('gameState', {
    players,
    food,
  });
}, 160);

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
