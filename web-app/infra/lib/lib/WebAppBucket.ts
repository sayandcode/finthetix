import { Construct } from 'constructs';
import * as S3 from 'aws-cdk-lib/aws-s3';
import * as S3Deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as Cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cdk from 'aws-cdk-lib';
import parsedEnv from '../utils/env';

export default class WebAppBucket extends Construct {
  public readonly bucket: S3.Bucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);
    const { stackName } = cdk.Stack.of(this);

    this.bucket = new S3.Bucket(this, 'bucket', {
      bucketName: `${stackName.toLowerCase()}-web-app`,
      encryption: S3.BucketEncryption.S3_MANAGED,
      autoDeleteObjects: true,
      enforceSSL: true,
      minimumTLSVersion: 1.2,
      accessControl: S3.BucketAccessControl.PRIVATE,
      blockPublicAccess: new S3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      objectOwnership: S3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      cors: [{
        allowedMethods: [S3.HttpMethods.GET],
        allowedOrigins: ['*'],
        maxAge: parsedEnv.STATIC_CACHE_TIME_IN_S,
      }],
    });
  }

  deployStaticAssets(
    { pathToAssets, destinationKeyPrefix, cdnDistribution }:
    {
      pathToAssets: string
      destinationKeyPrefix: string
      cdnDistribution: Cloudfront.Distribution
    },
  ) {
    new S3Deployment.BucketDeployment(this, 'build-assets', {
      destinationBucket: this.bucket,
      sources: [S3Deployment.Source.asset(pathToAssets)],
      destinationKeyPrefix,
      prune: true,
      retainOnDelete: false,
      distribution: cdnDistribution,
    });
  }
}
