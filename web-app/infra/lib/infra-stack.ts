import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import path = require('node:path');
import parsedEnv from './utils/env';
import WebAppServerLambda from './lib/WebAppServerLambda';
import WebAppBucket from './lib/WebAppBucket';
import WebAppCdn from './lib/WebAppCdn';

// lambda files
const LOCAL_PATH_TO_WEB_APP_DIR = path.join(__dirname, '../../src/');
const LOCAL_PATH_TO_WEB_APP_LAMBDA_CODE_DIR = path.join(LOCAL_PATH_TO_WEB_APP_DIR, './dist/');

// static asset files
/** The folder in s3 inside which you want to put your static build assets  */
const WEB_APP_BUILD_ASSETS_S3_DIR = 'static';
const LOCAL_PATH_TO_WEB_APP_BUILD_ASSETS = path.join(LOCAL_PATH_TO_WEB_APP_DIR, './public/');

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const webAppServerLambda = new WebAppServerLambda(this, 'web-app-lambda-construct', {
      absolutePathToCode: LOCAL_PATH_TO_WEB_APP_LAMBDA_CODE_DIR,
    });

    const webAppBucket = new WebAppBucket(this, 'web-app-bucket');

    const webAppCdn = new WebAppCdn(this, 'web-app-cdn', {
      webAppServerLambdaFunctionUrl: webAppServerLambda.fnUrl,
      buildAssetsS3Dir: WEB_APP_BUILD_ASSETS_S3_DIR,
      buildAssetsS3Bucket: webAppBucket.bucket,
    });

    webAppBucket.deployStaticAssets({
      pathToAssets: LOCAL_PATH_TO_WEB_APP_BUILD_ASSETS,
      destinationKeyPrefix: WEB_APP_BUILD_ASSETS_S3_DIR,
      cdnDistribution: webAppCdn.distribution,
    });

    new cdk.CfnOutput(this, 'cdn-final-url', {
      value: `https://${webAppCdn.distribution.domainName}`,
      description: 'The Cloudfront URL where you can access the app.',
    });
    new cdk.CfnOutput(this, 'app-final-url', {
      value: `https://${parsedEnv.APP_CUSTOM_DOMAIN_NAME}`,
      description: 'The App URL where you can access the app.',
    });
    new cdk.CfnOutput(this, 'lambda-url', {
      value: webAppServerLambda.fnUrl.url,
      description: 'The URL where the lambda function is hosted',
    });
    new cdk.CfnOutput(this, 'app-s3-url', {
      value: webAppBucket.bucket.bucketDomainName,
      description: 'The URL of the S3 bucket where the app assets are hosted',
    });
  }
}
