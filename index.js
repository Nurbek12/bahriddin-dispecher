require('dotenv').config()
const path = require('path')
const http = require('http')
const express = require('express')
const { Server } = require('socket.io')
const TelegramBot = require('node-telegram-bot-api')

const app = express()
const server = http.createServer(app)
const io = new Server(server)

const teachers = [
    { id: "1", name: "Sayfiddinova A.", experience: "5", price: "600", subject: "math" },
    { id: "2", name: "Saidova O.", experience: "4", price: "600", subject: "math" },
    { id: "3", name: "Nasriddinov B.", experience: "8", price: "600", subject: "physic" },
    { id: "4", name: "Baxshullayev T.", experience: "7", price: "600", subject: "physic" },
    { id: "5", name: "Muhammedova D.", experience: "8", price: "700", subject: "lyterature" },
    { id: "6", name: "Qanoatov N.", experience: "5", price: "600", subject: "history" },
    { id: "7", name: "Tillayeva J.", experience: "5", price: "700", subject: "english" },
    { id: "8", name: "Qosimova N.", experience: "6", price: "700", subject: "english" },
    { id: "9", name: "Rashidov Q.", experience: "10", price: "600", subject: "russian" },
    { id: "10", name: "Rajabov F.", experience: "6", price: "600", subject: "chemistry" },
    { id: "11", name: "Nurova F.", experience: "4", price: "600", subject: "biology" },
    { id: "12", name: "Sayfiddinova A.", experience: "5", price: "400", subject: "common" },
    { id: "13", name: "Muhammedova D.", experience: "8", price: "400", subject: "common" },
    { id: "14", name: "Qanoatov N.", experience: "5", price: "400", subject: "common" },
]

const users = {}
const token = process.env.TOKEN
const chatid = process.env.CHAT

const bot = new TelegramBot(token, {polling: true});

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', async (req, res) => {
    res.render('index')
})

app.get('/about', async (req, res) => {
    res.render('about')
})

app.get('/services', async (req, res) => {
    res.render('services')
})

app.get('/contacts', async (req, res) => {
    res.render('contacts')
})

app.get('/subjects', async (req, res) => {
    res.render('subjects')
})

app.get('/teachers/:subject', async (req, res) => {
    res.render('teachers', { subject: req.params.subject, teachers: teachers.filter(t => t.subject === req.params.subject) })
})

app.get('/teacher/:id', async (req, res) => {
    const teacher = teachers.find(t => t.id == req.params.id)
    if(!teacher) res.redirect('/subjects')
    res.render('teacher', { teacher })
})

app.post('/send', async (req, res) => {
    const { name, phone, type, teacherId } = req.body;
    const teacher = teachers.find(t => t.id == teacherId)

    const message = `
📩 *Qabulga yozilish uchun yangi so'rov*
👤 Ism: *${name}*
📞 Telefon raqam: *${phone}*
🗓 Haftaning: *${type === 'even' ? 'juft' : 'toq'} kunlari uchun*
🧑‍🏫 O'qituvchi: *${teacher.name}*
📚 Fan: *${{
    'math': 'Matematika', 'physic': 'Fizika', 'lyterature': 'Ona tili va Adabiyot',
    'history': 'Tarix', 'english': 'Ingliz tili', 'russian': 'Rus tili',
    'chemistry': 'Kimyo', 'biology': 'Biologiya', 'common': "Umumiy (Matematika, Ona tili, O'zb tarixi)",
  }[teacher.subject]}*`;
    bot.sendMessage(chatid, message, { parse_mode: "Markdown" })
    res.json(true)
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

server.listen(process.env.PORT, () => {
    console.log('server start...');
})

module.exports = app;