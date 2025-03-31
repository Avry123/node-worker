"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
// Helper function to validate environment variables
function getEnvVariable(name) {
    var value = process.env[name];
    if (!value) {
        throw new Error("Missing environment variable: ".concat(name));
    }
    return value;
}
// Export the configuration with proper typing
var appConfig = {
    awsConfig: {
        region: getEnvVariable('AWS_REGION'),
        accessKeyId: getEnvVariable('AWS_ACCESS_KEY_ID'),
        secretAccessKey: getEnvVariable('AWS_SECRET_ACCESS_KEY'),
    },
    primaryQueueUrl: getEnvVariable('SQS_PRIMARY_QUEUE_URL'),
    responseQueueUrl: getEnvVariable('SQS_RESPONSE_QUEUE_URL'),
};
exports.default = appConfig;
