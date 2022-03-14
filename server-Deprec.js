// import websocket library
const WebSocket = require('ws');

// import crypto library
const crypto = require('crypto')

// initialise the port
const PORT = 8080;

// create iteration of webSocket server
const wsServer = new WebSocket.Server({
    // specify the port
    port: PORT
});

// create array of player names
let playerNames = []

// webSocket event listener for connection
// when a connection is established to the server
wsServer.on('connection', (socket) => {

    // log that a client is connected
    console.log('A client just connected', socket);




    // broadcast to all that a client has joined
    // wsServer.clients.forEach((client) => {
    //     client.send(JSON.stringify({message:'someone has joined'}))
    // });


    // attach a behaviour to the incoming socket
    socket.on('message', (msg) => {
        const msgObj = JSON.parse(msg)



        // check if client has sent username as join message and broadcast that user has joined
        if (msgObj.username) {
            // check if username already exists and close if so
            if (playerNames.includes(msgObj.username)) {
                socket.close(1003, `${msgObj.username} already exists.`)
            }
            else {
                // add username to playerNames array
                playerNames.push(msgObj.username)

                // generate and send a random ID to the client who joined
                socket.send(JSON.stringify({ id: crypto.randomBytes(64).toString('hex') }))

                // broadcast a client has just joined
                wsServer.clients.forEach((client) => {
                    client.send(JSON.stringify({ message: `${msgObj.username} has joined.` }))
                });
            }
        }

        // log that a client sent a message and log the message
        // console.log(`Recieved message from client: ${msg}`);
        // send out the message back to the client
        // socket.send(`Hey, take this back: ${msg}`)

        // broadcast the message to all connected clients
        // clients are inside an array within the wsServer object
        // access the array of clients connected to the server using .clients
        // wsServer.clients.forEach((client) => {
        //     client.send(JSON.stringify({message:`Someone said: ${msg}`}))
        // });
    });
});


// log that the server is listening
console.log(`Server is listening on port ${PORT}`)