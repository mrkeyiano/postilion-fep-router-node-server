var net = require("net");
const dotenv = require('dotenv');


dotenv.config();

process.on("uncaughtException", function(error) {
    console.error(error);
});
//
// if (process.argv.length != 5) {
//     console.log("usage: %s <localport> <remotehost> <remoteport>", process.argv[1]);
//     process.exit();
// }

var localport = process.env.LOCAL_HOST;
var remotehost = process.env.REMOTE_HOST;
var remoteport = process.env.REMOTE_PORT;

var server = net.createServer(function (localsocket) {
    localsocket.setEncoding("utf8");
    var remotesocket = new net.Socket();

    remotesocket.connect(remoteport, remotehost);
    remotesocket.setEncoding("utf8");

    localsocket.on('connect', function (data) {

        console.log(">>> connection #%d from %s:%d",
            server.connections,
            localsocket.remoteAddress,
            localsocket.remotePort
        );
    });

    localsocket.on('data', function (data) {
        let received = "";
        received += data.toString();
        const messages = received.split("\r\n");

        console.log("MAUREEN SAYS: ");
        console.log(messages);



        if (messages.length > 0) {

            for (let message of messages) {
                if (message !== "") {
                    console.log("selected message to send to upstream: " +message);

                    console.log(`%s:%d - writing data to remote `,
                        localsocket.remoteAddress,
                        localsocket.remotePort
                    );

                    var flushed = remotesocket.write(message +"\n");
                    if (!flushed) {
                        console.log("  remote not flushed; pausing local");
                        localsocket.pause();
                    }
                    received = ""
                }
            }
        }


    });

    remotesocket.on('data', function(data) {


        let received = "";
        received += data.toString();

        const messages = received.split("\r\n");


        console.log("OLALEKAN SAYS: ");
        console.log(messages);


        if (messages.length > 0) {

            for (let message of messages) {
                if (message !== "") {
                    console.log("selected message to send to downstream: " +message);



                    console.log(`%s:%d - writing data to local `,
                        localsocket.remoteAddress,
                        localsocket.remotePort
                    );

                    var flushed = localsocket.write(message + "\n");
                    if (!flushed) {
                        console.log("  local not flushed; pausing remote");
                        remotesocket.pause();
                    }

                    received = ""
                }
            }
        }


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