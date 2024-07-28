# @subwallet-connect/bitkeep

## (Deprecated) Wallet module for connecting Bitkeep to web3-onboard
_Use [@subwallet-connect/bitget](https://www.npmjs.com/package/@subwallet-connect/bitget)_

## Wallet module for connecting Bitkeep Wallet through web3-onboard

Bitkeep Wallet SDK wallet module for connecting to Web3-Onboard. Web3-Onboard makes it simple to connect Ethereum hardware and software wallets to your dapp. Features standardized spec compliant web3 providers for all supported wallets, framework agnostic modern javascript UI with code splitting, CSS customization, multi-chain and multi-account support, reactive wallet state subscriptions and real-time transaction state change notifications.

### Install

**NPM**
`npm i @subwallet-connect/core @subwallet-connect/bitkeep`

**Yarn**
`yarn add @subwallet-connect/core @subwallet-connect/bitkeep`

## Usage

```typescript
import Onboard from '@subwallet-connect/core'
import bitkeepModule from '@subwallet-connect/bitkeep'

const bitKeep = bitkeepModule()

const onboard = Onboard({
  // ... other Onboard options
  wallets: [
    bitKeep()
    //... other wallets
  ]
})

const connectedWallets = await onboard.connectWallet()
console.log(connectedWallets)
```
