
const io =
  window.io ||
  (() => {
    throw new Error("Socket.IO not loaded. Make sure the CDN script is included in index.html")
  })

class ChatApp {
  constructor() {
    this.socket = null
    this.currentUser = { id: 1, username: "john_doe", isAnonymous: false }
    this.groupId = 1
    this.messages = []

    this.initializeElements()
    this.initializeSocket()
    this.bindEvents()
    this.loadMessages()
  }

  initializeElements() {
    this.messagesContainer = document.getElementById("messagesContainer")
    this.messageInput = document.getElementById("messageInput")
    this.sendBtn = document.getElementById("sendBtn")
    this.anonymousToggle = document.getElementById("anonymousToggle")
    this.anonymousMode = document.getElementById("anonymousMode")
    this.anonymousNotification = document.getElementById("anonymousNotification")
  }

  initializeSocket() {
    const socketHost = window.location.origin
    this.socket = io(socketHost)

    this.socket.on("connect", () => {
      console.log("Connected to server")
      this.socket.emit("join-group", this.groupId)
    })

    this.socket.on("new-message", (message) => {
      this.addMessage(message)
      this.scrollToBottom()
    })

    this.socket.on("disconnect", () => {
      console.log("Disconnected from server")
    })
  }

  bindEvents() {
   
    this.sendBtn.addEventListener("click", () => this.sendMessage())

    this.messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.sendMessage()
      }
    })
    let longPressTimer
    this.messageInput.addEventListener("mousedown", () => {
      longPressTimer = setTimeout(() => {
        this.showAnonymousToggle()
      }, 1000)
    })

    this.messageInput.addEventListener("mouseup", () => {
      clearTimeout(longPressTimer)
    })

    this.messageInput.addEventListener("mouseleave", () => {
      clearTimeout(longPressTimer)
    })

    this.messageInput.addEventListener("touchstart", () => {
      longPressTimer = setTimeout(() => {
        this.showAnonymousToggle()
      }, 1000)
    })

    this.messageInput.addEventListener("touchend", () => {
      clearTimeout(longPressTimer)
    })

   
    this.anonymousMode.addEventListener("change", (e) => {
      this.currentUser.isAnonymous = e.target.checked
      this.showAnonymousNotification()
      setTimeout(() => this.hideAnonymousToggle(), 1000)
    })

    document.addEventListener("click", (e) => {
      if (!this.anonymousToggle.contains(e.target) && e.target !== this.messageInput) {
        this.hideAnonymousToggle()
      }
    })
  }

  async loadMessages() {
    try {
      const response = await fetch(`/api/messages/${this.groupId}`)
      const messages = await response.json()

      this.messages = messages
      this.renderMessages()
      this.scrollToBottom()
    } catch (error) {
      console.error("Error loading messages:", error)
    
      this.loadSampleMessages()
    }
  }

  loadSampleMessages() {
    const sampleMessages = [
      {
        id: 1,
        content: "Someone order Bornvita!!",
        user: { username: "Anonymous", avatar_url: "/diverse-user-avatars.png" },
        is_anonymous: true,
        created_at: "2020-08-20T11:35:00Z",
        is_sent: false,
      },
      {
        id: 2,
        content: "hahahahah!!",
        user: { username: "Anonymous", avatar_url: "/diverse-user-avatars.png" },
        is_anonymous: true,
        created_at: "2020-08-20T11:38:00Z",
        is_sent: false,
      },
      {
        id: 3,
        content: "I'm Excited For this Event! Ho-Ho",
        user: { username: "Anonymous", avatar_url: "/diverse-user-avatars.png" },
        is_anonymous: true,
        created_at: "2020-08-20T11:56:00Z",
        is_sent: false,
      },
      {
        id: 4,
        content: "Hi Guysss 👋",
        user: { username: "You", avatar_url: "/diverse-user-avatars.png" },
        is_anonymous: false,
        created_at: "2020-08-20T12:31:00Z",
        is_sent: true,
      },
      {
        id: 5,
        content: "Hello!",
        user: { username: "Anonymous", avatar_url: "/diverse-user-avatars.png" },
        is_anonymous: true,
        created_at: "2020-08-20T12:35:00Z",
        is_sent: false,
      },
      {
        id: 6,
        content: "Yessss!!!!!!!",
        user: { username: "Anonymous", avatar_url: "/diverse-user-avatars.png" },
        is_anonymous: true,
        created_at: "2020-08-20T12:42:00Z",
        is_sent: false,
      },
      {
        id: 7,
        content: "Maybe I am not attending this event!",
        user: { username: "You", avatar_url: "/diverse-user-avatars.png" },
        is_anonymous: false,
        created_at: "2020-08-20T13:36:00Z",
        is_sent: true,
      },
      {
        id: 8,
        content: "We have Surprise For you!!",
        user: { username: "Kirtidan Gadhvi", avatar_url: "/diverse-user-avatar-set-2.png" },
        is_anonymous: false,
        created_at: "2020-08-20T11:35:00Z",
        is_sent: false,
      },
    ]

    this.messages = sampleMessages
    this.renderMessages()
    this.scrollToBottom()
  }

  renderMessages() {
    this.messagesContainer.innerHTML = ""

    this.messages.forEach((message) => {
      this.addMessage(message, false)
    })
  }

  addMessage(message, animate = true) {
    const messageElement = document.createElement("div")
    messageElement.className = `message ${message.is_sent ? "sent" : "received"}`

    const time = this.formatTime(message.created_at)
    const displayName = message.is_anonymous ? "Anonymous" : message.user.username

    messageElement.innerHTML = `
            ${!message.is_sent ? `<img src="${message.user.avatar_url}" alt="Avatar" class="message-avatar">` : ""}
            <div class="message-content">
                ${!message.is_sent ? `<div class="message-sender">${displayName}</div>` : ""}
                <div class="message-bubble">
                    <div class="message-text">${message.content}</div>
                    <div class="message-time">${time}</div>
                </div>
            </div>
        `

    if (animate) {
      messageElement.style.opacity = "0"
      messageElement.style.transform = "translateY(20px)"
    }

    this.messagesContainer.appendChild(messageElement)

    if (animate) {
      setTimeout(() => {
        messageElement.style.transition = "all 0.3s ease-out"
        messageElement.style.opacity = "1"
        messageElement.style.transform = "translateY(0)"
      }, 10)
    }
  }

  async sendMessage() {
    const content = this.messageInput.value.trim()
    if (!content) return

    const message = {
      id: Date.now(),
      content: content,
      user: {
        username: this.currentUser.isAnonymous ? "Anonymous" : "You",
        avatar_url: "/diverse-user-avatars.png",
      },
      is_anonymous: this.currentUser.isAnonymous,
      created_at: new Date().toISOString(),
      is_sent: true,
    }

    this.addMessage(message)
    this.scrollToBottom()

    this.messageInput.value = ""

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupId: this.groupId,
          userId: this.currentUser.id,
          content: content,
          isAnonymous: this.currentUser.isAnonymous,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }
      this.socket.emit("send-message", {
        groupId: this.groupId,
        userId: this.currentUser.id,
        content: content,
        isAnonymous: this.currentUser.isAnonymous,
      })
    } catch (error) {
      console.error("Error sending message:", error)
      this.showErrorMessage("Failed to send message. Please try again.")
    }
  }

  showErrorMessage(message) {
    const errorDiv = document.createElement("div")
    errorDiv.className = "error-message"
    errorDiv.textContent = message
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #ff4444;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 1000;
    `

    document.body.appendChild(errorDiv)

    setTimeout(() => {
      document.body.removeChild(errorDiv)
    }, 3000)
  }

  showAnonymousToggle() {
    this.anonymousToggle.style.display = "flex"
    this.anonymousMode.checked = this.currentUser.isAnonymous
  }

  hideAnonymousToggle() {
    this.anonymousToggle.style.display = "none"
  }

  showAnonymousNotification() {
    if (this.currentUser.isAnonymous) {
      this.anonymousNotification.style.display = "flex"
      setTimeout(() => {
        this.anonymousNotification.style.display = "none"
      }, 3000)
    }
  }

  formatTime(timestamp) {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  scrollToBottom() {
    setTimeout(() => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight
    }, 100)
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ChatApp()
})
