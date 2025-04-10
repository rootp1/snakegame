const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const socket = io();

const box = 20;
const backgroundImage = new Image();
backgroundImage.src = 'image.png';

let lastDirection = 'RIGHT';
const scoreElement = document.getElementById('score');

const opposites = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT'
};

document.addEventListener('keydown', e => {
  let newDirection = null;

  if (e.key === 'ArrowUp') newDirection = 'UP';
  else if (e.key === 'ArrowDown') newDirection = 'DOWN';
  else if (e.key === 'ArrowLeft') newDirection = 'LEFT';
  else if (e.key === 'ArrowRight') newDirection = 'RIGHT';

  if (
    newDirection &&
    newDirection !== lastDirection &&
    newDirection !== opposites[lastDirection]
  ) {
    socket.emit('direction', newDirection);
    lastDirection = newDirection;
  }
});

socket.on('gameState', ({ players, food }) => {
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'red';
  ctx.fillRect(food.x, food.y, box, box);

  for (const id in players) {
    const player = players[id];
    ctx.fillStyle = player.color;
    for (const segment of player.snake) {
      ctx.fillRect(segment.x, segment.y, box, box);
    }

    if (id === socket.id) {
      scoreElement.textContent = `Score: ${player.score}`;
    }
  }
});
