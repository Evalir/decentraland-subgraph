# Decentraland-subgraph
[Decentraland](https://decentraland.org/) is a decentralized protocol for ownership of LAND in a decentralized virtual world.

## Networks and Performance

This subgraph can be used for Decentraland on mainnet, and all testnets. In order to run it for a testnet, the `subgraph.yaml` file will need to have the contract addresses changed to point to the correct address for each respective network.

The subgraph takes a long time to sync, because Decentraland has produced a lot of data on mainnet. Somewhere between 10-20 hours, depending on your machine. 

## General Information on Decentraland Events and Contracts

The Decentraland smart contracts use upgradeability and proxies. These are important to consider when building a subgraph. With upgradeability, it means that we must carefully make sure every instance of a contract does get tracked by the subgraph, and that if any events are added or removed along the way, the subgraph mappings are written to ensure no important data is missing. 

Proxies provide a benefit in that the proxy addresses often emit all of the events. For example, the `EstateProxy` emits all the important events for Estates, and the `EstateRegistry` has been updated multiple times, yet we only have to ingest events from the proxy address. Care does need to be taken, in that we must examine every `EstateRegistry` on mainnet, in case an event has been removed or renamed from a previous version that does not show up on the current version. 

### Important Notes on Contract Upgrades that Affect the Mappings
* The `Transfer` event for LANDRegistry.sol has been updated. The first instance had five fields, the current one has 3 (and is the ERC721 standard). Both need to be tracked.

> NOTE - Currently having 2 events named `Transfer` causes our autogenerated Typescript types to create 2 of the same name, which will cause Assembly Script compiler errors. We are working on fixing this - see this issue https://github.com/graphprotocol/graph-node/issues/736. In the mean time, you can just go in and manually rename the event to `Transfer2` or something similar. 

### Information That Has Not Been Added to the Subgraph
#### Contracts not tracked at all

These contracts were left out, as they don't directly relate to ownership of parcels and land:

* `MANAToken`
* `TerraformReserve`
* `ReturnVesting`
* `ServiceLocator`
* `MortgageHelper`
* `RCNToken`
* `KyberOracle`
* `LANDAuction`
* `MANABurner`
* `MultiSigWallet`
* `Nobody`

#### Information Not Available on the Blockchain
`Districts` show up in the Decentraland Marketplace App, and are queryable in the [REST API](https://docs.decentraland.org/blockchain-interactions/api/). Unfortunately these are not stored on chain, they are stored by Decentraland in their own server. For now, these can't be added to a subgraph, unless they are put on chain, or sourced on IPFS and referenced on chain. This also includes `Contributions` to districts, which is queryable in the REST API.

Some other generic data on Genesis City is not on the blockchain, and thus can't be indexed by a Graph Node. Such as `tags`, and `map` data. 

### Information on Contracts being Ingested by the Subgraph

Most events are ingested by the Graph Node, but some are purposely left out since they do not contribute to data sources we are interested in. These are listed for each contract. Other relevant information is included where needed

#### LandRegistry (LandRegistry.sol and LandProxy)
Events not included:
* `DeployAuthorized`
* `DeployForbidden`
* `Approval`
* `ApprovalForAll`
* `EstateRegistrySet`
* `Upgrade` (Proxy contract)
* `OwnerUpdate` (Proxy Contract)

#### LegacyMarketplace.sol
Events not included:
* `ChangedPublicationFee`
* `ChangedOwnerCut`

#### Marketplace (MarketplaceStorage.sol, MarketplaceProxy)
Events not included:
* `ChangedPublicationFee`
* `ChangedOwnerCutPerMillion`
* `ChangeLegacyNFTAddress`
* `OwnerUpdate` (Proxy Contract)

#### MortageHelper.sol (NOT TRACKED)
This contract code come from the [Ripio Network](https://github.com/ripio/rcn-mortgages). There were three instances of it shown to exist on etherscan from https://github.com/decentraland/contracts :
* 0x59ccfc50bd19dcd4f40a25459f2075084eebc11e - appears to be a typo, as this is not a contract address
* 0xb3d9444f88dc1c30f18c69ebd8ec6f1fa2706376 - Has seven events emitted, mostly setting global variables, and one Mortage. Seems deprecated, so was left out of analysis
* 0x90263Ea5C57Dc6603CA7202920735A6E31235bB9 - The current live contract. Oddly only has one event emitted. So this whole contract isn't tracked in the subgraph either

#### MortageManager.sol
This contract code comes from the [Ripio Network](https://github.com/ripio/rcn-mortgages). There were three instances of it shown to exist on etherscan from https://github.com/decentraland/contracts :
* 0xea06746f1bd82412f9f243f6bee0b8194d67a67d - appears to be a typo, as this is not a contract address
* 0x0bdaf0d7eb72cac0e0c8defcbe83ccc06c66a602 - Only 4 events, appears it has been abandoned, so it isn't tracked in the subgraph
* 0x9abf1295086afa0e49c60e95c437aa400c5333b8 - 100 transactions, with over 25 event logs, so this is tracked

Events not used:
* `ReadedOracle` 
* `SetCreator`
* `SetEngine`
* `UpdatedLandData` - this event is emitted by `LandRegistry.sol`, and appears to just emit duplicate information from the `MortgageManager.sol` contract, so we leave it out. 

#### RCNEngine (NanoLoanEngine.sol)

It isn't used directly as a source in the manifest, but it does get called by  `mortgageManager.ts` to get loan data by calling a public getter. No events are tracked here.


#### Invite.sol (DecentralandInvite)
Code exists [here](https://github.com/decentraland/gate/blob/master/contracts/Invite.sol). This contract was deployed 4 different times, at the following addresses:

* `0xCE55f653B5B7a112bfe2ef55fa5621ABDab16D39`
* `0x2b6a877fafd33cd3ee98e772acafe7b6cff7c33b`
* `0x399caff06e6419a8a3a6d4d1d2b94cb14ddeda87`
* `0xf886313f213c198458eba7ae9329525e64eb763a`

Only the last address is ingested by the subgraph. This is because there is no proxy for this contract, so it is assumed the first three contracts can be considered abandoned

Events not used:
* `URIUpdated`
* `Transfer` (ERC721)
* `Approval` (ERC721)
* `ApprovalForAll` (ERC721)


### EstateRegistry (EstateRegistry.sol and EstateProxy)
Events not used:
* `SetLANDRegistry`

## Brief Description of The Graph Node Setup

A Graph Node can run multiple subgraphs. The subgraph ingests event data by calling to Infura through http. It can also connect to any geth node or parity node that accepts RPC calls. Fast synced geth nodes work. To use parity, the `--no-warp` flag must be used. Setting up a local Ethereum node is more reliable and faster, but Infura is the easiest way to get started. 

This subgraph has three types of files which tell the Graph Node to ingest events from specific contracts. They are:
* The subgraph manifest (subgraph.yaml)
* A GraphQL schema      (schema.graphql)
* Mapping scripts       (estate.ts, land-registry.ts, legacy-marketplace.ts etc.) 

This repository has these files created and ready to compile, so a user can start this subgraph on their own. The only thing that needs to be edited is the contract addresses in the `subgraph.yaml` file to change between mainnet and testnets.  

We have provided a quick guide on how to start up the Decentraland-Subgraph graph node below. If these steps aren't descriptive enough, the [getting started guide](https://github.com/graphprotocol/graph-node/blob/master/docs/getting-started.md) has in depth details on running a subgraph. 

## Steps to get the Decentraland-Subgraph Running Locally
When you first start out, you will likely want to do a lot of local testing, to quickly iterate on mistakes, and the local deployment of a subgraph is the best way to go for this. See the instructions below:

  1. Install IPFS and run `ipfs init` followed by `ipfs daemon`
  2. Install PostgreSQL and run `initdb -D .postgres` followed by `pg_ctl -D .postgres start` and `createdb graph-node`
  3. If using Ubuntu, you may need to install additional packages: `sudo apt-get install -y clang libpq-dev libssl-dev pkg-config`
  4. Clone this repository, and run the following:
     * `yarn`
     * `yarn codegen` 
  5. Clone https://github.com/graphprotocol/graph-node from master and `cargo build` (this might take a while)
  6. a) Now that all the dependencies are running, you can run the following command to connect to Infura Mainnet (it may take a few minutes for Rust to compile). PASSWORD might be optional, it depends on your postrgres setup:

```
  cargo run -p graph-node --release -- \
  --postgres-url postgresql://USERNAME:[PASSWORD]@localhost:5432/graph-node \
  --ipfs 127.0.0.1:5001 \
  --ethereum-rpc mainnet-infura:https://mainnet.infura.io --debug
```
  6. b) Or Mainnet with a Local Ethereum node. This is very common if you are working with brand new contracts, and you have deployed them to a testnet environment like *ganache* (note that ganache commonly uses port 9545 rather than 8545):
```
  cargo run -p graph-node --release -- \
  --postgres-url postgresql://USERNAME:[PASSWORD]@localhost:5432/graph-node \
  --ipfs 127.0.0.1:5001 \
  --ethereum-rpc mainnet-local:http://127.0.0.1:8545 
```
  6. c) Or Infura Ropsten _(NOTE: Infura testnets are not reliable right now, we get inconsistent results returned. If Ropsten data is needed, it is suggested to run your own Ropsten node)_
```
    cargo run -p graph-node --release --   \
    --postgres-url postgresql://USERNAME:[PASSWORD]@localhost:5432/graph-node \
    --ipfs 127.0.0.1:5001 \
    --ethereum-rpc ropsten-infura:https://ropsten.infura.io 

```
  
 7. Now create the subgraph locally on The Graph Node with `yarn create-local`. On The Graph Hosted service, creating the subgraph is done in the web broswer. 

 8. Now deploy the Decentraland subgraph to The Graph Node with `yarn deploy --debug`. You should see a lot of blocks being skipped in the `graph-node` terminal, and then it will start ingesting events from the moment the contracts were uploaded to the network. 

Now that you have subgraph is running you may open a [Graphiql](https://github.com/graphql/graphiql) browser at `127.0.0.1:8000` and get started with querying.

## Viewing the Subgraph on the Graph Hosted Service
This subgraph has already been deploy to the hosted service, and you can see it under on [The Graph Explorer](https://thegraph.com/explorer/). To understand how deploying to the hosted service works, check out the [Deploying Instructions](https://thegraph.com/docs/deploy-a-subgraph) in the official documentation. The most important part of deploying to the hosted service is ensuring that the npm script for `deploy` is updated to the correct name that you want to deploy with. 

## Getting started with querying 
Below are a few ways to show how to query the Decentraland Subgraph for data. The queries show most of the information that is queryable, but there are many other filtering options that can be used, just check out the [querying api](https://github.com/graphprotocol/graph-node/blob/master/docs/graphql-api.md). These queries can be used locally or in The Graph Explorer playground.

### Querying Parcels
```graphql
{
  parcels {
    id
    x
    y
    estate {
      id
      owner
      operator
      land
      metaData
      size
      sizeArray
      tx
    }
    owner
    data {
      id
      version
      name
      description
      ipns
    }
    lastTransferredAt
    orderOwner
    orderPrice
    activeOrder{
      id
      type
      txHash
      owner
      price
      status
      buyer
      contract
      blockNumber
      expiresAt
      blockTimeCreatedAt
      blockTimeUpdatedAt
      marketplace
      nftAddress
    }
    createdAt
    updatedAt
    operators
  }
}
```

### Querying Estates
```graphql
{
  estates {
    id
    owner
    operator
    land
    metaData
    size
    sizeArray
    tx
}
```

### Querying Mortgages
```graphql
{
  mortgages {
    id
    txHash
    createdAt
    startedAt
    lastUpdatedAt
    status
    borrower
    rcnEngine
    loan_id
    landMarket
    landID
    deposit
    tokenConverter
    landCost
    parcel{
      id
    }
    estate{
      id
    }
    lender
    loanAmount
    dueTime
    }
}
```

### Querying Decentraland Invites
```graphql
{
  invites {
    id
    inviteBalance
    invites
  }
}
```