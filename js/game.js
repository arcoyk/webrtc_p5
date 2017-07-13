// clientId, localVideo, remoteVideo
// are decleared in main.js
var ctx;
var smallWidth = 260;
var smallHeight = 200;
var poka = new Audio("resources/poka.mp3");
PImage kotori = loadImage("resources/kotori.png");
PImage kappa = loadImage("resources/kappa.png");
Player p1, p2;
Game game;
Ball ball;

void setup(){
  size(smallWidth * 2, smallHeight);
  ctx = externals.context;
  noStroke();
  imageMode(CENTER);
  ellipseMode(CENTER);
  ctx.font = "130px 'Comic Sans MS'";
  ctx.textAlign = 'center';
  initAll();
}

void initAll() {
  p1 = new Player(1, 100, 100);
  p2 = new Player(2, 200, 100);
  game = new Game();
  ball = new Ball(100, 100);
  remoteId = undefined;
}

void draw(){
  if (ready()) {
    sendSync();
    recvSync();
    drawSmallVideo(localVideo);
    drawSmallVideo(remoteVideo);
    updatePlayers();
    drawPlayers();
  }
}

void updatePlayers() {
  if (isFirst()) {
    p1.x = mouseX;
    p1.y = mouseY;
  } else {
    p2.x = mouseX;
    p2.y = mouseY;
  }
}

void drawPlayers() {
  image(kotori, p1.x, p1.y);
  image(kappa, p2.x, p2.y);
}



boolean ready() {
  return localId && remoteId && isChannelOpen();
}

boolean isChannelOpen() {
  return dataChannel && dataChannel.readyState == 'open';
}

function sendSync() {
  var msg = {}
  if (isFirst()) {
    msg = {"p1x":p1.x, "p1y":p1.y};
  } else {
    msg = {"p2x":p2.x, "p2y":p2.y};
  }
  dataChannel.send(JSON.stringify(msg));
}

function recvSync() {
  if (isFirst()) {
    p2.x = remoteData.p2x;
    p2.y = remoteData.p2y;
  } else {
    p1.x = remoteData.p1x;
    p1.y = remoteData.p1y;
  }
}

class Ball {
  int x, y, dx;
  Ball(int _x, int _y) {
    x = _x;
    y = _y;
    dx = 1;
  }
  void update() {
    if (x < 0 || x > width) {
      dx *= -1;
    }
    x += dx;
  }
  void show() {
    // image(wingRight, x, y);
  }
}

class Player {
  int id, x, y;
  boolean attend = false;
  Player(int _id, int _x, int _y) {
    id = _id;
    x = _x;
    y = _y;
  }
  void update() {
  }
  void show() {
  }
}

class Game {
  Game() {
  }
  int point = 0;
  void update() {
  }
  void clear() {
  }
  void show() {
  }
  int state() {
    if ((p1.attend && !p2.attend) || (!p1.attend && p2.attend)) {
      return 1;
    } else if (p1.attend && p2.attend) {
      return 2;
    } else {
      return 0;
    }
  }
}

void keyPressed() {
  if (key == 'a') {
    console.log('a');
  } else if (key == 'f') {
    fullscreen();
  }
}

void drawSmallVideo(video) {
  pushMatrix();
  scale(-1, 1);
  if (video.id === 'localVideo') {
    translate(-smallWidth, 0);
  } else if (video.id === 'remoteVideo'){
    translate(-smallWidth * 2, 0);
  }
  ctx.drawImage(video, 0, 0, smallWidth, smallHeight);
  popMatrix();
} 

function fullscreen(){
  var el = document.querySelector('#mergedCanvas');
  el.webkitRequestFullScreen();
}
