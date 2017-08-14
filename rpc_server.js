#!/usr/bin/env node

var lzjs = require('lzjs');

var amqp = require('amqplib/callback_api');

amqp.connect('amqp://localhost', function(err, conn) {
  conn.createChannel(function(err, ch) {
    var q = 'rpc_queue';

    ch.assertQueue(q, {durable: false});
    ch.prefetch(1);
    console.log(' [x] Awaiting RPC requests');
    ch.consume(q, function reply(msg) {
      var texto = msg.content.toString();
      console.log(texto);
      var compressed = lzjs.compress(texto);
      console.log("Mensaje comprimido:");
      console.log(compressed);
      //var r = fibonacci(n);

      ch.sendToQueue(msg.properties.replyTo,
        new Buffer(compressed.toString()),
        {correlationId: msg.properties.correlationId});

      ch.ack(msg);
    });
  });
});

function fibonacci(n) {
  if (n === 0 || n === 1)
    return n;
  else
    return fibonacci(n - 1) + fibonacci(n - 2);
}