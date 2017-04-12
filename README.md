# Ionic Chat Starter

A Chat Application built with Ionic 1 with a Node Backend Server (Server Code Included). 

## Features
1. Create Users
2. Create Rooms
3. Chat Room
4. Add Users to Rooms
5. View Users in Rooms
6. Offline Features

Simply run `npm install` in the server folder and `bower install` in the ionic-chat-app folder

In `server.js` change the connection string in `mongoose.connect` to that of your mongodb instance

Also in `www/app/chat/chat.services.js` change the connection string in `io.connect` to that of the server you are listening on

Enjoy
