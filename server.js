const net = require('net');
const port = '43666';
const host = '0.0.0.0';
const fepHost = '10.154.0.12';
const fepPort = '43666';


const server = net.createServer();
const fepClient = new net.Socket();



server.listen(port, host, () => {
    console.log('Mastercard router server is running on port ' + port + '.');
});

//connect to fep
fepClient.connect(fepPort, fepHost, function() {
    console.log("Connected to patricia pay fep running on ip " + fepHost + " and port " +fepPort);

});
//catch errors connecting to fep
fepClient.on('error', function(ex) {

    console.log("error connecting to fep client: " +ex);
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
            //write data to unitybank postbridge

            sockets.forEach(function (sock) {

                sock.write(data);
            });
            console.log("Data forwarded to Unitybank PostBridge: " + data);



        });


        // Write the data back to all the connected, the client will receive it as data from the server
        // sockets.forEach(function(sock, index, array) {
        //
        //
        //     sock.write(sock.remoteAddress + ':' + sock.remotePort + " said " + data + '\n');
        // });
    });

    // Send a message to all clients
    function broadcast(message) {
        // sockets.forEach(function (sock) {
        //
        //     sock.write(message);
        // });

    }

    // Add a 'close' event handler to this instance of socket
    sock.on('close', function(data) {
        // fepClient.destroy();
        // console.log("Patricia Pay Fep connection closed");
        //



        let index = sockets.findIndex(function(o) {
            return o.remoteAddress === sock.remoteAddress && o.remotePort === sock.remotePort;
        })
        if (index !== -1) sockets.splice(index, 1);
        console.log('CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);
    });
});