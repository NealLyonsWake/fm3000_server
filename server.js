require('dotenv').config(); // Init dotenv library for handling environment variables
const crypto = require('crypto'); // Init crypto library for generating random IDs
const express = require('express'); // Init express library to enable HTTP requests/responses
const PORT = process.env.PORT || 9090; // Create Port for server connection
const { Server } = require('ws'); // Init a Websocket library to enable open connections/messages etc

let clientMap = []; // Init array for the clients to be stored

const server = express()
    .listen(PORT, () => console.log(`Listening on port ${PORT}`)); // Create HTTP server to provide listening hook to Websocket server 

const wss = new Server({ server }); // Init Websocket server variable, using HTTP express server as the arguement

wss.on('connection', (stream, req) => { // Handle all the request and response traffic while client is connected to the Websocket

    const clientConnection = req.socket.remoteAddress; // Obtain client IP address

    console.log('Client IP:', clientConnection)

    const index = clientMap.findIndex((client) => {
        return client.connection === clientConnection;
    })
    if (index === -1) {

        const clientID = crypto.randomBytes(64).toString('hex'); // Create a random ID for the client

        clientMap.push({ // Add initial client ID and IP to clients array
            'clientID': clientID,
            'connection':
                clientConnection
        });

        const payLoad = { // Generate connection payload that stores method and client ID
            'method': 'connect',
            'clientID': clientID
        };

        stream.send(JSON.stringify(payLoad)) // Send client ID payload to the client
    }
    else {

        const remindClientID = clientMap[index].clientID;

        const payLoad = { // Generate reconnect payload that stores method and client ID
            'method': 'connect',
            'clientID': remindClientID
        };

        stream.send(JSON.stringify(payLoad)) // Send client ID reminder payload to the client
    }

    stream.on('close', () => {
        const index = clientMap.findIndex((client)=>{
            return client.connection === req.socket.remoteAddress
        })
        console.log(req.socket.remoteAddress, 'has closed')
    })

    stream.on('message', (msg) => { // Handle all messages and sort below

        const request = JSON.parse(msg); // Store the request in JSON

        if (request.method === 'close') { // Close method
            const index = clientMap.findIndex((client) => { // Determine index of client's request ID
                return client.clientID === request.clientID;
            })

            if (index !== -1) {
                clientMap.splice(index, 1); // Remove request client from clients map
            }
            console.log('closed')

            const payLoad = { // Create that a player has left payLoad broadcast announcement
                'method': 'announce',
                'nickname': request.nickname,
                'joined_or_left': 'left'
            };

            wss.clients.forEach((client) => { // Access each client on the server
                client.send(JSON.stringify(payLoad)); // Broadcast leave announcement payLoad to each client
            });

            stream.close(); // Close the connection of the request client
        }

        if (request.method === 'nickname') {

            clientMap = clientMap.map((client) => {
                if (client.clientID === request.clientID) {
                    return { ...client, nickname: request.nickname } // Store client nickname to clients array
                }
                else {
                    return { ...client } // Return the client if the client ID doesn't match the request
                }
            })

            const payLoad = { // Create that a player has joined payLoad broadcast announcement
                'method': 'announce',
                'nickname': request.nickname,
                'joined_or_left': 'joined'
            };

            wss.clients.forEach((client) => { // Access each client on the server
                client.send(JSON.stringify(payLoad)); // Broadcast join announcement payLoad to each client
            });
        }

        else if (request.method === 'inputPosition') {

            clientMap = clientMap.map((client) => {
                if (client.clientID === request.clientID) { // Store client position in client array
                    return { ...client, xPosition: request.xPosition, yPosition: request.yPosition }
                }
                else {
                    return { ...client } // Return the client if the client ID doesn't match the request
                }
            })

            const payLoad = { // Create payload for broadcasting client positions
                'method': 'broadcastPositions',
                'clientMap': clientMap
            };

            wss.clients.forEach((client) => { // Access each client on the server
                client.send(JSON.stringify(payLoad)); // Broadcast client positions payLoad to each client
            });


        }
    })
});




