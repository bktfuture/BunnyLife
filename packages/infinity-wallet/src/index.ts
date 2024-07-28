import type { WalletInit, EIP1193Provider } from '@subwallet-connect/common'
import { openInfinityWallet } from '@infinitywallet/infinity-connector'
import { CustomWindow } from './types.js'
declare const window: CustomWindow

interface InfinityWalletOptions {
  chainId?: number
}

function infinityWallet(options?: InfinityWalletOptions): WalletInit {
  if (typeof window === 'undefined') return () => null

  return () => {
    return {
      type : 'evm',
      label: 'Infinity Wallet',
      getIcon: async () => (await import('./icon.js')).default,
      getInterface: async () => {
        const ethereumInjectionExists = window.hasOwnProperty('ethereum')

        let provider: EIP1193Provider

        // check if Infinity Wallet is injected into window.ethereum
        if (ethereumInjectionExists && window['ethereum'].isInfinityWallet) {
          provider = window.infinityWallet
        } else {
          openInfinityWallet(window.location.href, options?.chainId)
          throw new Error(
            'Opening Infinity Wallet! If not installed first download to use Infinity Wallet'
          )
        }

        return {
          provider
        }
      }
    }
  }
}

export default infinityWallet
