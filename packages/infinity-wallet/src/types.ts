import type { EIP1193Provider } from '@subwallet-connect/common'
export interface CustomWindow extends Window {
  ethereum: EIP1193Provider & {
    isInfinityWallet?: boolean
  }
  infinityWallet: EIP1193Provider
}
