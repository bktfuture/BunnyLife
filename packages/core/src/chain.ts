import { firstValueFrom, Observable } from 'rxjs'
import { filter, map } from 'rxjs/operators'
import { type Chain, type EIP1193Provider, ProviderRpcErrorCode } from '@subwallet-connect/common'
import { addNewChain,  switchChain } from './provider.js'
import { state } from './store/index.js'
import { switchChainModal$ } from './streams.js'
import type { WalletState } from './types.js'
import { toHexString } from './utils.js'
import { customNotification, updateChain, updateWallet } from './store/actions.js'
import { getBalance } from './provider.js';



async function setChain(options: {
  chainId: string | number
  chainNamespace?: string
  wallet?: WalletState['label'],
  walletType ?: WalletState['type'],
  rpcUrl?: string
  label?: string
  token?: string
}): Promise<boolean> {
  // const error = validateSetChainOptions(options)
  //
  // if (error) {
  //   throw error
  // }

  const { wallets, chains } = state.get()
  const {
    chainId,
    chainNamespace ,
    wallet: walletToSet,
    rpcUrl,
    label,
    walletType,
    token
  } = options
  const chainIdHex = chainNamespace === 'evm' ? toHexString(chainId) : chainId.toString()

  // validate that chainId has been added to chains
  const chain = chains.find(
      ({ namespace, id }) =>
          namespace === chainNamespace &&
          id.toLowerCase() === chainIdHex.toLowerCase()
  )


  if (!chain) {
    throw new Error(
        `Chain with chainId: ${chainId} and chainNamespace: ${chainNamespace} has not been set and must be added when Onboard is initialized.`
    )
  }

  const wallet = walletToSet
      ? wallets.find(({ label, type }) =>
      label === walletToSet && type === walletType)
      : wallets[0]




  // validate a wallet is connected
  if (!wallet) {
    throw new Error(
        walletToSet
            ? `Wallet with label ${walletToSet} is not connected`
            : 'A wallet must be connected before a chain can be set'
    )
  }

  if(wallet.label === 'Ledger' && wallet.type === 'substrate'){
    const { dismiss } = customNotification({
      type: 'error',
      message:
        `switch network failed`,
      autoDismiss: 0
    })

    setTimeout(()=>{
      dismiss()
    }, 3000)

    return false;
  }
  const [walletConnectedChain] = wallet.chains

  // check if wallet is already connected to chainId
  if (
      walletConnectedChain.namespace === chainNamespace &&
      walletConnectedChain.id === chainIdHex
  ) {
    return true
  }

  try {
    wallet.type === 'evm' && await switchChain((wallet.provider as EIP1193Provider), chainIdHex )
    if( wallet.type === 'substrate' && chainNamespace === 'substrate'){
      const balance = await getBalance( wallet.accounts[0].address, chain, 'substrate' )
      updateWallet(wallet.label, wallet.type, {
        chains: [{ namespace: 'substrate', id: chainId.toString() }],
        accounts: wallet.accounts.map((acc, index) =>
            index === 0 ? {  ...acc, balance } :
                {  ...acc , balance : null }
        )
      })
  }
    const { dismiss } = customNotification({
      type: 'success',
      message:
          `Network switched successfully`,
      autoDismiss: 0
    })
    setTimeout(()=>{
      dismiss()
    }, 3000)
    return true
  } catch (error) {
    const { dismiss } = customNotification({
      type: 'error',
      message:
          `Switch network failed`,
      autoDismiss: 0
    })

    setTimeout(()=>{
      dismiss()
    }, 3000)

    const { code } = error as { code: number }
    const switchChainModalClosed$ = switchChainModal$.pipe(
        filter(x => x === null),
        map(() => false)
    )
    if (
        code === ProviderRpcErrorCode.CHAIN_NOT_ADDED ||
        code === ProviderRpcErrorCode.UNRECOGNIZED_CHAIN_ID
    ) {
      // chain has not been added to wallet
      if (rpcUrl || label || token) {
        if (rpcUrl) {
          chain.rpcUrl = rpcUrl
        }

        if (label) {
          chain.label = label
        }

        if (token) {
          chain.token = token
        }

        updateChain(chain)
      }

      // add chain to wallet
      return chainNotInWallet(
          wallet,
          chain,
          switchChainModalClosed$,
          chainIdHex
      )
    }

    if (code === ProviderRpcErrorCode.UNSUPPORTED_METHOD) {
      // method not supported
      switchChainModal$.next({ chain })
      return firstValueFrom(switchChainModalClosed$)
    }
  }

  return false
}

const chainNotInWallet = async (
    wallet: WalletState,
    chain: Chain,
    switchChainModalClosed$: Observable<boolean>,
    chainIdHex: string
): Promise<boolean> => {
  try {
    if(wallet.type === 'evm'){
      await addNewChain(( wallet.provider as EIP1193Provider ), chain)
      await switchChain(( wallet.provider as EIP1193Provider ), chainIdHex)
    }

    return true
  } catch (error) {
    const { code } = error as { code: number }
    if (code === ProviderRpcErrorCode.ACCOUNT_ACCESS_REJECTED) {
      // add new chain rejected by user
      return false
    }
    // display notification to user to switch chain
    switchChainModal$.next({ chain })
    return firstValueFrom(switchChainModalClosed$)
  }
}

export default setChain
