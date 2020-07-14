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

                    console.log("selected message to send to upstream: " +data);

                    console.log(`%s:%d - writing data to remote `,
                        localsocket.remoteAddress,
                        localsocket.remotePort
                    );

                    var flushed = remotesocket.write(data.toString("ascii") +"\n");
                    if (!flushed) {
                        console.log("  remote not flushed; pausing local");
                        localsocket.pause();
                    }


    });

    remotesocket.on('data', function(data) {


        console.log("selected message to send to downstream: " +data.toString('ascii'));



        console.log(`%s:%d - writing data to local `,
            localsocket.remoteAddress,
            localsocket.remotePort
        );



        var buffer = Buffer.from(data.toString("ascii"), "ascii");


//create a buffer with +2 bytes
        var consolidatedBuffer = Buffer.alloc(2 + buffer.length);

//write at the beginning of the buffer, the total size
        consolidatedBuffer.writeInt16BE(buffer.length, 0);

//Copy the message buffer to the consolidated buffer at position 2     (after the 4 bytes about the size)
        buffer.copy(consolidatedBuffer, 2);

//Send the consolidated buffer


        // var flushed =
             localsocket.write(consolidatedBuffer, function(err) {
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

server.listen(localport);

console.log("redirecting connections from 127.0.0.1:%d to %s:%d", localport, remotehost, remoteport);