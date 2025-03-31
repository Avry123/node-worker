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
// worker.js
var client_sqs_1 = require("@aws-sdk/client-sqs");
var queue_1 = require("./lib/queue");
var sqsClient = new client_sqs_1.SQSClient({
    region: queue_1.default.awsConfig.region,
    credentials: {
        accessKeyId: queue_1.default.awsConfig.accessKeyId,
        secretAccessKey: queue_1.default.awsConfig.secretAccessKey,
    },
});
function receiveMessages() {
    return __awaiter(this, void 0, void 0, function () {
        var params, data, _i, _a, message, error_1, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    params = {
                        QueueUrl: queue_1.default.primaryQueueUrl, // Use the primary queue URL
                        MaxNumberOfMessages: 10, // Maximum number of messages to retrieve in one call
                        WaitTimeSeconds: 20, // Long polling - wait up to 20 seconds for messages to arrive
                    };
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 9, , 10]);
                    return [4 /*yield*/, sqsClient.send(new client_sqs_1.ReceiveMessageCommand(params))];
                case 2:
                    data = _b.sent();
                    if (!data.Messages || data.Messages.length === 0) {
                        console.log("No messages received.");
                        return [2 /*return*/];
                    }
                    _i = 0, _a = data.Messages;
                    _b.label = 3;
                case 3:
                    if (!(_i < _a.length)) return [3 /*break*/, 8];
                    message = _a[_i];
                    _b.label = 4;
                case 4:
                    _b.trys.push([4, 6, , 7]);
                    console.log("Processing message:", message.Body);
                    console.log('Line 40 ', message);
                    // After successful processing, delete the message from the queue
                    return [4 /*yield*/, sqsClient.send(new client_sqs_1.DeleteMessageCommand({
                            QueueUrl: queue_1.default.primaryQueueUrl,
                            ReceiptHandle: message.ReceiptHandle,
                        }))];
                case 5:
                    // After successful processing, delete the message from the queue
                    _b.sent();
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _b.sent();
                    console.error("Error processing message:", error_1);
                    return [3 /*break*/, 7];
                case 7:
                    _i++;
                    return [3 /*break*/, 3];
                case 8: return [3 /*break*/, 10];
                case 9:
                    error_2 = _b.sent();
                    console.error("Error receiving messages from SQS:", error_2);
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
}
// Continuously poll the SQS queue for new messages
function startWorker() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("SQS Worker started. Listening for messages...");
                    _a.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 4];
                    return [4 /*yield*/, receiveMessages()];
                case 2:
                    _a.sent();
                    // Add a delay between polls (e.g., 5 seconds)
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 5000); })];
                case 3:
                    // Add a delay between polls (e.g., 5 seconds)
                    _a.sent();
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Start the worker
startWorker().catch(function (error) {
    console.error("Worker encountered an error:", error);
});
