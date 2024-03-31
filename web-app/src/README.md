# @dev README - Web App

## Prerequisites
### BlockChain RPC with deployed Finthetix Contracts
You need a running RPC node which will relay your requests to the blockchain. Set this up before you start your web server. You make the web server aware of he RPC URL, via [.env variables](#env-vars)

#### Development
You need a local anvil chain running for development purposes. First start the chain by
```sh
$ anvil
```
Then deploy the contracts. Be sure to install make if you don't already have it on your system.
```sh
$ sudo apt install make #optional
/contracts$ make deploy-dev
```

You will receive the deployed contract addresses in the CLI output similar to the following
> == Return ==
>
> stakingTokenAddr: address 0x5FbDB2315678afecb367f032d93F642f64180aa3
> stakingContractAddr: address 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
> rewardTokenAddr: address 0xCafac3dD18aC6c6e92c921884f9E4176737C052c

Copy these (what's in your CLI, not what's above) to the _web-app/src/.env_ as per the next step.

#### Production
You may directly interact with smart contracts deployed to an actual blockchain. Just provide, in the .env file, a valid RPC URL ([Alchemy](https://www.alchemy.com/) or [Infura](https://www.infura.io/) will help here), and the addresses of the smart contracts on the deployed chain.

### Env vars
Add the env variables, for the app to function properly. 

The `PRODUCTION_CHAIN_INFO` is not a necessity in development server, as we hardcode the anvil chain for `NODE_ENV="development"`. But the smart contract addresses obtained after deploying the smart contract

The block explorer related env variables are only used for rendering links, not any computation. So you may use dummy values in development.

## Development Server
Run the following command to start the dev server
```sh
/web-app/src$ npm run dev
```

## Production Server
The current production environment is a lambda hosting an express server, on which Remix is a handler on an endpoint. This is as per the official express-adapter for Remix

### Building
First [setup environment variables](#env-vars). Then, build the production server with
```sh
/web-app/src$ npm run build
```

### Running locally
You can optionally run the express server locally **after building**, so that you can interact with the production smart contract. This is because, in production mode,  the `PRODUCTION_CHAIN_INFO` environment variable is picked up, instead of the hardcoded local anvil chain.

To start the server run
```sh
/web-app/src$ npm run start
```

For actual production use, we mount the express server on a lambda handler using [Serverless HTTP](https://www.npmjs.com/package/serverless-http). For running this setup locally, we just start the express server as a standalone server using `app.listen(3000)`