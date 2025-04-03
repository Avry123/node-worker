"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_sqs_1 = require("@aws-sdk/client-sqs");
const queue_1 = __importDefault(require("./lib/queue"));
const orders_1 = require("./actions/orders");
const websocket_server_1 = require("./websocket-server");
// const { io, userConnections } = require("./websocket-server");
const sqsClient = new client_sqs_1.SQSClient({
    region: queue_1.default.awsConfig.region,
    credentials: {
        accessKeyId: queue_1.default.awsConfig.accessKeyId,
        secretAccessKey: queue_1.default.awsConfig.secretAccessKey,
    },
});
function sendToResponseQueue(orderResult) {
    return __awaiter(this, void 0, void 0, function* () {
        const responseparams = {
            QueueUrl: queue_1.default.responseQueueUrl, // URL of the response queue
            MessageBody: JSON.stringify(orderResult),
        };
        try {
            let a = yield sqsClient.send(new client_sqs_1.SendMessageCommand(responseparams));
            console.log("Line 21 ", a);
        }
        catch (error) {
            console.error("Error sending order result to response queue:", error);
        }
    });
}
function processMessage(message) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            if (!message.Body) {
                console.error("Message body is empty or undefined.");
                return;
            }
            const { messageId, completOrderPass } = JSON.parse(message.Body);
            // Process order
            try {
                const response = yield (0, orders_1.handleBulkOrderForApi)(completOrderPass, messageId);
                console.log("Order processed successfully:", (_a = response.data) === null || _a === void 0 ? void 0 : _a.orderResponses);
                // Emit response via WebSocket
                ((_b = response.data) === null || _b === void 0 ? void 0 : _b.orderResponses) && ((_c = response.data) === null || _c === void 0 ? void 0 : _c.orderResponses.forEach((order) => {
                    const userSocketId = websocket_server_1.userConnections.get(order.userId);
                    if (userSocketId) {
                        websocket_server_1.io.to(userSocketId).emit("order_status", order);
                        console.log(`Emitted order status to user ${order.userId}:`, order);
                    }
                }));
            }
            catch (error) {
                console.error("Error processing order:", error);
                return; // Do not delete message if processing fails
            }
            // Delete message after successful processing
            yield sqsClient.send(new client_sqs_1.DeleteMessageCommand({
                QueueUrl: queue_1.default.primaryQueueUrl,
                ReceiptHandle: message.ReceiptHandle,
            }));
            console.log(`Message ${messageId} deleted from queue.`);
        }
        catch (error) {
            console.error("Error processing message:", error);
        }
    });
}
function receiveMessages() {
    return __awaiter(this, void 0, void 0, function* () {
        const params = {
            QueueUrl: queue_1.default.primaryQueueUrl,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 20, // Long polling
        };
        try {
            const data = yield sqsClient.send(new client_sqs_1.ReceiveMessageCommand(params));
            if (!data.Messages || data.Messages.length === 0) {
                console.log("No messages received.");
                return;
            }
            // Process messages concurrently
            let a = yield Promise.allSettled(data.Messages.map(processMessage));
            console.log('Line 61 ', a);
        }
        catch (error) {
            console.error("Error receiving messages from SQS:", error);
        }
    });
}
function startWorker() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("SQS Worker started. Listening for messages...");
        process.on("SIGINT", () => {
            console.log("Shutting down worker...");
            process.exit(0);
        });
        while (true) {
            yield receiveMessages();
            yield new Promise((resolve) => setTimeout(resolve, 5000)); // Add delay to avoid excessive API calls
        }
    });
}
startWorker().catch((error) => {
    console.error("Worker encountered an error:", error);
});
