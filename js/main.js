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
// There are only two people...
// Using false instead of undefined to safely represent uninitialization
var localId;
var remoteId;
// Where "io" come from?
var socket = io.connect();
var room = 'room1'

grabWebCamVideo();
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
function gotStream(stream) {
  localStream = stream;
  document.querySelector('#localVideo').src = window.URL.createObjectURL(localStream);
  joinChatroom();
}

function joinChatroom() {
  console.log('joining');
  socket.emit('join', room);
}

function leaveChatroom() {
  peerConn.close();
  socket.emit('bye', room);
}

socket.on('joined', function(room, _localId) {
  console.log('joined');
  localId = _localId;
  document.querySelector('#localId').innerText = localId;
});

socket.on('buddy', function(room) {
  console.log('get buddy signal');
  console.log('exchanging id');
  socket.emit('exchangeId', room);
});

socket.on('exchangeId', function(room, _remoteId) {
  remoteId = _remoteId;
  document.querySelector('#remoteId').innerText = remoteId;
  console.log('id exchanged');
  createPeerConnection(configuration);
});

function isFirst() {
  return localId < remoteId;
}

var peerConn;
var dataChannel;
// Where does peerConn connect to server when it exchange ICE throught the server?
function createPeerConnection(config) {
  peerConn = new RTCPeerConnection(config);
  peerConn.onicecandidate = function(event) {
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
  peerConn.oniceconnectionstatechange = function(event) {
    document.querySelector('#connection').innerText = event.target.iceConnectionState;
    document.querySelector('#gathering').innerText = event.target.iceGatheringState;
  };
  // addStream before negotiation.
  peerConn.addStream(localStream);
  if (isFirst()) {
    dataChannel = peerConn.createDataChannel('myChannel');
    setChannelEventHandler(dataChannel);
  } else {
    peerConn.ondatachannel = function(event) {
      dataChannel = event.channel;
      setChannelEventHandler(dataChannel);
    };
  }
  peerConn.createOffer(onLocalSessionCreated, logError);
}

var remoteData = {};
function setChannelEventHandler(channel) {
  channel.onopen = function() {
   console.log('Channel opened!!!');
  };
  channel.onclose = function() {
    console.log('Channel closed');
  };
  channel.onerror = function() {
    console.log('Channel error');
  };
  channel.onmessage = function() {
    remoteData = JSON.parse(event.data);
  };
}

function onLocalSessionCreated(desc) {
  peerConn.setLocalDescription(desc, function() {
    sendMessage(peerConn.localDescription);
  }, logError);
}

function sendMessage(message) {
  socket.emit('message', message);
}

socket.on('message', function(message) {
  signalingMessageCallback(message);
});

// BUG: Don't addIceCandidate before setRemoteDescription
// Temporary avoiding "DOMException: Error processing ICE candidate" by a flag. 
var flag = false;
function signalingMessageCallback(message) {
  if (message.type === 'offer') {
    console.log("GET OFFER");
    peerConn.setRemoteDescription(new RTCSessionDescription(message), function() {flag = true}, logError);
    peerConn.createAnswer(onLocalSessionCreated, logError);
  } else if (message.type === 'answer') {
    console.log("GET ANSWER:");
    peerConn.setRemoteDescription(new RTCSessionDescription(message), function() {flag = true}, logError);
  } else if (message.type === 'candidate') {
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

