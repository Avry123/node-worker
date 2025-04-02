import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, SendMessageCommand } from "@aws-sdk/client-sqs";
import appConfig from "./lib/queue";
import { handleBulkOrderForApi } from "./actions/orders";
const { io, userConnections } = require("./websocket-server");

const sqsClient = new SQSClient({
  region: appConfig.awsConfig.region,
  credentials: {
    accessKeyId: appConfig.awsConfig.accessKeyId,
    secretAccessKey: appConfig.awsConfig.secretAccessKey,
  },
});

async function sendToResponseQueue(orderResult: any) {
  const responseparams = {
    QueueUrl: appConfig.responseQueueUrl, // URL of the response queue
    MessageBody: JSON.stringify(orderResult),
  };

  try {
    let a = await sqsClient.send(new SendMessageCommand(responseparams));
    console.log("Line 21 ", a);
  } catch (error) {
    console.error("Error sending order result to response queue:", error);
  }
}

async function processMessage(message : any) {
  try {
    if (!message.Body) {
      console.error("Message body is empty or undefined.");
      return;
    }

    const { messageId, completOrderPass } = JSON.parse(message.Body);

    // Process order
    try {
      const response = await handleBulkOrderForApi(completOrderPass, messageId);
      console.log("Order processed successfully:", response.data?.orderResponses);
      console.log('Line 40')
      if (response.data?.orderResponses && response.data?.orderResponses.length === 1) {
        // console.log('Line 41')
        // sendToResponseQueue(response.data?.orderResponses[0]);
        const userId = response.data?.orderResponses[0].userId;
        const update = {
          orderId: response.data?.orderResponses[0].orderId,
          status: response.data?.orderResponses[0].status,
          awbNumber: response.data?.orderResponses[0].awbNumber ? response.data?.orderResponses[0].awbNumber : '',
        };

        // Emit the update to the WebSocket server
        if (userId) {
          // Emit the update to the WebSocket server
          const socketId = userConnections[userId];
          if (socketId) {
            io.to(socketId).emit("orderUpdate", update);
          } else {
            console.log(`No active connection found for user ${userId}`);
          }
        }
      }

    } catch (error) {
      console.error("Error processing order:", error);
      return; // Do not delete message if processing fails
    }

    // Delete message after successful processing
    await sqsClient.send(new DeleteMessageCommand({
      QueueUrl: appConfig.primaryQueueUrl,
      ReceiptHandle: message.ReceiptHandle,
    }));

    console.log(`Message ${messageId} deleted from queue.`);

  } catch (error) {
    console.error("Error processing message:", error);
  }
}

async function receiveMessages() {
  const params = {
    QueueUrl: appConfig.primaryQueueUrl,
    MaxNumberOfMessages: 10,
    WaitTimeSeconds: 20, // Long polling
  };

  try {
    const data = await sqsClient.send(new ReceiveMessageCommand(params));

    if (!data.Messages || data.Messages.length === 0) {
      console.log("No messages received.");
      return;
    }

    // Process messages concurrently
   let a = await Promise.allSettled(data.Messages.map(processMessage));
   console.log('Line 61 ', a)
  } catch (error) {
    console.error("Error receiving messages from SQS:", error);
  }
}

async function startWorker() {
  console.log("SQS Worker started. Listening for messages...");
  
  process.on("SIGINT", () => {
    console.log("Shutting down worker...");
    process.exit(0);
  });

  while (true) {
    await receiveMessages();
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Add delay to avoid excessive API calls
  }
}

startWorker().catch((error) => {
  console.error("Worker encountered an error:", error);
});
