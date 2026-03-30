const express = require("express");
const http = require("http")
const cors = require("cors");
const { Server } = require("socket.io");
const { Kafka } = require("kafkajs");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

const userSockets = new Map();

io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("register", (userId) => {
        userSockets.set(userId, socket.id);
        console.log(`User ${userId} registered on socket ${socket.id}`);
    });

    socket.on("disconnect", () => {
        for (const [userId, socketId] of userSockets.entries()) {
            if (socketId === socket.id) {
                userSockets.delete(userId);
                break;
            }
        }
        console.log("Socket disconnected:", socket.id);
    });
});

// REST API: get notification for a user
app.get("/notifications/:userId", (req, res) => {
    const { userId } = req.params;

    db.all(
        `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
        [userId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message});
            res.json(rows);
        }
    );
});

// REST API: unread count
app.get("/notifications/:userId/unread-count", (req, res) => {
    const { userId } = req.params;

    db.get(
        `SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0`,
        [userId],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ unreadCount: row.count });
        }
    );
});

// REST API: mark one notification as read

app.post("/notifications/:id/read", (req, res) => {
    const { id  } = req.params;

    db.run(
        `UPDATE notifications SET is_read = 1 WHERE id = ?`,
        [id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, updated: this.changes });
        }
    );
});

// Kakfa setup

const kafka = new Kafka({
    clientId: "notification-backend",
    brokers: ["localhost:9092"]
});

const consumer = kafka.consumer({ groupId: "notification-backend"});

async function runConsumer() {
    await consumer.connect();
    await consumer.subscribe({
        topic: "notifications",
        fromBeginning: true
    });

    await consumer.run({
        eachMessage: async ({ message }) => {
            try {
                const payload = JSON.parse(message.value.toString());

                const eventId = payload.eventId;
                const userId = payload.userId;
                const type = payload.type;
                const title = payload.title;
                const text = payload.message;

                const sql = `
                    INSERT INTO notifications (event_id, user_id, type, title, message)
                    VALUES (?, ?, ?, ?, ?)
                `;

                db.run(sql, [eventId, userId, type, title, text],
                    function(err) {
                        if (err) {
                            if (err.message && err.message.includes("UNIQUE")) {
                                console.log("Duplicate notification skipped:", eventId, userId);
                                return;
                            }
                            console.error("DB insert error", err.message);
                            return;
                        }
                        const insertedNotification = {
                            id: this.lastID,
                            event_id: eventId,
                            user_id: userId,
                            type,
                            title,
                            message: text,
                            is_read: 0
                        };

                        const socketId = userSockets.get(userId);
                        if (socketId) {
                            io.to(socketId).emit("new_notification", insertedNotification);
                            console.log(`Live notification sent to ${userId}`);
                        } else {
                            console.log(`User ${userId} offline, saved in DB`);
                        }
                    }
                ); 
            } catch (error) {
                console.error("Kafka processing error:", error.message);
            }
        }
    });
}

runConsumer().catch(console.error);

const PORT = 4000;
server.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
})