var net = require("net");
const dotenv = require('dotenv');
var message = "";
var buffer = "";


dotenv.config();

process.on("uncaughtException", function(error) {
    console.error(error);
});

var localport = process.env.LOCAL_HOST;
var remotehost = process.env.REMOTE_HOST;
var remoteport = process.env.REMOTE_PORT;

var server = net.createServer(function (localsocket) {
    localsocket.setEncoding("ascii");
    var remotesocket = new net.Socket();

    remotesocket.connect(remoteport, remotehost);
    remotesocket.setEncoding("ascii");

    localsocket.on('connect', function (data) {

        console.log(">>> connection #%d from %s:%d",
            server.connections,
            localsocket.remoteAddress,
            localsocket.remotePort
        );
    });

    localsocket.on('data', function (data) {


        console.log("local server bytes in:"+data.length);
        receive(localsocket,data);


    });





    remotesocket.on('data', function(data) {


        let chunk = "";
        chunk += data;


        console.log("selected message to send to downstream: " +chunk.toString());



        console.log(`%s:%d - writing data to local `,
            localsocket.remoteAddress,
            localsocket.remotePort
        );



        var buffer = Buffer.from(chunk.toString(), "ascii");


//create a buffer with +2 bytes
        var consolidatedBuffer = Buffer.alloc(2 + buffer.length);

//write at the beginning of the buffer, the total size
        consolidatedBuffer.writeInt16BE(buffer.length, 0);

//Copy the message buffer to the consolidated buffer at position 2     (after the 4 bytes about the size)
        buffer.copy(consolidatedBuffer, 2);

//Send the consolidated buffer


        // var flushed =
             localsocket.write(consolidatedBuffer.toString(), function(err) {
            if (err)  console.log("  local not flushed; pausing remote" +consolidatedBuffer.toString());
            remotesocket.pause();
        });
        // if (!flushed) {
        //
        // }



    });

    localsocket.on('drain', function() {
        console.log("%s:%d - resuming remote",
            localsocket.remoteAddress,
            localsocket.remotePort
        );
        remotesocket.resume();
    });

    remotesocket.on('drain', function() {
        console.log("%s:%d - resuming local",
            localsocket.remoteAddress,
            localsocket.remotePort
        );
        localsocket.resume();
    });

    localsocket.on('close', function(had_error) {
        console.log("%s:%d - closing remote",
            localsocket.remoteAddress,
            localsocket.remotePort
        );
        remotesocket.end();
    });

    remotesocket.on('close', function(had_error) {
        console.log("%s:%d - closing local",
            localsocket.remoteAddress,
            localsocket.remotePort
        );
        localsocket.end();
    });

});



function receive(socket, data){
    //Create a chunk prop if it does not exist
    if(!socket.chunk){
        socket.chunck = {
            messageSize : 0,
            buffer: new Buffer(0),
            bufferStack: new Buffer(0)
        };
    }
    //store the incoming data
    socket.chunck.bufferStack = Buffer.concat([socket.chunck.bufferStack, data]);
    //this is to check if you have a second message incoming in the tail of the first
    var reCheck = false;
    do {
        reCheck = false;
        //if message size == 0 you got a new message so read the message size (first 4 bytes)
        if (socket.chunck.messageSize == 0 && socket.chunck.bufferStack.length >= 4) {
            socket.chunck.messageSize = socket.chunck.bufferStack.readInt32BE(0);
        }

        //After read the message size (!= 0) and the bufferstack is completed and/or the incoming data contains more data (the next message)
        if (socket.chunck.messageSize != 0 && socket.chunck.bufferStack.length >= socket.chunck.messageSize + 4) {
            var buffer = socket.chunck.bufferStack.slice(4, socket.chunck.messageSize + 4);
            socket.chunck.messageSize = 0;
            socket.chunck.bufferStack = socket.chunck.bufferStack.slice(buffer.length + 4);
            onMessage(socket, buffer);
            //if the stack contains more data after read the entire message, maybe you got a new message, so it will verify the next 4 bytes and so on...
            reCheck = socket.chunck.bufferStack.length > 0;
        }
    } while (reCheck);
}

function onMessage(socket, buffer){
    console.log("message received with data:"+buffer.toString());


    let chunk = "";
    chunk += buffer;

    console.log(`%s:%d - writing data to remote `,
        socket.remoteAddress,
        socket.remotePort
    );

    var flushed = remotesocket.write(chunk +"\n");
    if (!flushed) {
        console.log("  remote not flushed; pausing local");
        localsocket.pause();
    }


}



server.listen(localport);

console.log("redirecting connections from 127.0.0.1:%d to %s:%d", localport, remotehost, remoteport);