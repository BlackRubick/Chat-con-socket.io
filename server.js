const application = require('express')();
const server = require('http').createServer(application)
const io = require('socket.io')(server);
const PORT = process.env.PORT || 3000

const connected = {}; // variable donde guardo a mis usuarios conectados uwu

application.get('/', (req, res) => {
   res.sendFile(__dirname + '/index.html');
});

server.listen(PORT, () => {
   console.log('Servidor ejecutando en puerto: ' + PORT);
});

io.on('connection', (socket) => {
   socket.on('disconnect', () => {
      delete connected[socket.username];
      console.log('Usuario desconectado - Usuario: ' + socket.username);
   });

   socket.on('new message', (msg) => {
      io.emit('send message', {message: msg, user: socket.username});
   });

   socket.on('new user', (usr) => {
      if (connected[usr]) {
         socket.emit("username error","Nombre de usuario en uso, por favor escoja otro");
      } else {
         connected[usr] = socket.id;
         socket.username = usr;
         console.log('Usuario conectado - Usuario: ' + socket.username);
         socket.emit("username success", usr);
      }
   });

   socket.on('send private message', (data) => {
      const recipient = connected[data.username];
      if (recipient) {
         io.to(recipient).emit('private message', { sender: socket.username, message: data.message });
         socket.emit('new private message', data.username);
      } else {
         socket.emit('username error', 'Nombre de usuario no encontrado');
      }
   });

   socket.on('get connected users', () => {
      socket.emit('connected users', Object.keys(connected));
   });

   socket.on('send image', (imageData) => {
      socket.broadcast.emit('receive image', imageData);
   });

   socket.on('receive image', (imageData) => {
      const messageList = document.getElementById('message_list');
      const chatItem = document.createElement('li');
      const image = document.createElement('img');
      image.src = imageData;
      chatItem.appendChild(image);
      messageList.appendChild(chatItem);
      window.scrollTo(0, document.body.scrollHeight);
   });


});

