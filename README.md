Processing.js on WebRTC

- Peers can share processing.js context throught a data channel of WebRTC.
- Peers shares their ids (throught and comes from socket.io) to make the state asymmetric.


```
node server.js
```
(Start signaling server)

Access 
```
https://localhost:8082
```

Works only in Chrome.
