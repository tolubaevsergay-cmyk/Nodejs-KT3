const express = require('express')
const app = express()
const http = require('http')
const { Server } = require('socket.io')

const server = http.createServer(app)
const io = new Server(server)

app.use(express.static(__dirname))

const names = new Map()

io.on('connection', client=>{
    client.on('nameMes', data=>{
        client.data.name = data.name
        client.data.color = data.color
        names.set(client.id, { id: client.id, name: data.name })
        io.emit('users', [...names.values()])
        const others = [...names.values()]
        .filter(u => u.id !== client.id)
        .map(u => u.name)

        if (others.length > 0) {
            client.emit('start', `Добро пожаловать. В чате уже присутствуют: ${others.join(', ')}`)
            client.broadcast.emit('start', `К нам подключился ${client.data.name}`)
    } else {
        client.emit('start', 'Добро пожаловать. Вы первый в чате.')
    }
    })
    client.on('message', data=>{
        const name = client.data.name
        const text = data.text
        const color = client.data.color
        const id = client.id
        if(!data.to){
        io.emit('text', {name, text, color, id})
        }
        else if(data.to !== client.id){
            io.to(data.to).emit('text', {name, text, color, id})
            client.emit('text', {name, text, color, id})
        }
        else{
            client.emit('text', {name, text, color, id})
        }
    })
    client.on('disconnect', () => {
        names.delete(client.id)
        client.broadcast.emit('start', `${client.data.name} нас покинул`)
        io.emit('users', [...names.values()])
    })
})

server.listen(3000, () => console.log('http://localhost:3000'))
