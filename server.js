
// turn off limits by default (BE CAREFUL)
require('events').EventEmitter.prototype._maxListeners = 0;

const net = require('net');
const port = '43666';
const host = '0.0.0.0';
const fepHost = '10.154.0.12';
const fepPort = '43666';
var intervalConnect = false;
var timeout = 0;

var demo_data = "�0421F23E0495ABE081200000004204000022165321550400409731312000000000000000061510555673737716504008092304042000000C00000000C000000000653215506111111245321550400409731=23042210000032982606822110300022100000000000022HAGGAI  MFB  ATM  GARKI     ABUJA   LANG56600440210100003298260020073737706151055560000053215500000111111000000000000000000000000C00000000C0000000010002395301701551120151114C0020013646420144000000000100003298260PAT2src     PAT2snk     737377737377UBPGroup    301000032982602020061501252218Postilion:MetaData278211MediaTotals111212MediaBatchNr111217AdditionalEmvTags111214AdditionalInfo111211MediaTotals3116<MediaTotals><Totals><Amount>0</Amount><Currency>000</Currency><MediaClass>Cards</MediaClass></Totals></MediaTotals>212MediaBatchNr173736441217AdditionalEmvTags3500<AdditionalEmvTags><EmvTag><TagId>50</TagId><TagValue>4465626974204D617374657243617264</TagValue></EmvTag><EmvTag><TagId>81</TagId><TagValue>0000C350</TagValue></EmvTag><EmvTag><TagId>9F4C</TagId><TagValue>0000000000000000</TagValue></EmvTag><EmvTag><TagId>9F45</TagId><TagValue>0000</TagValue></EmvTag><EmvTag><TagId>5F36</TagId><TagValue>00</TagValue></EmvTag><EmvTag><TagId>5F34</TagId><TagValue>00</TagValue></EmvTag><EmvTag><TagId>9B</TagId><TagValue>6000</TagValue></EmvTag></AdditionalEmvTags>214AdditionalInfo3447<AdditionalInfo><Transaction><OpCode>AGABHAIA</OpCode><BufferB>08136900929</BufferB><BufferC>1774691015</BufferC><CfgExtendedTrxType>8505</CfgExtendedTrxType><CfgReceivingInstitutionIDCode>62805112345</CfgReceivingInstitutionIDCode></Transaction><Download><ATMConfigID>5006</ATMConfigID><AtmAppConfigID>5006</AtmAppConfigID><LoadsetGroup>FEP Wincor EMV</LoadsetGroup><DownloadApp>QT3_DOWNLOAD_WESTERNUNION</DownloadApp></Download></AdditionalInfo>07PAT2snk";


const server = net.createServer();
const fepClient = new net.Socket();



server.listen(port, host, () => {
    console.log('Mastercard router server is running on port ' + port + '.');
});

let sockets = [];

server.on('connection', function(sock) {
    console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);


    sockets.push(sock);
    sock.setEncoding("utf8");


    sock.on('data', function(data) {


        let data_id = "requestId_" + new Date().getTime();
        let received = "";
        received += data.toString();

        console.log("received data dump" +received);




        console.log(sock.remoteAddress + ':' +sock.remotePort+ ' says: ' + data);



        const messages = received.split("\n");
        if (messages.length > 1) {
            console.log(data_id +": initiating request to forward data from postbridge to fep server");

            for (let message of messages) {
                if (message !== "") {

                  //  if (received.toString().endsWith('07PAT2snk')) {



                        console.log(data_id +": initiating connection to fep server");
                        fepClient.connect({
                            port: fepPort,
                            host: fepHost,
                        });


                        fepClient.write(received.toString() +"\n");
                        console.log(data_id +": data sent to fep server, waiting for response.");



                  //  }
                    received = ""
                }
            }
        }




        fepClient.on('connect', function() {
            console.log(data_id +": connected to patricia pay fep running on ip " + fepHost + " and port " +fepPort);
        });

        //wait for response and forward back to postbridge

        fepClient.on('data', function(data) {
            console.log(data_id +": patricia pay fep server responded to request");
            console.log(data_id +": forwarding data to unitybank postbridge");
            //write data to unitybank postbridge

            if (data.toString().endsWith('07PAT2snk')) {
                sockets.forEach(function (sock) {

                    sock.write(data+ "\n");

                });
                console.log(data_id + " request forwarded to unitybank postbridge");

            }

            if (data.toString().endsWith('exit')) {
                fepClient.destroy();

            }

            fepClient.destroy();



        });

        //catch errors connecting to fep
        fepClient.on('error', function(ex) {


            console.log(data_id +": error connecting to fep client: " +ex);

            fepClient.destroy();


        });


        fepClient.on('close', function() {

            console.log(data_id +": fep server connection closed");



        });

        fepClient.on('end', function() {

            console.log(data_id +": fep server connection ended");


        });










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
        });
        if (index !== -1) sockets.splice(index, 1);
        console.log('CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);
    });






});










