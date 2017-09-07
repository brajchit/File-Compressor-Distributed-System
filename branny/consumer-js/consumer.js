#!/usr/bin/env node

var fs = require("fs");
var JSZip = require("jszip");
var amqp = require('amqplib/callback_api');
var streamToBuffer = require('stream-to-buffer')

amqp.connect('amqp://localhost', function(err, conn) {
  conn.createChannel(function(err, ch) {
    var q = 'rpc_queue';

    ch.assertQueue(q, { durable: false });
    ch.prefetch(1);
    console.log(' [x] Awaiting RPC requests');

    ch.consume(q, function reply(msg) {
      // console.log("comming",msg);

      console.log("Archivo procesando...");
      var typeFile = ''+msg.properties.type
      console.log("File: ", typeFile);

      var zip = new JSZip();
      zip.file(typeFile, msg.content);

      // zip
      // .generateNodeStream({type:'nodebuffer',streamFiles:true})
      // .pipe(fs.createWriteStream('out.zip'))
      // .on('finish', function () {
      //     // JSZip generates a readable stream with a "end" event,
      //     // but is piped here in a writable stream which emits a "finish" event.
      //     console.log("out.zip written.");
      // });

      var stream = zip.generateNodeStream({type:'nodebuffer', streamFiles:true})

      streamToBuffer(stream, function (err, buffer) {
        console.log("Archivo comprimido en el worker");

        ch.sendToQueue(msg.properties.replyTo,
          buffer, {
            correlationId: msg.properties.correlationId
          });

        ch.ack(msg);
      })

    });
  });
});
