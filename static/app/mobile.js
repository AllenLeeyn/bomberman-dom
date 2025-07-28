import { getSocket } from '../framework/domber.js'

export function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod|Touch/i.test(navigator.userAgent);
}

let socket = null;
let joystickStartHandler = null;
let joystickMoveHandler = null;
let joystickEndHandler = null;
let bombTouchHandler = null;

let touchStart = { x: 0, y: 0 };
let currentDirection = null;

export function initMobileControls() {
  console.warn("Initializing mobile controls");
  socket = getSocket('lobby')
  const controls = document.getElementById('mobile-controls');
  const joystick = document.getElementById('joystick-container');
  const bomb = document.getElementById('bomb-button');

  if (!controls || !joystick || !bomb) {
    console.warn("Mobile controls not found in DOM.");
    return;
  }

  controls.style.display = 'block';

  if (joystickStartHandler) joystick.removeEventListener('touchstart', joystickStartHandler);
  if (joystickMoveHandler) joystick.removeEventListener('touchmove', joystickMoveHandler);
  if (joystickEndHandler) joystick.removeEventListener('touchend', joystickEndHandler);
  if (bombTouchHandler) bomb.removeEventListener('touchstart', bombTouchHandler);

  joystickStartHandler = function(e) {
    let touch = e.touches[0];
    touchStart = { x: touch.clientX, y: touch.clientY };
  };

  joystickMoveHandler = function(e) {
    let touch = e.touches[0];
    let dx = touch.clientX - touchStart.x;
    let dy = touch.clientY - touchStart.y;

    let threshold = 30;
    let direction = null;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > threshold) direction = 'right';
      else if (dx < -threshold) direction = 'left';
    } else {
      if (dy > threshold) direction = 'down';
      else if (dy < -threshold) direction = 'up';
    }

    if (direction !== currentDirection) {
      currentDirection = direction;
      socket.sendMessage({
        action: "game",
        content: JSON.stringify([currentDirection]),
      });
    }
  };

  joystickEndHandler = function() {
    currentDirection = null;
    socket.sendMessage({
      action: "game",
      content: JSON.stringify([""]),
    });
  };

  // 💣 Bomb handler
  bombTouchHandler = function() {
    socket.sendMessage({
      action: "game",
      content: JSON.stringify(["bomb"]),
    });
  };

  // 🎯 Add new listeners
  joystick.addEventListener('touchstart', joystickStartHandler);
  joystick.addEventListener('touchmove', joystickMoveHandler);
  joystick.addEventListener('touchend', joystickEndHandler);
  bomb.addEventListener('touchstart', bombTouchHandler);
}
