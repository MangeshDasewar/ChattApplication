const mysql = require("mysql2/promise")
require("dotenv").config()

async function setupDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
  })

  try {
    
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || "alignbox_chat"}`)
    console.log("Database created successfully")

    
    await connection.execute(`USE ${process.env.DB_NAME || "alignbox_chat"}`)

 
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL,
        avatar_url VARCHAR(255) DEFAULT '/diverse-user-avatars.png',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS groups (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        avatar_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT PRIMARY KEY AUTO_INCREMENT,
        group_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        is_anonymous BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `)

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS group_members (
        id INT PRIMARY KEY AUTO_INCREMENT,
        group_id INT NOT NULL,
        user_id INT NOT NULL,
        is_anonymous BOOLEAN DEFAULT FALSE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `)


   await connection.execute(`
  INSERT IGNORE INTO users (id, username, avatar_url) VALUES 
  (1, 'yash_sharma', '/diverse-user-avatars.png'),
  (2, 'kirtidan_gadhvi', '/diverse-user-avatar-set-2.png'),
  (3, 'abhay_shukla', '/diverse-user-avatar-set-2.png')
`)

    await connection.execute(`
      INSERT IGNORE INTO groups (id, name, avatar_url) VALUES 
      (1, 'Fun Friday Group', '/placeholder.svg?height=40&width=40')
    `)

    await connection.execute(`
      INSERT IGNORE INTO group_members (group_id, user_id) VALUES 
      (1, 1), (1, 2), (1, 3)
    `)

    console.log(" Database setup completed successfully")
    console.log(" You can now run: npm start")
  } catch (error) {
    console.error(" Database setup failed:", error.message)
  } finally {
    await connection.end()
  }
}

setupDatabase()
