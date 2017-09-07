#!/usr/bin/env python
import pika
import uuid

class compressClient(object):

    def __init__(self):
        self.connection = pika.BlockingConnection(
            pika.ConnectionParameters(host='localhost'))

        self.channel = self.connection.channel()

        result = self.channel.queue_declare(exclusive=True)
        self.callback_queue = result.method.queue

        self.channel.basic_consume(self.on_response, no_ack=True,
                                   queue=self.callback_queue)

    def on_response(self, ch, method, props, body):
        if self.corr_id == props.correlation_id:
            self.response = body

    def call(self, filename):
        filePath = filename
        buffer = "Read buffer:\n"
        buffer += open(filePath, 'rU').read()
        self.binFile = buffer
        self.response = None
        self.type = filename
        self.corr_id = str(uuid.uuid4())
        self.channel.basic_publish(exchange='',
                                   routing_key='rpc_queue',
                                   properties=pika.BasicProperties(
                                       reply_to=self.callback_queue,
                                       correlation_id=self.corr_id,
                                       type=self.type,
                                   ),
                                   body=self.binFile)
        while self.response is None:
            self.connection.process_data_events()
        return self.response

compress_rpc = compressClient()

print(" [x] Comprimiendo video.mp4")
response = compress_rpc.call("video.mp4")
print(" [.] Archivo comprimido en compFiles/file.zip")
# filePath = "input.txt"

open("compFiles/file.zip", 'w').write(response)

# print(response)
