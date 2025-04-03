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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_sqs_1 = require("@aws-sdk/client-sqs");
var queue_1 = require("./lib/queue");
var orders_1 = require("./actions/orders");
var websocket_server_1 = require("./websocket-server");
// const { io, userConnections } = require("./websocket-server");
var sqsClient = new client_sqs_1.SQSClient({
    region: queue_1.default.awsConfig.region,
    credentials: {
        accessKeyId: queue_1.default.awsConfig.accessKeyId,
        secretAccessKey: queue_1.default.awsConfig.secretAccessKey,
    },
});
function sendToResponseQueue(orderResult) {
    return __awaiter(this, void 0, void 0, function () {
        var responseparams, a, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    responseparams = {
                        QueueUrl: queue_1.default.responseQueueUrl, // URL of the response queue
                        MessageBody: JSON.stringify(orderResult),
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, sqsClient.send(new client_sqs_1.SendMessageCommand(responseparams))];
                case 2:
                    a = _a.sent();
                    console.log("Line 21 ", a);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("Error sending order result to response queue:", error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function processMessage(message) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, messageId, completOrderPass, response, error_2, error_3;
        var _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 6, , 7]);
                    if (!message.Body) {
                        console.error("Message body is empty or undefined.");
                        return [2 /*return*/];
                    }
                    _a = JSON.parse(message.Body), messageId = _a.messageId, completOrderPass = _a.completOrderPass;
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, orders_1.handleBulkOrderForApi)(completOrderPass, messageId)];
                case 2:
                    response = _e.sent();
                    console.log("Order processed successfully:", (_b = response.data) === null || _b === void 0 ? void 0 : _b.orderResponses);
                    // Emit response via WebSocket
                    ((_c = response.data) === null || _c === void 0 ? void 0 : _c.orderResponses) && ((_d = response.data) === null || _d === void 0 ? void 0 : _d.orderResponses.forEach(function (order) {
                        var userSocketId = websocket_server_1.userConnections.get(order.userId);
                        if (userSocketId) {
                            websocket_server_1.io.to(userSocketId).emit("order_status", order);
                            console.log("Emitted order status to user ".concat(order.userId, ":"), order);
                        }
                    }));
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _e.sent();
                    console.error("Error processing order:", error_2);
                    return [2 /*return*/]; // Do not delete message if processing fails
                case 4: 
                // Delete message after successful processing
                return [4 /*yield*/, sqsClient.send(new client_sqs_1.DeleteMessageCommand({
                        QueueUrl: queue_1.default.primaryQueueUrl,
                        ReceiptHandle: message.ReceiptHandle,
                    }))];
                case 5:
                    // Delete message after successful processing
                    _e.sent();
                    console.log("Message ".concat(messageId, " deleted from queue."));
                    return [3 /*break*/, 7];
                case 6:
                    error_3 = _e.sent();
                    console.error("Error processing message:", error_3);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function receiveMessages() {
    return __awaiter(this, void 0, void 0, function () {
        var params, data, a, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    params = {
                        QueueUrl: queue_1.default.primaryQueueUrl,
                        MaxNumberOfMessages: 10,
                        WaitTimeSeconds: 20, // Long polling
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, sqsClient.send(new client_sqs_1.ReceiveMessageCommand(params))];
                case 2:
                    data = _a.sent();
                    if (!data.Messages || data.Messages.length === 0) {
                        console.log("No messages received.");
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, Promise.allSettled(data.Messages.map(processMessage))];
                case 3:
                    a = _a.sent();
                    console.log('Line 61 ', a);
                    return [3 /*break*/, 5];
                case 4:
                    error_4 = _a.sent();
                    console.error("Error receiving messages from SQS:", error_4);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function startWorker() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("SQS Worker started. Listening for messages...");
                    process.on("SIGINT", function () {
                        console.log("Shutting down worker...");
                        process.exit(0);
                    });
                    _a.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 4];
                    return [4 /*yield*/, receiveMessages()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 5000); })];
                case 3:
                    _a.sent(); // Add delay to avoid excessive API calls
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
startWorker().catch(function (error) {
    console.error("Worker encountered an error:", error);
});
