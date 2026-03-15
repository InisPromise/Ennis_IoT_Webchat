require('dotenv').config();
var express = require('express');
var socket = require('socket.io');
var admin = require('firebase-admin');

// Firebase setup
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  })
});

var db = admin.firestore();
var messagesCollection = db.collection('messages');

// App setup
var app = express();
var server = app.listen(4000, function(){
    console.log('listening for requests on port 4000,');
});

// Static files
app.use(express.static('public'));

// Socket setup & pass server
var io = socket(server);
io.on('connection', (socket) => {

    console.log('made socket connection', socket.id);

    // On connect: query 10 most recent messages and emit each to the new user
    messagesCollection
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get()
        .then(snapshot => {
            var messages = [];
            snapshot.forEach(doc => messages.push(doc.data()));
            // Reverse so oldest of the 10 appears first
            messages.reverse().forEach(msg => {
                socket.emit('chat', msg);
            });
        })
        .catch(err => {
            console.log('Error fetching messages:', err);
        });

    // Handle chat event
    socket.on('chat', function(data){
        // Add document to Firestore
        messagesCollection.add({
            handle: data.handle,
            message: data.message,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        })
        .then(docRef => {
            console.log('Message saved, document ID:', docRef.id);
        })
        .catch(err => {
            console.log('Error saving message:', err);
        });

        // Broadcast to all connected clients
        io.sockets.emit('chat', data);
    });

});