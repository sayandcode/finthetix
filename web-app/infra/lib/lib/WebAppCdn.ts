import * as cdk from 'aws-cdk-lib';
import * as ACM from 'aws-cdk-lib/aws-certificatemanager';
import * as Cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as Lambda from 'aws-cdk-lib/aws-lambda';
import * as S3 from 'aws-cdk-lib/aws-s3';
import * as CloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';
import parsedEnv from '../utils/env';

type Props = {
  webAppServerLambdaFunctionUrl: Lambda.FunctionUrl
  buildAssetsS3Dir: string
  buildAssetsS3Bucket: S3.Bucket
};

export default class WebAppCdn extends Construct {
  public readonly distribution: Cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.distribution = new Cloudfront.Distribution(this, 'cdn', {
      domainNames: [parsedEnv.APP_CUSTOM_DOMAIN_NAME],
      certificate: this.customDomainCert,
      defaultBehavior:
        this.makeAppEndpointBehaviour(props.webAppServerLambdaFunctionUrl),

      additionalBehaviors: {
        [`/${props.buildAssetsS3Dir}/*`]:
          this.makeStaticAssetsEndpointBehaviour(props.buildAssetsS3Bucket),
      },
    });
  }

  private get customDomainCert() {
    return ACM.Certificate.fromCertificateArn(
      this,
      'custom-domain-cert',
      parsedEnv.APP_CUSTOM_DOMAIN_CERT_ARN);
  }

  private makeAppEndpointBehaviour(functionUrl: Lambda.FunctionUrl) {
    return {
      origin: new CloudfrontOrigins.FunctionUrlOrigin(functionUrl),
      allowedMethods: Cloudfront.AllowedMethods.ALLOW_ALL,
      cachePolicy: new Cloudfront.CachePolicy(this, 'cache-policy-for-app-server', {
        comment: 'Allows the origin server to set the cache behaviour',
        defaultTtl: cdk.Duration.seconds(0),
        minTtl: cdk.Duration.seconds(0),
        // maxTtl will be default i.e 1 year
        enableAcceptEncodingGzip: true,
        enableAcceptEncodingBrotli: true,
        queryStringBehavior: Cloudfront.CacheQueryStringBehavior.all(),
      }),
      originRequestPolicy:
          Cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      viewerProtocolPolicy: Cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    };
  }

  private makeStaticAssetsEndpointBehaviour(staticAssetsBucket: S3.Bucket) {
    return {
      origin: new CloudfrontOrigins.S3Origin(staticAssetsBucket),
      cachePolicy: Cloudfront.CachePolicy.CACHING_OPTIMIZED,
      viewerProtocolPolicy: Cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    };
  }
}
