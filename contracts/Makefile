include .env

DEPLOY_SCRIPT=script/01_Deploy.s.sol

# These hardcoded private keys are from the anvil local chain
deploy-dev: $(DEPLOY_SCRIPT)
	forge script $(DEPLOY_SCRIPT) --rpc-url http://127.0.0.1:8545 --broadcast \
		--sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
		--private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

deploy-prod: $(DEPLOY_SCRIPT)
	@forge script $(DEPLOY_SCRIPT) --rpc-url ${RPC_URL} --broadcast \
		--account ${DEPLOYER_ACC_NAME} \
		--sender $$(cast wallet address --account ${DEPLOYER_ACC_NAME}) \
		--verify --chain ${CHAIN_NAME} --etherscan-api-key ${ETHERSCAN_API_KEY}
	