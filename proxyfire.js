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
        console.log("message received with data:"+data.toString());


        let chunk = "";
        chunk += data;

        console.log(`%s:%d - writing data to remote `,
            localsocket.remoteAddress,
            localsocket.remotePort
        );

        var flushed = remotesocket.write(chunk +"\n");
        if (!flushed) {
            console.log("  remote not flushed; pausing local");
            localsocket.pause();
        }


    });





    remotesocket.on('data', function(data) {


        let chunk = "";
        chunk += data;


        console.log("selected message to send to downstream: " +chunk.toString());



        console.log(`%s:%d - writing data to local `,
            localsocket.remoteAddress,
            localsocket.remotePort
        );


         var flushed = localsocket.write(data);

         if(!flushed) {
             console.log("  local not flushed; pausing remote" + data.toString());
             remotesocket.pause();
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



function receive(socket, data){
     onMessage(socket, data);

}

function onMessage(socket, buffer){


}



server.listen(localport);

console.log("redirecting connections from 127.0.0.1:%d to %s:%d", localport, remotehost, remoteport);