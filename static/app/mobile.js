import { getSocket } from '../framework/domber.js'

export function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod|Touch/i.test(navigator.userAgent);
}

let socket = null;
let joystickStartHandler = null;
let joystickMoveHandler = null;
let joystickEndHandler = null;
let bombTouchHandler = null;
let bombTouchEndHandler = null;

let joystickTouchId = null;
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
  if (bombTouchEndHandler) bomb.removeEventListener('touchend', bombTouchEndHandler);

  joystickStartHandler = function(e) {
    let touch = e.touches[0];
    joystickTouchId = touch.identifier;
    touchStart = { x: touch.clientX, y: touch.clientY };
  };

  joystickMoveHandler = function(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchId) {
        let dx = touch.clientX - touchStart.x;
        let dy = touch.clientY - touchStart.y;

        let threshold = 4;
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
        console.log("joyStickMove")
          socket.sendMessage({
            action: "game",
            content: JSON.stringify([currentDirection]),
          });
        }
        break; // only process the joystick touch
      }
    }
  };

  joystickEndHandler = function(e) {
    for (const touch of e.changedTouches) {
      if (touch.identifier === joystickTouchId) {
        currentDirection = null;
        joystickTouchId = null;
        console.log("joyStickEnd")
        socket.sendMessage({
          action: "game",
          content: JSON.stringify([""]),
        });
        break;
      }
    }
  };

  // 💣 Bomb handler
  bombTouchHandler = function() {
    console.log("bombTouch")
    socket.sendMessage({
      action: "game",
      content: JSON.stringify([currentDirection, "bomb"]),
    });
  };
  
  bombTouchEndHandler = function() {
    console.log("bombEnd")
    socket.sendMessage({
      action: "game",
      content: JSON.stringify([currentDirection]),
    });
  };

  // 🎯 Add new listeners
  joystick.addEventListener('touchstart', joystickStartHandler, { passive: false });
  joystick.addEventListener('touchmove', joystickMoveHandler, { passive: false });
  joystick.addEventListener('touchend', joystickEndHandler, { passive: false });
  bomb.addEventListener('touchstart', bombTouchHandler, { passive: false });
  bomb.addEventListener('touchend', bombTouchEndHandler, { passive: false });
}
