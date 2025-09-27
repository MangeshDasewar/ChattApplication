require("dotenv").config()

const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const mysql = require("mysql2/promise")
const cors = require("cors")
const path = require("path")

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname)))

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "", 
  database: process.env.DB_NAME || "alignbox_chat",
}

let pool
async function initializeDatabase() {
  try {
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    })

    const connection = await pool.getConnection()
    console.log(" Database connected successfully")
    connection.release()
  } catch (error) {
    console.error(" Database connection failed:", error.message)
    console.log("Please check your database configuration in .env file")
    process.exit(1)
  }
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  socket.on("join-group", (groupId) => {
    socket.join(`group_${groupId}`)
    console.log(`User ${socket.id} joined group ${groupId}`)
  })

  socket.on("send-message", async (data) => {
    try {
      const { groupId, userId, content, isAnonymous } = data

      const [result] = await pool.execute(
        "INSERT INTO messages (group_id, user_id, content, is_anonymous) VALUES (?, ?, ?, ?)",
        [groupId, userId, content, isAnonymous],
      )

      const [userRows] = await pool.execute("SELECT username, avatar_url FROM users WHERE id = ?", [userId])

      const message = {
        id: result.insertId,
        content: content,
        user: userRows[0],
        is_anonymous: isAnonymous,
        created_at: new Date().toISOString(),
        is_sent: false,
      }

      socket.to(`group_${groupId}`).emit("new-message", message)
    } catch (error) {
      console.error("Error saving message:", error)
    }
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
  })
})

app.get("/api/messages/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params

    const [rows] = await pool.execute(
      `
            SELECT 
                m.id,
                m.content,
                m.is_anonymous,
                m.created_at,
                u.username,
                u.avatar_url
            FROM messages m
            JOIN users u ON m.user_id = u.id
            WHERE m.group_id = ?
            ORDER BY m.created_at ASC
        `,
      [groupId],
    )

    const messages = rows.map((row) => ({
      id: row.id,
      content: row.content,
      user: {
        username: row.username,
        avatar_url: row.avatar_url,
      },
      is_anonymous: row.is_anonymous,
      created_at: row.created_at,
      is_sent: false,
    }))

    res.json(messages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    res.status(500).json({ error: "Failed to fetch messages" })
  }
})

app.post("/api/messages", async (req, res) => {
  try {
    const { groupId, userId, content, isAnonymous } = req.body

    const [result] = await pool.execute(
      "INSERT INTO messages (group_id, user_id, content, is_anonymous) VALUES (?, ?, ?, ?)",
      [groupId, userId, content, isAnonymous],
    )

    res.json({
      success: true,
      messageId: result.insertId,
    })
  } catch (error) {
    console.error("Error sending message:", error)
    res.status(500).json({ error: "Failed to send message" })
  }
})

app.get("/api/groups/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params

    const [rows] = await pool.execute("SELECT * FROM groups WHERE id = ?", [groupId])

    if (rows.length === 0) {
      return res.status(404).json({ error: "Group not found" })
    }

    res.json(rows[0])
  } catch (error) {
    console.error("Error fetching group:", error)
    res.status(500).json({ error: "Failed to fetch group" })
  }
})

app.put("/api/groups/:groupId/members/:userId/anonymous", async (req, res) => {
  try {
    const { groupId, userId } = req.params
    const { isAnonymous } = req.body

    await pool.execute("UPDATE group_members SET is_anonymous = ? WHERE group_id = ? AND user_id = ?", [
      isAnonymous,
      groupId,
      userId,
    ])

    res.json({ success: true })
  } catch (error) {
    console.error("Error updating anonymous mode:", error)
    res.status(500).json({ error: "Failed to update anonymous mode" })
  }
})

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
})

initializeDatabase().then(() => {
  const PORT = process.env.PORT || 3000
  server.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`)
    console.log(` Open http://localhost:${PORT} to view the chat app`)
    console.log(" Make sure your MySQL database is running and configured")
  })
})
