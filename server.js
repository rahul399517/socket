//server.js

const express = require("express");
const app = express();
require("dotenv").config({ path: ".env" });

const PORT = process.env.NEXT_PUBLIC_SOCKET_PORT || 4000;
const HOST = process.env.NEXT_PUBLIC_SOCKET_HOST || "127.0.0.1";

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//New imports
const http = require("http").Server(app);
const cors = require("cors");

app.use(cors());

const socketIO = require("socket.io")(http, {
  cors: {
    origin: "*",
  },
});

//Add this before the app.get() block
let allUsers = [];
function leaveRoom(socketId, chatRoomUsers) {
  return chatRoomUsers.filter((user) => user.socketId != socketId);
}

socketIO.on("connection", (socket) => {
  console.log(`: ${socket.id} user just connected!`);

  socket.on("disconnect", () => {
    allUsers = leaveRoom(socket.id, allUsers);
    const allRooms = Object.keys(socket.adapter.rooms);
    socket.to(allRooms).emit("roomUsers", allUsers);
    console.log(": A user disconnected");
  });

  socket.on("joinRoom", (room, sessionUser) => {
    socket.join(room);

    const userExists = allUsers.some(
      (user) => user.id === sessionUser.id && user.room === room
    );
    if (!userExists) {
      allUsers.push({
        id: sessionUser.id,
        socketId: socket.id,
        name: sessionUser.name,
        room,
      });
    }
    chatRoomUsers = allUsers.filter((user) => user.room === room);
    socket.to(room).emit("roomUsers", chatRoomUsers);
    socket.emit("roomUsers", chatRoomUsers);
  });

  socket.on("idea", (data) => {
    socket.broadcast.to(data.roomId).emit("receive-idea", data);
  });
  socket.on("delete-idea", (id, room) => {
    socket.broadcast.to(room).emit("receive-delete-idea", id);
  });
  socket.on("idea-update", (data) => {
    socket.broadcast.to(data.roomId).emit("receive-idea-update", data);
  });

  socket.on("add-thought", (data) => {
    socket.broadcast.to(data.roomId).emit("receive-thought", data);
  });
  socket.on("delete-thought", (id, room) => {
    socket.broadcast.to(room).emit("receive-delete-thought", id);
  });
  socket.on("update-thought", (data) => {
    socket.broadcast.to(data.roomId).emit("receive-update-thought", data);
  });

  socket.on("add-solution", (data) => {
    socket.broadcast.to(data.roomId).emit("receive-solution", data);
  });
  socket.on("delete-solution", (id, room) => {
    socket.broadcast.to(room).emit("receive-delete-solution", id);
  });
  socket.on("update-solution", (data) => {
    socket.broadcast.to(data.roomId).emit("receive-update-solution", data);
  });

  socket.on("freeze-room", (roomId) => {
    socket.broadcast.to(roomId).emit("receive-freeeze-room");
  });

  socket.on("un-freeze-room", (roomId) => {
    socket.broadcast.to(roomId).emit("receive-un-freeeze-room");
  });
  socket.on("room-session-end", (roomId) => {
    socket.broadcast.to(roomId).emit("receive-session-end");
  });
});

http.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST} ${PORT}`);
});
