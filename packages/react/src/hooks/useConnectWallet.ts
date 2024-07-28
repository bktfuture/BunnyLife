import { useCallback, useState } from 'react'

import type {
  ConnectOptions,
  DisconnectOptions,
  WalletState
} from '@subwallet-connect/core'
import type {Chain, WalletInit} from '@subwallet-connect/common'
import { useWeb3Onboard } from '../context.js'
import { useAppState } from './useAppState.js'

export const useConnectWallet = (): [
  { wallet: WalletState | null; connecting: boolean },
  (options?: ConnectOptions) => Promise<WalletState[]>,
  (wallet: DisconnectOptions) => Promise<WalletState[]>,
  (addresses?: string[]) => Promise<void>,
  (wallets: WalletInit[]) => void,
  (wallet: WalletState,  chain : Chain[], address?: string) => Promise<void>
] => {
  const web3Onboard = useWeb3Onboard()

  const { connectWallet, disconnectWallet } = web3Onboard

  const wallets = useAppState('wallets')
  const wallet = wallets[0] || null

  const [connecting, setConnecting] = useState<boolean>(false)

  const connect = useCallback(async (options?: ConnectOptions) => {
    setConnecting(true)

    const walletState = await connectWallet(options)

    setConnecting(false)

    return walletState
  }, [])

  const disconnect = useCallback(async ({ label, type }: DisconnectOptions) => {
    setConnecting(true)

    const walletState = await disconnectWallet({ label, type })

    setConnecting(false)

    return walletState
  }, [])

  const updateBalances = web3Onboard.state.actions.updateBalances
  const setWalletModules = web3Onboard.state.actions.setWalletModules
  const setPrimaryWallet = web3Onboard.state.actions.setPrimaryWallet

  return [
    { wallet, connecting },
    connect,
    disconnect,
    updateBalances,
    setWalletModules,
    setPrimaryWallet
  ]
}
