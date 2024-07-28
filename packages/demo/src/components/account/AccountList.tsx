/* eslint-disable @typescript-eslint/no-floating-promises */
// Copyright 2019-2022 @subwallet/sub-connect authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { Button, ModalContext, SwList, Web3Block } from '@subwallet/react-ui'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import type { Account } from '@subwallet-connect/core/dist/types'
import {
  useConnectWallet,
  useNotifications,
  useSetChain
} from '@subwallet-connect/react'
import { SubstrateProvider } from '@subwallet-connect/common'
import { GeneralEmptyList } from '../empty'
import { ThemeProps } from '../../types'
import CN from 'classnames'
import { evmApi } from '../../utils/api/evmApi'
import { substrateApi } from '../../utils/api/substrateApi'
import { toShort } from '../../utils/style'
import TransactionModal from '../transaction/TransactionModal'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { TRANSACTION_MODAL } from '../../constants/modal'
import SwAvatar from '@subwallet/react-ui/es/sw-avatar'
import { ScreenContext } from '../../context/ScreenContext'

interface Props extends ThemeProps {
  substrateProvider?: substrateApi
  evmProvider?: evmApi
}

type AccountMapType = {
  address: string
  name: string
  index: number
}

const items = [
  {
    id: 1,
    name: 'Carrot',
    imageUrl:
      'https://media.discordapp.net/attachments/603152829183426572/1267131222430187621/carrot.png?ex=66a7ab69&is=66a659e9&hm=6b4512720b190d030f3339a4f8c14ca643c58cceb32398c44cc2cdf58534d449&=&format=webp&quality=lossless&width=1624&height=1138'
  },
  {
    id: 2,
    name: 'Golden Carrot',
    imageUrl:
      'https://media.discordapp.net/attachments/603152829183426572/1267131222912401428/goldenCarrot.png?ex=66a7ab69&is=66a659e9&hm=56411de354a8fb029c05b23d98fb0b865e18027fe3082b34c1158feb51db20e2&=&format=webp&quality=lossless&width=1732&height=900'
  },
  {
    id: 3,
    name: 'Bunny House',
    imageUrl:
      'https://media.discordapp.net/attachments/603152829183426572/1267131221922807970/bunnyHouse.png?ex=66a7ab69&is=66a659e9&hm=8feaca7530e7b3fbc5b6479aab76260b0f3256ecd5e13731d7eb3edafaacdae8&=&format=webp&quality=lossless&width=1732&height=1004'
  },
  {
    id: 4,
    name: 'Ball',
    imageUrl:
      'https://cdn.discordapp.com/attachments/603152829183426572/1267131221482147850/ball.png?ex=66a7ab69&is=66a659e9&hm=b5d8a63cb555544dfce548cdfc45b2b50778555fdd8ef0f820082c3f30c18988&'
  },
  {
    id: 5,
    name: 'Magic Wand',
    imageUrl:
      'https://media.discordapp.net/attachments/603152829183426572/1267131223457665035/magicWand.png?ex=66a7ab69&is=66a659e9&hm=dd22e8bc33287bddcda9c7ebcce5e844fb616f38f9994125afc1a5e6328b545a&=&format=webp&quality=lossless&width=1470&height=1138'
  }
]

