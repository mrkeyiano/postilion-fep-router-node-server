
// turn off limits by default (BE CAREFUL)
require('events').EventEmitter.prototype._maxListeners = 0;

const net = require('net');
const port = '43666';
const host = '0.0.0.0';
const fepHost = '10.154.0.12';
const fepPort = '43666';
var intervalConnect = false;
var timeout = 0;


const server = net.createServer();
const fepClient = new net.Socket();



server.listen(port, host, () => {
    console.log('Mastercard router server is running on port ' + port + '.');
});


//connect to fep
//connectFep();




let sockets = [];

server.on('connection', function(sock) {
    console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);


    sockets.push(sock);

    sock.on('data', function(data) {


        console.log(sock.remoteAddress + ':' +sock.remotePort+ ' says: ' + data);

        console.log("Forwarding data to Patricia Pay FEP server");

        broadcast(data);


       // sock.destroy();



        // Write the data back to all the connected, the client will receive it as data from the server
        // sockets.forEach(function(sock, index, array) {
        //
        //
        //     sock.write(sock.remoteAddress + ':' + sock.remotePort + " said " + data + '\n');
        // });
    });


    // Add a 'close' event handler to this instance of socket
    sock.on('close', function(data) {



        let index = sockets.findIndex(function(o) {
            return o.remoteAddress === sock.remoteAddress && o.remotePort === sock.remotePort;
        })
        if (index !== -1) sockets.splice(index, 1);
        console.log('CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);
    });
});


function connectFep() {


    //fepClient.removeAllListeners();
    //fepClient.end();

    fepClient.connect({
        port: fepPort,
        host: fepHost,
    })
}

function broadcast(data) {





        writeToFep(data, 0);





}





function writeToFep(data, timer) {
    let data_id = new Date().getTime();

    console.log("initiating connection to fep server");

    fepClient.connect(fepPort, fepHost, () => {

        fepClient.write(data);
        console.log(data_id +": data sent to fep server, waiting for response...");


    });


    fepClient.on('connect', function() {
        intervalConnect = false;
        // timeout = 0;
        console.log("Connected to patricia pay fep running on ip " + fepHost + " and port " +fepPort);

    });

    //catch errors connecting to fep
    fepClient.on('error', function(ex) {


        console.log("error connecting to fep client: " +ex);

        fepClient.destroy();


    });


    fepClient.on('close', function() {

        console.log("Patricia pay fep server connection closed");


    });

    fepClient.on('end', function() {

        console.log("Patricia pay fep server connection ended");


    });

    //wait for response and forward back to postbridge

    fepClient.on('data', function(data) {
        console.log("Patricia Pay FEP server response: " + data);
        console.log("Forwarding data to Unitybank PostBridge");
        //write data to unitybank postbridge

        sockets.forEach(function (sock) {

            sock.write(data);
            sock.destroy();
        });
        console.log("Data forwarded to Unitybank PostBridge: " + data);

        // if (data.toString().endsWith('exit')) {
        //     fepClient.destroy();
        //
        // }



    });




}





