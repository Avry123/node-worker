require('dotenv').config();


// Define a type for the AWS configuration
interface AwsConfig {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  }
  
  // Define a type for the entire configuration
  interface AppConfig {
    awsConfig: AwsConfig;
    primaryQueueUrl: string;
    responseQueueUrl: string;
  }
  
  // Helper function to validate environment variables
  function getEnvVariable(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Missing environment variable: ${name}`);
    }
    return value;
  }
  
  // Export the configuration with proper typing
  const appConfig: AppConfig = {
    awsConfig: {
      region: getEnvVariable('AWS_REGION'),
      accessKeyId: getEnvVariable('AWS_ACCESS_KEY_ID'),
      secretAccessKey: getEnvVariable('AWS_SECRET_ACCESS_KEY'),
    },
    primaryQueueUrl: getEnvVariable('SQS_PRIMARY_QUEUE_URL'),
    responseQueueUrl: getEnvVariable('SQS_RESPONSE_QUEUE_URL'),
  };
  
  export default appConfig;