const modalId = TRANSACTION_MODAL
function Component({
  className,
  substrateProvider,
  evmProvider
}: Props): React.ReactElement {
  const [{ wallet }] = useConnectWallet()
  const { isWebUI } = useContext(ScreenContext)
  const renderEmpty = useCallback(() => <GeneralEmptyList />, [])
  const [accountsMap, setAccountMap] = useState<AccountMapType[]>([])
  const navigate = useNavigate()
  const [accountTransaction, setAccountTransaction] = useState<Account>()
  const [{ chains }] = useSetChain()
  const [, customNotification, updateNotify] = useNotifications()
  const { activeModal } = useContext(ModalContext)
  const [inputString, setInputString] = useState('')
  const [bought, setBought] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false
  ])

  const onSignClicked = useCallback(
    (address: string, messageString: string, index?: number, item: object) => {
      return async () => {
        if (wallet) {
          const { update, dismiss } = customNotification({
            type: 'pending',
            message: 'Processing…',
            autoDismiss: 0
          })
          try {
            wallet.type === 'evm'
              ? await evmProvider?.signMessage(address)
              : await substrateProvider?.signMessage(
                  address,
                  wallet.provider as SubstrateProvider,
                  wallet.signer,
                  wallet.chains[0].id,
                  messageString
                )
            update({
              eventCode: 'dbUpdateSuccess',
              message: `Message signed successfully`,
              type: 'success',
              autoDismiss: 2000
            })
            if (index !== undefined) {
              console.log(`set index bought ${index}`)
              setBought(prevBought => {
                const newBought = [...prevBought]
                newBought[index] = true
                return newBought
              })
              alert(`🎉🥳 Congrats on buying ${item.name}!! 🎉🥳`)
            }
          } catch (e) {
            update({
              eventCode: 'dbUpdateError',
              message: `${(e as Error).message}`,
              type: 'error',
              autoDismiss: 2000
            })
          }
        }
      }
    },
    [evmProvider, substrateProvider]
  )

  const onTransactionClicked = useCallback(
    (address: string) => {
      return async () => {
        const account = wallet?.accounts.find(
          ({ address: address_ }) => address === address_
        )
        setAccountTransaction(account)
        account && activeModal(modalId)
      }
    },
    [activeModal, wallet]
  )

  useEffect(() => {
    const accountMap = wallet?.accounts.reduce((acc, account, index) => {
      acc.push({
        address: account.address,
        index,
        name: account.uns?.name || account.ens?.name || toShort(account.address)
      })
      return acc
    }, [] as AccountMapType[])

    setAccountMap(accountMap || [])
  }, [wallet?.accounts])

  const accountItem = useCallback(
    ({ address, name }: AccountMapType) => {
      const key = `${address}_${name}`
      const _middleItem = (
        <div
          className={'__account-item-middle'}
          style={{ backgroundColor: '#cdb4db', color: 'black' }}
        >
          <div className={'__account-item-info'}>
            <span className="__account-item__title">Wallet name:</span>
            <span className="__account-item__content">
              <SwAvatar size={24} value={address} />
              <span className={'__account-item-name'}>{name}</span>
            </span>
          </div>
          <div className={'__account-item-info'}>
            <span className="__account-item__title">Address:</span>
            <span className="__account-item__content">{address}</span>
          </div>
          {/* 
          <div className={'__account-item-info'}>
            <Button
              className={CN('__wallet-btn', '__sub-wallet-sign-btn')}
              onClick={onSignClicked(address, `Signing as ${address}`)}
              block={true}
            >
              Sign Message
            </Button>

            <Button
              className={CN('__wallet-btn', '__sub-wallet-transaction-btn')}
              onClick={onTransactionClicked(address)}
              block={true}
            >
              Send Transaction
            </Button>
          </div> */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-around',
              gap: '20px',
              padding: '20px'
            }}
          >
            {items.map((item, index) => (
              <div
                key={item.id}
                style={{
                  width: '250px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  display: 'flex',
                  backgroundColor: '#bde0fe',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    objectFit: 'cover'
                  }}
                />
                <h3
                  style={{
                    margin: '0 0 10px 0',
                    fontSize: '18px',
                    textAlign: 'center',
                    color: 'black'
                  }}
                >
                  {item.name}
                </h3>
                <Button
                  className={CN('__wallet-btn', '__sub-wallet-sign-btn')}
                  onClick={onSignClicked(
                    address,
                    `Purchase ${item.name}`,
                    index,
                    item
                  )}
                  block={true}
                  disabled={bought[index]}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: bought[index] ? 'grey' : '#FFB6C1',
                    color: 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s'
                  }}
                >
                  {bought[index] ? 'Already Bought' : 'Buy Item'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )

      return (
        <>
          <Web3Block
            key={key}
            className={'__account-item'}
            middleItem={_middleItem}
          />
        </>
      )
    },
    [onSignClicked, onTransactionClicked, bought]
  )

  return (
    <>
      {accountsMap.length > 0 && (
        <>
          <SwList
            className={CN('__account-list', className, {
              '-isWeb': isWebUI
            })}
            list={accountsMap}
            renderWhenEmpty={renderEmpty}
            renderItem={accountItem}
          />
          {accountTransaction && (
            <TransactionModal
              senderAccount={accountTransaction}
              substrateProvider={substrateProvider}
              evmProvider={evmProvider}
            />
          )}
        </>
      )}
    </>
  )
}

export const AccountList = styled(Component)<Props>(({ theme: { token } }) => {
  return {
    '&.__account-list': {
      position: 'relative',
      width: '100%'
    },

    '&.-isWeb': {
      marginBottom: 200
    },

    '.__account-item': {
      padding: token.padding,
      width: '100%',
      marginBottom: token.marginSM,
      backgroundColor: token.colorBgSecondary,
      borderRadius: 8
    },

    '.__account-item-middle': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.paddingSM,
      overflow: 'hidden'
    },

    '.__account-item-info': {
      display: 'flex',
      justifyContent: 'space-between',
      width: '100%',
      overflow: 'hidden',
      gap: token.paddingSM
    },

    '.__account-item__title': {
      fontSize: token.fontSizeHeading6,
      fontStyle: 'normal',
      fontWeight: 600,
      width: 128,
      lineHeight: '22px',
      overflow: 'hidden'
    },

    '.__account-item__content': {
      display: 'flex',
      gap: token.paddingSM / 2,
      alignItems: 'center',
      textOverflow: 'ellipsis',
      fontSize: token.fontSizeHeading6,
      overflow: 'hidden',
      fontStyle: 'normal',
      fontWeight: 500,
      lineHeight: '22px',
      color: token.colorTextLight4
    },

    '.__sub-wallet-transaction-btn': {
      backgroundColor: '#252525',

      '&:hover': {
        backgroundColor: '#363636'
      }
    }
  }
})

export default AccountList
