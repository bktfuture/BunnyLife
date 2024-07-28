// Copyright 2019-2022 @subwallet/sub-connect authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {Button, Icon} from '@subwallet/react-ui';
import React, {useCallback, useContext, useEffect, useState} from 'react';
import { useConnectWallet, useSetChain } from "@subwallet-connect/react";
import {NetworkItemType, ThemeProps} from "../../types";
import CN from "classnames";
import styled from "styled-components";
import { openInNewTab } from "../../utils/window";
import {HELP_URL, WIKI_URL} from "../../constants/common";
import {LogoHeader} from "../../../assets";
import { Question } from '@phosphor-icons/react';
import { NetworkInfo } from "../../utils/network";
import { NetworkSelector } from "../modal";
import { NETWORK_SELECTOR_MODAL } from "../../constants/modal";
import {ScreenContext} from "../../context/ScreenContext";
import SelectAccount from "../modal/selectors/AccountSelector";


interface Props extends ThemeProps{
  visible?: boolean,
}
const modalId = NETWORK_SELECTOR_MODAL

function Component ({ visible, className }: Props): React.ReactElement<Props> {
  const [{ wallet}, connect] = useConnectWallet()
  const { isWebUI } = useContext(ScreenContext);
  const [{ chains, connectedChain }, set] = useSetChain();
  const [ isLoading, setLoading ] = useState(false);
  const [ networkItems, setNetworkItems ] = useState<NetworkItemType[]>([])
  const onClickAnotherWallet = async ()=>{
    await connect()
  }


  const findNetworkLabel = useCallback(()=>{
    const network = chains.find((chain) => chain.id === connectedChain?.id && chain.namespace === connectedChain.namespace);
    if(network){
      return NetworkInfo[network.label as string];
    }
    return NetworkInfo[wallet?.type === 'evm' ? 'Moonbase Alpha' : 'Westend']
  }, [connectedChain, chains, wallet])

  const onSwitchNetwork = useCallback(async (slug: string) => {
    setLoading(true);
    const networkInfo = Object.values(NetworkInfo).find((network)=> network.slug === slug);
    if(networkInfo){
      const network = chains.find((chain)=> chain.label === networkInfo.name && chain.namespace === networkInfo.namespace)
      if(network){
        try {
          await set({ chainId: network.id, chainNamespace: network.namespace })
        }catch (e) {
          console.log(e)
        }
      }
    }
    setLoading(false);
  }, [chains])

  useEffect(() => {
    const chainsFilter = chains.reduce((array, chain)=> {
      if (wallet && chain.namespace === wallet?.type) {

        array.push(NetworkInfo[chain.label as string])
      }
      return array;
    }, [] as NetworkItemType[])
    setNetworkItems(chainsFilter);
  }, [wallet, chains]);

  return (
    <header className={CN('__wallet-header', className, {
      '-isMobile': !isWebUI
    })}>
      <div className={CN('wallet-header-content',{
        "-isConnected": visible,
        "-isDisconnect": !visible
      })}>
        {
          visible ?
          <>
            <div className={CN('__header-static')}>
              <div className={CN('__header-logo')} dangerouslySetInnerHTML={{__html: LogoHeader}} />
              <div className={CN('__header-title')}>
                Polkadot Playground
              </div>
            </div>
            <div className={CN('__header-action')}>
              <NetworkSelector
                disabled={isLoading}
                items={networkItems}
                itemSelected={findNetworkLabel().slug}
                modalId={modalId}
                onSelectItem={onSwitchNetwork}
              />
              {wallet?.accounts && wallet.accounts.length > 0 && <SelectAccount/>}

            </div>
          </>:
          <>
            <div className={CN('__header-logo')} dangerouslySetInnerHTML={{__html: LogoHeader}} />
            <div className={CN('__header-title', 'h5-text')}>
              SubConnect
            </div>
           <Button
              icon={<Icon phosphorIcon={Question}/>}
              onClick={openInNewTab(HELP_URL)}
              size='xs'
              type='ghost'
            >
             {isWebUI && 'Help'}
            </Button>
          </>
        }
      </div>
  </header>
  );
}

const WalletHeader = styled(Component)<Props>(({theme : {token}}) => {

  return ({
    width: '100%',
    overflow: 'hidden',
    position: 'fixed',
    zIndex: 1,
    backgroundColor: token.colorBgDefault,

    '.wallet-header-content': {
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    '.wallet-header-content.-isDisconnect':{
      padding: token.paddingMD
    },

    '.wallet-header-content.-isConnected': {
      maxWidth: 1632,
      padding: '24px 16px',
      margin: 'auto',

      '.__header-title': {
        marginLeft: '0px'
      }
    },

    '.__header-static': {
      display: 'flex',
      gap: token.padding,
      justifyContent: 'flex-start',
      alignItems: 'center',

    },

    '.__header-title': {
      fontSize: 30,
      marginLeft: 30,
      color: token.colorTextLight1
    },

    '.__header-action': {
      display: 'flex',
      gap: token.paddingSM
    },

    '@media (max-width: 501px)': {
      '.wallet-header-content': {
        '.wallet-title': {
            fontSize: 18
        },

        '.spacer': {
            flex: '1 1 10px'
        },

        '.sub-wallet-btn': {
            paddingLeft: 3,
            paddingRight: 3
          }
        },
    },

    '&.-isMobile': {
      position: 'relative',
      width: '100%',
      marginLeft: 0,
      overflow: 'visible',

      '.wallet-header-content.-isConnected': {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: token.paddingSM,
        paddingLeft: 0,
        paddingRight: 0
      },

      '.__header-action': {
        width: '100%'
      },

      '.__header-title': {
        marginLeft: 0
      }
    },

    '.__header-logo': {
      padding: `0 ${token.padding}px`
    }
  })
})

export default WalletHeader;
