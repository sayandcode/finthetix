# @dev README - Infrastructure as Code

## Prerequisites
Create a _.env_ file with the secrets defined as per [.env schema](/web-app/infra/lib/utils/env.ts)

## Useful commands
* `npm run build` - Builds the application src and the infrastructure template
* `npm run deploy` - Deploy this stack 
* `npm run deploy:ci` - Deploy this stack while on CI server
* `npm run undeploy` - Destroys the stack
* `npm run typecheck` - Runs typescript compiler for typechecking (doesn't emit compiled files)
* `npm run lint` - Lints with ESLint
