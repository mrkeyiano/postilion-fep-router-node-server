const net = require('net');
const port = '43666';
const host = '0.0.0.0';
const fepHost = '10.154.0.12';
const fepPort = '43666';
const pbHost = '192.168.246.16';
const pbPort = '43666';

const server = net.createServer();
const fepClient = new net.Socket();
const postbridge = new net.Socket();


server.listen(port, host, () => {
    console.log('Mastercard router server is running on port ' + port + '.');
});

//connect to fep
fepClient.connect(fepPort, fepHost, function() {
    console.log("Connected to patricia pay fep running on ip" + fepHost + " and port " +fepPort);

});

//connect to unitybank postbridge
postbridge.connect(pbPort, pbHost, function() {
    console.log("Connected to Unitybank postbridge running on ip" + pbHost + " and port " +pbPort);

});

let sockets = [];

server.on('connection', function(sock) {
    console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);


    sockets.push(sock);

    sock.on('data', function(data) {


        console.log(sock.remoteAddress + ':' +sock.remotePort+ ' says: ' + data);

        console.log("Forwarding data to Patricia Pay FEP server");

        fepClient.write(data);

        console.log("Data forwarded to Patricia Pay FEP server: " + data);

        //wait for response and forward back to postbridge

        fepClient.on('data', function(data) {
            console.log("Patricia Pay FEP server response: " + data);
            console.log("Forwarding data to Unitybank PostBridge");
            //write data to unitbank postbridge
            postbridge.write(data);
            console.log("Data forwarded to Unitybank PostBridge: " + data);
            postbridge.on('data', function(data) {
                console.log("Unitybank Postbridge response: " + data);


            });



        });


        // Write the data back to all the connected, the client will receive it as data from the server
        sockets.forEach(function(sock, index, array) {


            sock.write(sock.remoteAddress + ':' + sock.remotePort + " said " + data + '\n');
        });
    });

    // Add a 'close' event handler to this instance of socket
    sock.on('close', function(data) {
        fepClient.destroy();
        console.log("Patricia Pay Fep connection closed");
        postbridge.destroy();
        console.log("Unitybank Postbridge connection closed");




        let index = sockets.findIndex(function(o) {
            return o.remoteAddress === sock.remoteAddress && o.remotePort === sock.remotePort;
        })
        if (index !== -1) sockets.splice(index, 1);
        console.log('CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);
    });
});