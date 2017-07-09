var ctx;
PImage kotori = loadImage("kotori.png");
var poka = new Audio("poka.mp3");
var small_width = 260;
var small_height = 200;
void setup(){
  size(small_width * 2, small_height);
  ctx = externals.context;
  noStroke();
  imageMode(CENTER);
  ellipseMode(CENTER);
  ctx.font = "130px 'Comic Sans MS'";
  ctx.textAlign = 'right';
}

void draw_small_video(video) {
  pushMatrix();
  scale(-1, 1);
  if (video.id === 'localVideo') {
    translate(-small_width, 0);
  } else {
    // video.id == 'remoteVideo'
    translate(-small_width * 2, 0);
  }
  ctx.drawImage(video, 0, 0, small_width, small_height);
  popMatrix();
} 

void draw(){
  draw_small_video(localVideo);
  draw_small_video(remoteVideo);
  image(kotori, mouseX, mouseY);
}

function fullscreen(){
  var el = document.querySelector('#mergedCanvas');
  el.webkitRequestFullScreen();
}
