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

    stream.on('close', () => {
        const index = clientMap.findIndex((client) => {
            return client.connection === req.socket.remoteAddress
        })

        if (index !== -1) {

            console.log(clientMap[index].nickname, 'has closed')


            const payLoad = { // Create that a player has left payLoad broadcast announcement
                'method': 'announce',
                // 'nickname': clientMap[index].nickname,
                'announcement': `${clientMap[index].nickname} has left`
            };

            wss.clients.forEach((client) => { // Access each client on the server
                client.send(JSON.stringify(payLoad)); // Broadcast leave announcement payLoad to each client
            });

            clientMap.splice(index, 1); // Remove request client from clients map
        }
        console.log('There are now, ', clientMap.length, 'users connected.')

    })

    stream.on('message', (msg) => { // Handle all messages and sort below

        const request = JSON.parse(msg); // Store the request in JSON

        if (request.method === 'nicknameAndHealth') {

            clientMap = clientMap.map((client) => {
                if (client.clientID === request.clientID) {
                    return { // Store client nickname and health to clients array
                        ...client,
                        nickname: request.nickname,
                        health: request.health
                    }
                }
                else {
                    return { ...client } // Return the client if the client ID doesn't match the request
                }
            })

            console.log(request.nickname, 'has joined. There are now, ', clientMap.length, 'users connected.')
            console.log(clientMap)

            const payLoad = { // Create that a player has joined payLoad broadcast announcement
                'method': 'announce',
                // 'nickname': request.nickname,
                'announcement': `${request.nickname} has joined`
            };

            wss.clients.forEach((client) => { // Access each client on the server
                client.send(JSON.stringify(payLoad)); // Broadcast join announcement payLoad to each client
            });
        }

        else if (request.method === 'inputStatus') {

            clientMap = clientMap.map((client) => {
                if (client.clientID === request.clientID) { // Store client status in client array
                    return {
                        ...client,
                        xPosition: request.xPosition,
                        yPosition: request.yPosition,
                        playerDirection: request.playerDirection,
                        animation: request.animation,
                        gunAngle: request.gunAngle,
                        attack: request.attack,
                        // health: request.health
                    }
                }
                else {
                    return { ...client } // Return the client if the client ID doesn't match the request
                }
            })

            const payLoad = { // Create payload for broadcasting client status
                'method': 'broadcastStatus',
                'clientMap': clientMap
            };

            wss.clients.forEach((client) => { // Access each client on the server
                client.send(JSON.stringify(payLoad)); // Broadcast general client status payLoad to each client
            });


        }

        else if (request.method === 'opponentShot') { // Message update if a player is shot
            const index = clientMap.findIndex((client) => {
                return client.clientID === request.opponentID // Find the player who was shot
            })

            if (clientMap[index].health) {
                clientMap[index].health-- // Subtract 1 from the health of that player who was shot
                if (clientMap[index].health <= 0) {
                    
                    const winnerIndex = clientMap.findIndex((client) => {
                        return client.clientID === request.clientID
                    })
                    
                    const payLoad = {
                        'method': 'announce',
                        'announcement': `${clientMap[index].nickname} was killed by ${clientMap[winnerIndex].nickname}`
                    }
                   
                    wss.clients.forEach((client) => { // Access each client on the server
                        client.send(JSON.stringify(payLoad)); // Broadcast a kill announcement payLoad to each client
                    });
                }
            }

            const payLoad = { // Create payload for broadcasting client status
                'method': 'broadcastStatus',
                'clientMap': clientMap
            };

            wss.clients.forEach((client) => { // Access each client on the server
                client.send(JSON.stringify(payLoad)); // Broadcast client status payLoad to each client
            });



        }
    })
});




