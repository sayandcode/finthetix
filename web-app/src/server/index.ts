import { LambdaFunctionURLHandler } from 'aws-lambda';
import ServerlessHttp from 'serverless-http';
import makeApp from './app';

export const handler: LambdaFunctionURLHandler = (event, context) => {
  const app = makeApp();
  const serverlessInstance = ServerlessHttp(app);
  return serverlessInstance(event, context);
};
