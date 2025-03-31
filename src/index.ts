// worker.js
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import appConfig from "./lib/queue";
import { handleBulkOrderForApi } from "./actions/orders";


const sqsClient = new SQSClient({
    region: appConfig.awsConfig.region,
    credentials: {
      accessKeyId: appConfig.awsConfig.accessKeyId,
      secretAccessKey: appConfig.awsConfig.secretAccessKey,
    },
  });

async function receiveMessages() {
  const params = {
    QueueUrl: appConfig.primaryQueueUrl, // Use the primary queue URL
    MaxNumberOfMessages: 10, // Maximum number of messages to retrieve in one call
    WaitTimeSeconds: 20, // Long polling - wait up to 20 seconds for messages to arrive
  };

  try {
    // Receive messages from the SQS queue
    const data = await sqsClient.send(new ReceiveMessageCommand(params));

    if (!data.Messages || data.Messages.length === 0) {
      console.log("No messages received.");
      return;
    }

    // Process each message in the batch
    for (const message of data.Messages) {
      try {
        if (!message.Body) {
          console.error("Message body is empty or undefined.");
          continue;
        }
        let data = JSON.parse(message.Body);
        let messageId = data.messageId;
        let orderData = data.orderData;
        console.log('Line 41 ', messageId);
        // After successful processing, delete the message from the queue
        try {
          let createOrder = async () => {
            let response = await handleBulkOrderForApi(orderData);
            let a = response.data?.orderResponses;
            console.log('Line 47', a)
            return;
          };
         await createOrder();
        } catch (error) {
          console.error("Error creating order:", error);
        }
        await sqsClient.send(
          new DeleteMessageCommand({
            QueueUrl: appConfig.primaryQueueUrl,
            ReceiptHandle: message.ReceiptHandle,
          })
        );

      
      } catch (error) {
        console.error("Error processing message:", error);
        // You can implement retry logic here if needed
      }
    }
  } catch (error) {
    console.error("Error receiving messages from SQS:", error);
  }
}

// Continuously poll the SQS queue for new messages
async function startWorker() {
  console.log("SQS Worker started. Listening for messages...");
  while (true) {
    await receiveMessages();
    // Add a delay between polls (e.g., 5 seconds)
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

// Start the worker
startWorker().catch((error) => {
  console.error("Worker encountered an error:", error);
});