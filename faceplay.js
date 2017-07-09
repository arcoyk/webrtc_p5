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

void draw_small_video(video, src_type) {
  pushMatrix();
  scale(-1, 1);
  if (src_type == 'local') {
    translate(-small_width, 0);
  } else if (src_type == 'remote'){
    translate(-small_width * 2, 0);
  }
  ctx.drawImage(localVideo, 0, 0, small_width, small_height);
  popMatrix();
} 

void draw_local_video() {
  pushMatrix();
  translate(small_width, 0);
  scale(-1, 1);
  ctx.drawImage(localVideo, 0, 0, small_width, small_height);
  popMatrix();
}

void draw_remote_video() {
  pushMatrix();
  translate(width, 0);
  scale(-1, 1);
  ctx.drawImage(remoteVideo, 0, 0, width, height);
  popMatrix();
}

void draw(){
  draw_small_video(localVideo, 'local');
  draw_small_video(remoteVideo, 'remote');
  image(kotori, mouseX, mouseY);
}

function fullscreen(){
  var el = document.querySelector('#p5Canvas');
  el.webkitRequestFullScreen();
}
