import { Construct } from 'constructs';
import * as Lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';
import parsedEnv from '../utils/env';
import { z } from 'zod';
import { envSchema as appEnvSchema } from '../../../src/app/lib/env/schema';

type AppEnv = z.infer<typeof appEnvSchema>;

type Props = {
  absolutePathToCode: string
};

const lambdaEnv = {
  NODE_ENV: 'production',
  PRODUCTION_CHAIN_INFO: JSON.stringify(parsedEnv.PRODUCTION_CHAIN_INFO),
  STAKING_TOKEN_ADDRESS: parsedEnv.STAKING_TOKEN_ADDRESS,
  STAKING_CONTRACT_ADDRESS: parsedEnv.STAKING_CONTRACT_ADDRESS,
  REWARD_TOKEN_ADDRESS: parsedEnv.REWARD_TOKEN_ADDRESS,
  STATIC_CACHE_TIME_IN_S:
          JSON.stringify(parsedEnv.STATIC_CACHE_TIME_IN_S),
  BLOCK_EXPLORER_ADDRESS_URL: parsedEnv.BLOCK_EXPLORER_ADDRESS_URL,
  BLOCK_EXPLORER_TX_URL: parsedEnv.BLOCK_EXPLORER_TX_URL,
} satisfies {
  [k in keyof AppEnv]:
  AppEnv extends object ? string : string | undefined
};

export default class WebAppServerLambda extends Construct {
  public readonly fnUrl: Lambda.FunctionUrl;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const appLambda = new Lambda.Function(this, 'lambda', {
      code: Lambda.Code.fromAsset(props.absolutePathToCode),
      handler: 'lambda.handler',
      runtime: Lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnv,
      timeout: cdk.Duration.seconds(15),
    });

    this.fnUrl = appLambda.addFunctionUrl({
      authType: Lambda.FunctionUrlAuthType.NONE,
    });
  }
}
