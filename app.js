
const mongo = require('mongodb').MongoClient,

    socket = require('socket.io'),
    path = require('path'),
    express = require('express'),
    connections = [],
    app = express();

// Load Html
app.use(express.static(path.join(__dirname)));

app.get('/',(req,res)=>{
    res.send('index.html')
})
// Socket set-up
server = app.listen(3000);
io = socket(server);

// Connect mongo
mongo.connect("mongodb+srv://charanpuli:Charan@1999@clusterpuli-xs9yc.mongodb.net/test?retryWrites=true&w=majority", { useNewUrlParser: true,useUnifiedTopology:true }, (err, client) => {
    if(err){
        console.log(err);
        
    }
    console.log('MongoDB connected');

    // Socket
    io.sockets.on('connection', (socket) => {
        const chat = client.db('mongochat');

        // Connection count
        connections.push(socket.id);
        console.log('Connected: %d sockets connected', connections.length);

        // Disconnect
        socket.on('disconnect', () => {
            connections.splice(connections.indexOf(socket), 1);
            console.log('Disconnected: %d sockets still connected', connections.length);
        });

        // Send status
        sendStatus = (status) => { socket.emit('status', status) };

        // Get chats from collection
        chat.collection('chats').find().limit(100).sort({ _id: 1 }).toArray((err, res) => {
            if (err) throw err;
            // Emit messages
            socket.emit('output', res);
        });

        // Input events
        socket.on('input', (data) => {
            let { name, message } = data;

            // Check for name and message
            if (name == '' || message == '') sendStatus('Please enter a name and message');

            // Insert message
            chat.collection('chats').insertOne({ name, message }, () => {
                socket.emit('output', [data])
                // Send status object
                sendStatus({ msg: 'Message sent', clear: true })
            });
        });

        // Broadcasting username
        socket.on('typing', (data) => {
            socket.broadcast.emit('typing', data.name);
        });

        // Handle clear button
        socket.on('clear', (data) => {
            // Remove all chat from collection
            chat.collection('chats').deleteMany({}, () => {
                // Emit cleared
                socket.emit('cleared');
            });
        });
    });
});


