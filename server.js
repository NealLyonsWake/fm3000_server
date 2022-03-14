require('dotenv').config(); // Init dotenv library for handling environment variables
const crypto = require('crypto'); // Init crypto library for generating random IDs
const { Socket } = require('dgram');
const express = require('express'); // Init express library to enable HTTP requests/responses
const req = require('express/lib/request');
const { request } = require('http');
const PORT = process.env.PORT || 9090; // Create Port for server connection
const { Server } = require('ws'); // Init a Websocket library to enable open connections/messages etc

const clientMap = {}; // Init hashmap for the clients to be stored

const server = express()
    .listen(PORT, () => console.log(`Listening on port ${PORT}`)); // Create HTTP server to provide listening hook to Websocket server 

const wss = new Server({ server }); // Init Websocket server variable, using HTTP express server as the arguement

wss.on('connection', (stream, req) => { // Handle all the request and response traffic while client is connected to the Websocket

    const clientConnection = req.socket.remoteAddress; // Obtain client IP address
    const clientID = crypto.randomBytes(64).toString('hex'); // Create a random ID for the client

    clientMap[clientID] = { // Store client details to client hashmap
        'connection': clientConnection
    };

    const payLoad = { // Generate connection payload that stores method and client ID
        'method': 'connect',
        'clientID': clientID
    };

    stream.send(JSON.stringify(payLoad)) // Send payload to the client


    stream.on('message', (msg) => { // Handle all messages and sort below

        const request = JSON.parse(msg); // Store the request in JSON

        if (request.method === 'nickname') {
            clientMap[request.clientID].nickname = request.nickname; // Store client details to client hashmap

            const payLoad = { // Create that a player has joined payLoad broadcast announcement
                'method': 'announce',
                'nickname': request.nickname
            };

            wss.clients.forEach((client) => { // Access each client on the server
                client.send(JSON.stringify(payLoad)); // Broadcast join announcement payLoad to each client
            });
        }

        

    })




});