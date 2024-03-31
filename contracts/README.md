# @dev README - Contracts

This project is built with [foundry](https://book.getfoundry.sh/).

## Commands

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Deploy to Local Anvil (development) chain
First start the anvil chain on a separate shell session
```shell
/contracts$ anvil 
```
Then deploy to it with the following command. It will use the default RPC used by anvil
```shell
# (Optional) sudo apt install make
/contracts$ make deploy-dev
```

### Deploy to Production Chain
```shell
# (Optional) sudo apt install make
/contracts$ make deploy-prod
```