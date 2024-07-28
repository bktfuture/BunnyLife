// Copyright 2019-2022 @subwallet/sub-connect authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useContext, useEffect, useState } from 'react'

import AccountList from '../components/account/AccountList'
import WalletMetadata from '../components/sub_action/metadata/WalletMetadata'
import { useNavigate } from 'react-router-dom'
import { useConnectWallet, useSetChain } from '@subwallet-connect/react'
import styled from 'styled-components'
import { ThemeProps } from '../types'
import CN from 'classnames'
import { NetworkInfo } from '../utils/network'
import { substrateApi } from '../utils/api/substrateApi'
import { ScreenContext } from '../context/ScreenContext'
import Game from './Game'
import { Button } from '@subwallet/react-ui'

interface Props extends ThemeProps {}

function Component({ className }: Props): React.ReactElement {
  const navigate = useNavigate()
  const [{ wallet }, , disconnect] = useConnectWallet()
  const [substrateProvider, setSubstrateProvider] = useState<substrateApi>()
  const [{ chains }] = useSetChain()
  const { isWebUI } = useContext(ScreenContext)
  const [showGame, setShowGame] = useState(false)

  useEffect(() => {
    if (wallet?.type === 'evm') navigate('/evm-wallet-info')
    if (!wallet) return
    const { namespace: namespace_, id: chainId } = wallet.chains[0]
    const chainInfo = chains.find(
      ({ id, namespace }) => id === chainId && namespace === namespace_
    )
    if (chainInfo) {
      const ws = NetworkInfo[chainInfo.label as string].wsProvider
      if (ws) {
        setSubstrateProvider(new substrateApi(ws))
      }
    }

    wallet.provider.on('accountsChanged', accounts => {
      if (!accounts || accounts.length === 0) {
        disconnect({ label: wallet.label, type: wallet.type })
      }
    })
  }, [wallet, navigate])

  return (
    <div
      className={CN('__wallet-info-page', className, {
        '-isMobile': !isWebUI
      })}
    >
      <div className={'__wallet-info-body'}>
        {wallet?.accounts && wallet.accounts.length > 0 && (
          <AccountList substrateProvider={substrateProvider} />
        )}
        {/* <div className={'__wallet-info-box'}>
          <div className={'__wallet-info-label'}>Account List</div>
          
        </div> */}
        {/* <div className={'__wallet-info-box'}>
          {!!wallet?.metadata && (
            <>
              <div className={'__wallet-info-label'}>Metadata</div>
              <WalletMetadata />
            </>
          )}
        </div> */}
      </div>
      {/* <Game /> */}
      {!showGame ? (
        <Button
          className={CN('__wallet-btn', '__sub-wallet-sign-btn')}
          onClick={() => setShowGame(true)}
          block={true}
        >
          Start Game!
        </Button>
      ) : (
        <iframe
          src="http://localhost:51833/"
          height="800px"
          width="100%"
        ></iframe>
      )}
    </div>
  )
}

const WalletInfo = styled(Component)<Props>(({ theme: { token } }) => {
  return {
    '&.__wallet-info-page': {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: token.padding
    },

    '&.-isMobile': {
      '.__wallet-info-body': {
        marginTop: 0
      }
    },

    '.__wallet-info-body': {
      display: 'flex',
      gap: token.paddingMD,
      flexWrap: 'wrap',
      width: '100%',
      marginTop: 230
    },

    '.__wallet-info-box': {
      display: 'flex',
      flexDirection: 'column',
      flex: '1 1 576px'
    },

    '.__wallet-info-label': {
      fontSize: 24,
      fontStyle: 'normal',
      fontWeight: 600,
      lineHeight: '32px',
      marginBottom: token.margin
    }
  }
})

export default WalletInfo
