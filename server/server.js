import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
const PORT = process.env.PORT || 5000;
import { Server } from "socket.io";

//creating express app and http server
const app = express();
const server = http.createServer(app);

//initialising socket.io server
export const io = new Server(server, {
  cors: { origin: "*" },
});

//storeing online users
export const userSocketMap = {}; //{uerId : socketId}

//socket.io connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("user connected :", userId);
  if (userId) userSocketMap[userId] = socket.id;

  //Emit online users to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("user disconnected :", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

//Middleware setup
app.use(express.json({ limit: "4mb" }));
app.use(cors());

//mounting routes
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

//connect to mongobd
await connectDB();

app.get("/api/status", (req, res) => {
  res.send("Server is running");
});

if (process.env.NODE_ENV !== "production") {
  server.listen(PORT, () => {
    console.log(`app is running on PORT http://localhost:${5000}`);
  });
}
//export server for vercel
export default server;
