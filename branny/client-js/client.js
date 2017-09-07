#!/usr/bin/env node

var fs = require('fs');
var amqp = require('amqplib/callback_api');
const uuidv4 = require('uuid/v4');

var args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Usage: js-client filename");
  process.exit(1);
}
var host = 'localhost'
// var host = '198.168.10.102'
amqp.connect('amqp://'+host, function(err, conn) {
  if(err){
	console.log("conn: ", err)
  }
  conn.createChannel(function(err, ch) {
    if(err){
	console.log("ch error: ", err)
    }
    ch.assertQueue('', { exclusive: true }, function(err, q) {
      var corrId = uuidv4();

      var fileArg = args[0]
      var filebuff = fs.readFileSync(fileArg)

      console.log(' [x] Comprimiendo archivo [%s]...', fileArg);

      ch.sendToQueue('rpc_queue',
        filebuff,{
          correlationId: corrId,
          replyTo: q.queue,
          type: fileArg
        });

      ch.consume(q.queue, function(msg) {
        if (msg.properties.correlationId === corrId) {
          var zipName = fileArg.split('.')[0] + '.zip'
          fs.writeFile('compFiles/'+zipName , msg.content, "binary" ,function(err) {
              if(err) {
                  console.log(err);
              } else {
                  console.log("Archivo comprimido fue guardado!");
              }
          });

          console.log(' [.] Archivo comprimido compFiles/%s', zipName);
          setTimeout(function() {
            conn.close();
            process.exit(0)
          }, 500);
        }
      }, { noAck: true });

    });
  });
});


var writeFile = function (path, buffer, permission) {
    permission = permission || 438; // 0666
    var fileDescriptor;

    try {
        fileDescriptor = fs.openSync(path, 'w', permission);
    } catch (e) {
        fs.chmodSync(path, permission);
        fileDescriptor = fs.openSync(path, 'w', permission);
    }

    if (fileDescriptor) {
        fs.writeSync(fileDescriptor, buffer, 0, buffer.length, 0);
        fs.closeSync(fileDescriptor);
    }
}
