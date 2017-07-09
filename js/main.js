'use strict';
// https://github.com/coturn/coturn
var configuration = {
  ordered: false,
  'iceServers': [
    {
      'url': 'stun:stun.l.google.com:19302'
    },
    {
      'url': 'turn:192.158.29.39:3478?transport=udp',
      'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      'username': '28224511:1379330808'
    },
    {
      'url': 'turn:192.158.29.39:3478?transport=tcp',
      'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      'username': '28224511:1379330808'
    }
  ]
};
var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');
var clientId;
// Where "io" come from?
var socket = io.connect();
var room = 'room1'

// (SGN 1 - SGN 3) Client emits 'ipaddr' -> Server responses its IP address.
// (SGN 4 - SGN 7-*-*) GetUserMedia -> Ask a 'room' -> 'create', 'join' or 'fail'.
// (SGN 8 - SGN 10) CreatePeerConn -> CreateDataChannel -> CreateOffer (and setup callback for each event).
// (SGN 11 - SGN 14) Answer to the offer and setup local / remote config.
// ACTION LIST:
// Bob and Alice = Clients, Kevin = Server
// 1. Bob and Alice hold socket for each.
// 2. Bob and Alice ask 'create or join' a room to Kevin, and get 'ready'.
// 3. Suppose Bob get first. Bob gets 'created' emission followed by 'joined' emission.
// 3. Bob and Alice create RTCPeerConnection with configuration (ICE, STUN, TURN servers).
// 4. Bob creates dataChannel (along with event handlers of dataChannel).
// 5. Bob offers description and setLocalDescription.
// 6. Alice get the offer and setRemoteDescription, then send an answer followed by setLocalDescription.
// 7. Bob get the answer and setRemoteDescription.

// SGN 1
if (location.hostname.match(/localhost|127\.0\.0/)) {
  socket.emit('ipaddr');
}

// SGN 3
socket.on('ipaddr', function(ipaddr) {
  // Do nothing
  // console.log('Ipadder- Server IP address is: ' + ipaddr);
});

grabWebCamVideo();
// SGN 4
function grabWebCamVideo() {
  navigator.mediaDevices.getUserMedia({
    audio: false,
    // Chrome bug requires 'exact':
    // https://bugs.chromium.org/p/chromium/issues/detail?id=620665
    // video: {width: {exact: 1280}, height: {exact: 720}}
    video: true
  })
  .then(gotStream)
  .catch(function(e) {
    console.log("Failed :" + e);
  });
}

var localStream;
// SGN 5
function gotStream(stream) {
  localStream = stream;
  document.querySelector('#localVideo').src = window.URL.createObjectURL(localStream);
  // socket.emit('create or join', room);
}


function joinChatroom() {
  socket.emit('create or join', room);
}

function leaveChatroom() {
  peerConn.close();
  socket.emit('bye', room);
}

// SGN 7-1
socket.on('created', function(room, in_clientId) {
  // Is this proper JavaScript style?
  // clientId = in_clientId;
});

// SGN 7-2
socket.on('joined', function(room, in_clientId) {
  // clientId = in_clientId;
  // If you're alone
  // startLocalVideo();
  // createPeerConnection(configuration);
});

// SGN 7-2-1
socket.on('ready', function() {
  createPeerConnection(configuration);
});

// SGN 8
var peerConn;
var dataChannel;
function createPeerConnection(config) {
  peerConn = new RTCPeerConnection(config);
  peerConn.onicecandidate = function(event) {
    // SGN 11 Send ICE Candidates
    if (event.candidate) {
      sendMessage({
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      });
    } else {
      console.log('End of candidates.');
    }
  };
  peerConn.onaddstream = function(event) {
    remoteVideo.src = URL.createObjectURL(event.stream);
  }
  // isInitiator has been used, but  
  // peerConn close from the initiator 
  // leaves non-initiator behind.
  // So, I take "First come, first served" strategy.
  // 
  // Creating two redundant dataChannels?
  // addStream before negotiation.
  peerConn.addStream(localStream);
  dataChannel = peerConn.createDataChannel('myDataChannel');
  onDataChannelCreated(dataChannel);
  peerConn.createOffer(onLocalSessionCreated, logError);
  // Is this function called when the other slide excuted 'createDataChannel'?
  peerConn.ondatachannel = function(event) {
    dataChannel = event.channel;
    onDataChannelCreated(dataChannel);
  };
  peerConn.oniceconnectionstatechange = function(event) {
    document.querySelector('#connection').innerText = event.target.iceConnectionState;
    document.querySelector('#gathering').innerText = event.target.iceGatheringState;
  };
}

// SGN 9
function onDataChannelCreated(channel) {
  channel.onopen = function() {
    console.log('Channel opened!!!');
  };
  channel.onclose = function() {
    console.log('Channel closed');
  };
  channel.onerror = function() {
    console.log('channel error');
  };
  channel.onmessage = function() {
    console.log('got message');
  };
}

// SGN 10 offer
function onLocalSessionCreated(desc) {
  // setLocalDescription fires onicecandidate.
  peerConn.setLocalDescription(desc, function() {
    sendMessage(peerConn.localDescription);
  }, logError);
}

// SGN 12
function sendMessage(message) {
  console.log('Client sending message: ', message);
  socket.emit('message', message);
}

// SGN 14
socket.on('message', function(message) {
  console.log('Client received message:', message);
  signalingMessageCallback(message);
});

// BUG: Don't addIceCandidate before setRemoteDescription
// Temporary avoiding "DOMException: Error processing ICE candidate" by a flag. 
var flag = false;
function signalingMessageCallback(message) {
  // Where are these types decided?
  if (message.type === 'offer') {
    // SGN 15
    console.log("GET OFFER");
    peerConn.setRemoteDescription(new RTCSessionDescription(message), function() {flag = true}, logError);
    peerConn.createAnswer(onLocalSessionCreated, logError);
  } else if (message.type === 'answer') {
    // SGN 15
    console.log("GET ANSWER:");
    peerConn.setRemoteDescription(new RTCSessionDescription(message), function() {flag = true}, logError);
  } else if (message.type === 'candidate') {
    // SGN 15
    console.log("GET CANDIDATE");
    if (flag) {
      peerConn.addIceCandidate(new RTCIceCandidate({
      candidate: message.candidate
      }));
    }
  } else if (message === 'bye') {
    // TODO: cleanup RTC connection?
    peerConn.close();
  }
}

function logError(err) {
  console.log(err.toString(), err);
}

