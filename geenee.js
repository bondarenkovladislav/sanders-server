const app = require('express')()
const cors = require('cors')
app.use(cors())
const http = require('http').Server(app)
const PORT = process.env.PORT || 2002
const server = app.listen(PORT, () => {
    console.log("Server is running");
});

const io = require('socket.io').listen(server)

let markerPos

app.get('/test', (req, res) => {
    res.json({work: true})
})

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    // Add this
    if (req.method === 'OPTIONS') {

        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, OPTIONS');
        res.header('Access-Control-Max-Age', 120);
        return res.status(200).json({});
    }

    next();

});

io.on('connection', (socket) => {
    socket.userData = {x: 0, y:0, z:0, heading: 0}

    console.log(`${socket.id} connected`)
    socket.emit('setId', { id: socket.id })

    markerPos = [Math.random() * 5000, 100, Math.floor(Math.random() * 5000)]
    socket.broadcast.emit('markerpos', {markerPos})
    socket.emit('markerpos', {markerPos})

    socket.on('disconnect', () => {
        console.log(`Player ${socket.id} disconnected`)
        socket.broadcast.emit('deletePlayer', {id: socket.id})
    })

    socket.on('init', data => {
        console.log(`socket init ${data.model}`)
        socket.userData.model = data.model
        socket.userData.colour = data.colour
        socket.userData.x = data.x
        socket.userData.y = data.y
        socket.userData.z = data.z
        socket.userData.heading = data.h
        socket.userData.pb = data.pb
        socket.userData.rz = data.rz
        socket.userData.rx = data.rx
        socket.userData.action = "Idle"
    })

    socket.on('update', data => {
        socket.userData.x = data.x
        socket.userData.y = data.y
        socket.userData.z = data.z
        socket.userData.heading = data.h
        socket.userData.pb = data.pb
        socket.userData.action = data.action
        socket.userData.rz = data.rz
        socket.userData.rx = data.rx
    })

    socket.on('winner', () => {
        markerPos = [Math.random() * 5000, 100, Math.floor(Math.random() * 5000)]
        socket.broadcast.emit('winner', {id: socket.id, markerPos})
        socket.emit('markerpos', {markerPos})
    })
})

setInterval( () => {
    const namespace = io.of('/')
    let pack = []

    for(let id in io.sockets.sockets) {
        const socket = namespace.connected[id]
        pack.push({
            id: socket.id,
            model: socket.userData.model,
            colour: socket.userData.colour,
            x: socket.userData.x,
            y: socket.userData.y,
            z: socket.userData.z,
            heading: socket.userData.heading,
            pb: socket.userData.pb,
            action: socket.userData.action,
            rz: socket.userData.rz,
            rx: socket.userData.rx,
        })
    }
    if(pack.length > 0) {
        io.emit('remoteData', pack)
    }
}, 40)
