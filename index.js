require('dotenv').config()
const path = require('path')
const http = require('http')
const express = require('express')
const { Server } = require('socket.io')
const TelegramBot = require('node-telegram-bot-api')

const app = express()
const server = http.createServer(app)
const io = new Server(server)

const users = {}
const token = process.env.TOKEN
const chatid = process.env.CHAT

const bot = new TelegramBot(token, {polling: true});

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'index.html'))
})

app.get('/about', async (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'about.html'))
})

app.get('/services', async (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'services.html'))
})

app.get('/contacts', async (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'contacts.html'))
})

io.on('connection', socket => {
    users[socket.id] = socket;

    socket.on('send-to-admin', (data) => {
        bot.sendMessage(chatid, `[${socket.id}]\n${data}`);
    })

    socket.on('disconnect', () => {
        console.log('A user has disconnected');
        for (const [chatId, userSocket] of Object.entries(users)) {
          if (userSocket === socket) {
            delete users[chatId];
            break;
          }
        }
    });

})

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    io.emit('receive-from-bot', msg.text);
});

bot.on('message', (msg) => {
    // const chatId = msg.chat.id;
    if(msg.reply_to_message) {
        const openBracketIndex = msg.reply_to_message.text.indexOf('[');
        const closeBracketIndex = msg.reply_to_message.text.indexOf(']');

        if (openBracketIndex !== -1 && closeBracketIndex !== -1) {
            const id = msg.reply_to_message.text.substring(openBracketIndex + 1, closeBracketIndex);
            users[id]?.emit('receive-from-bot', msg.text)
        }
    } else {
        io.emit('receive-from-bot', msg.text);
    }
});

server.listen(5000, () => {
    console.log('server start...');
})