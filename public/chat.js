// Make connection
var socket = io.connect('http://localhost:4000');

// Query DOM
var message = document.getElementById('message'),
      handle = document.getElementById('handle'),
      btn = document.getElementById('send'),
      output = document.getElementById('output');

// Load toxicity model
const threshold = 0.9;
let toxicityModel = null;

toxicity.load(threshold).then(model => {
  toxicityModel = model;
});

// Emit events
btn.addEventListener('click', function(){
  toxicityModel.classify([message.value]).then(predictions => {
    const isToxic = predictions.some(p => p.results[0].match === true);

    socket.emit('chat', {
      message: isToxic ? '*****' : message.value,
      handle: handle.value
    });
    message.value = "";
  });
});

// Listen for events
socket.on('chat', function(data){
    output.innerHTML += '<p><strong>' + data.handle + ': </strong>' + data.message + '</p>';
});