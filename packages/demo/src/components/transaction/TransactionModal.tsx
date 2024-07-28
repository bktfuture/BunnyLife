import { ThemeProps, TransferParams, FormCallbacks, Theme, AmountData } from "../../types";
import {TRANSACTION_MODAL} from "../../constants/modal";
import { BaseModal} from "../modal";
import { Button, Form, Icon, Input, ModalContext, Number, ActivityIndicator } from '@subwallet/react-ui';
import { useState, useCallback, useMemo, useEffect, useContext } from "react";
import { useConnectWallet, useNotifications, useSetChain } from "@subwallet-connect/react";
import { Rule } from '@subwallet/react-ui/es/form';
import { useWatchTransaction } from "../../hooks";
import styled, {useTheme} from 'styled-components';
import BigN from 'bignumber.js';
import { isAddress, isEthereumAddress } from '@polkadot/util-crypto';
import CN from "classnames";
import AccountBriefInfo from "../account/AccountBriefInfo";
import type { Account } from '@subwallet-connect/core/dist/types';
import { PaperPlaneTilt } from "@phosphor-icons/react";
import { NetworkInfo } from "../../utils/network";
import { EIP1193Provider, SubstrateProvider } from "@subwallet-connect/common";
import { substrateApi } from "../../utils/api/substrateApi";
import { evmApi } from "../../utils/api/evmApi";
import { getMaxLengthText } from "../../utils/number";
import BN from "bn.js";
import {BN_ZERO} from "@polkadot/util";
import { formatBalance } from "../../utils/number";

export interface Props extends ThemeProps {
  senderAccount: Account;
  substrateProvider ?: substrateApi,
  evmProvider ?: evmApi,
};


const DEFAULT_ADDRESS = '5GnUABVD7kt1wnmLiSeGcuSd5ESvmVnAjdMRrtvKxUGxuy6N'
const modalId = TRANSACTION_MODAL;
function Component ({ className, senderAccount, evmProvider, substrateProvider }: Props) {
  const [{ wallet},] = useConnectWallet();
  const [{ chains }] = useSetChain();
  const [loading, setLoading] = useState(false);
  const [ validateTo, setValidateTo ] = useState(false);
  const [ validateValue, setValidateValue ] = useState(false);
  const [, customNotification, updateNotify,] = useNotifications();
  const [ availableBalance, setAvailableBalance ] = useState<AmountData>()
  const [ onReadyFreeBalance, setOnReadyFreeBalance ] = useState(false);
  const [ onError, setOnError ] = useState(false);
  const defaultData = useMemo((): TransferParams => {
    return ({
      from: senderAccount.address,
      to: '',
      value: ''
    })
  }, [senderAccount])
  const { token } = useTheme() as Theme;
  const { inactiveModal, checkActive } = useContext(ModalContext);

  const getMaxTransfer = useCallback(async () => {
    if(!wallet) return ;
    try{
      setOnReadyFreeBalance(false);
      substrateProvider && await substrateProvider.isReady();

      const { namespace: namespace_, id: chainId } = wallet.chains[0]
      const chainInfo = chains.find(({id, namespace}) => id === chainId && namespace === namespace_);
      const maxTransfer = (await (substrateProvider || evmProvider)?.getMaxTransfer( '0', senderAccount.address, DEFAULT_ADDRESS));
      if(!maxTransfer) {
        setOnError(true);
        return;
      }
      const maxTransferBN = new BN(maxTransfer);
      setAvailableBalance(
        {
          symbol: chainInfo?.token || ( wallet.type === 'evm' ? 'ETH' : 'DOT') ,
          value:  maxTransferBN.gt(BN_ZERO) ?  maxTransfer : '0',
          decimals: chainInfo?.decimal || ( wallet.type === 'evm' ? 18 : 10)
        }
      )
      setOnReadyFreeBalance(true);
    }catch (e) {
      setOnError(true)
      return ;
    }



  }, [ wallet?.chains[0], substrateProvider, evmProvider, senderAccount.address])

  useEffect(() => {
    checkActive(modalId) && getMaxTransfer().then(r => {});
  }, [checkActive(modalId), wallet?.chains[0].id, senderAccount.address]);



  const [form] = Form.useForm<TransferParams>();
  const formDefault = useMemo((): TransferParams => defaultData
  , [defaultData]);

  const transferAmount = useWatchTransaction('value', form, defaultData);
  const to = useWatchTransaction('to', form, defaultData);


  const validateRecipientAddress = useCallback(async (rule: Rule, _recipientAddress: string): Promise<void> => {

    if (!_recipientAddress) {
      return Promise.reject('Recipient address is required');
    }

    if (!isAddress(_recipientAddress)) {
      return Promise.reject('Invalid recipient address');
    }

    if((wallet?.type === 'evm' && !isEthereumAddress(_recipientAddress))
      || (wallet?.type === 'substrate' && isEthereumAddress(_recipientAddress))){
      setValidateTo( false)
      return Promise.reject('Invalid recipient address type');
    }

    if(_recipientAddress === senderAccount.address) {
      setValidateTo( false)
      return Promise.reject('The receiving address and sending address must be different')
    }

    return Promise.resolve().then(() => {
      setValidateTo(true);

      return Promise.resolve()
    });
  }, [form, wallet, senderAccount]);


  const validateAmount = useCallback(async (rule: Rule, amount: string): Promise<void> => {
    if(!wallet ) return Promise.reject('Disconnected wallet');

    if (!isAddress(to)) {
      setValidateValue(false)
      return Promise.reject('Invalid recipient address');
    }

    if((wallet?.type === 'evm' && !isEthereumAddress(to))
      || (wallet?.type === 'substrate' && isEthereumAddress(to))){
      setValidateValue(false)
      return Promise.reject('Invalid recipient address type');
    }

    if (!amount || !amount.trim()) {
      setValidateValue(false)
      return Promise.reject('Amount is required');
    }


    if(!isValidInput(amount)){
      setValidateValue(false)
      return Promise.reject('Amount is invalid')
    }


    const { namespace: namespace_, id: chainId } = wallet?.chains[0]
    const chainInfo = chains.find(({id, namespace}) => id === chainId && namespace === namespace_)
    if(substrateProvider && chainInfo){
      const isAvailableAmount = await substrateProvider.isAvailableAmount(getOutputValuesFromString(amount, chainInfo.decimal || 10), senderAccount.address, to);
      if(!isAvailableAmount) {
        setValidateValue(false)
        return Promise.reject(`You don't have enough balance to proceed`)
      }
    }



    if(evmProvider && chainInfo){
      const isAvailableAmount = await evmProvider.isAvailableAmount(getOutputValuesFromString(amount, chainInfo.decimal || 18), senderAccount.address, to);
      if(!isAvailableAmount) {
        setValidateValue(false)
        return Promise.reject(`You don't have enough balance to proceed`)
      }
    }

    return Promise.resolve().then(() => {
      setValidateValue(true);

      return Promise.resolve()
    });
  }, [senderAccount, to, substrateProvider, evmProvider, wallet?.chains[0], availableBalance]);



  const onCloseModal = useCallback(() => {
    setAvailableBalance(undefined);
    inactiveModal(modalId);
    form.resetFields(['to', 'value']);
  }, [ inactiveModal, form])

  const onValuesChange: FormCallbacks<TransferParams>['onValuesChange'] = useCallback(
    (part: Partial<TransferParams>, values: TransferParams) => {
      const validateField: string[] = [];
      if(! wallet) return;
      const {namespace: namespace_, id: chainId } = wallet.chains[0]
      const chainInfo = chains.find(({id, namespace}) => id === chainId && namespace === namespace_);
      if(!chainInfo) return;

      if(part.value){
        let value= values.value;
        const maxLength = getMaxLengthText(value, chainInfo.decimal || 10);

        if (maxLength && value.length > maxLength) {
          value = value.slice(0, maxLength);
        }

        value = value.replace(/[^0-9.]/g, '');
        setValidateValue(false);
        form.setFieldValue('value', value);
      }

      if(part.to) {
        setValidateTo(false)
        form.setFieldValue('to', values.to);
      }

      if (validateField.length) {
        form.validateFields(validateField).catch(() => {});
      }

    },
    [form]
  );



  // Submit transaction
  const onSubmit: FormCallbacks<TransferParams>['onFinish'] = useCallback(async (values: TransferParams) => {
    setLoading(true);
    const {   to, value } = values;
    let blockHash = '';
    if(!wallet) return;


    try{
      const {namespace: namespace_, id: chainId } = wallet.chains[0]
      const chainInfo = chains.find(({id, namespace}) => id === chainId && namespace === namespace_);
      if(!chainInfo) return;

      const amount = getOutputValuesFromString(value, chainInfo.decimal || 18);

      if(wallet?.type === "evm"){
        await evmProvider?.sendTransaction(senderAccount.address, to, amount )
        evmProvider?.transactionState.on('transaction-success', (blockHash: string) => blockHash !== '' && onCloseModal())
      }else{

        const getSigner = async ()=>{
          const provider = wallet.provider as SubstrateProvider;
          if(wallet.label === 'Ledger') {
            wallet.signer = await substrateProvider?.getLedgerSigner(senderAccount.address, provider)
          }
          if( wallet.label === 'WalletConnect') {
            wallet.signer = await substrateProvider?.getWCSigner(senderAccount.address, provider);
          }
          if(wallet.label === 'Polkadot Vault'){
            wallet.signer = await substrateProvider?.getQrSigner(senderAccount.address, provider, chainId);
          }
          return substrateProvider?.sendTransaction(
            senderAccount.address,
            to,
            wallet.signer,
            amount
          );
        }

        await substrateProvider?.isReady();
        await getSigner();
        substrateProvider?.transactionState.on('transaction-success', (blockHash: string) => blockHash !== '' && onCloseModal())
      }
      setLoading(false)
    }catch (e) {}
  }, [wallet, chains, senderAccount, evmProvider, substrateProvider]);

  useEffect(() => {
    if(!(wallet && wallet.accounts && wallet.accounts.length > 0)){
      substrateProvider?.transactionState.removeAllListeners('transaction-success')
      evmProvider?.transactionState.removeAllListeners('transaction-success')
    }
  }, [wallet, substrateProvider, evmProvider]);

  const isValidInput = useCallback((input: string) => {
    return !(isNaN(parseFloat(input)) || !input.match(/^-?\d*(\.\d+)?$/));
  }, []);

   const getInputValuesFromString = useCallback((input: string, power: number) => {
    const intValue = input.split('.')[0];
    let valueBigN = new BigN(isValidInput(intValue) ? intValue : '0');

    valueBigN = valueBigN.div(new BigN(10).pow(power));

    return valueBigN.toFixed();
  }, []);

   const getOutputValuesFromString = useCallback((input: string, power: number) => {
    if (!isValidInput(input)) {
      return '';
    }

    let valueBigN = new BigN(input);

    valueBigN = valueBigN.times(new BigN(10).pow(power));

    return valueBigN.toFixed().split('.')[0];
  }, []);

   const suffixAmountInput = useMemo(()=>{
     if(!wallet) return <></>
     const { namespace: namespace_, id: chainId } = wallet.chains[0]
     const chainInfo = chains.find(({id, namespace}) => id === chainId && namespace === namespace_);

     return(
      <span className={'__amount-token'}>{chainInfo?.token}</span>
     )

   }, [wallet, chains])
  return (
    <BaseModal
      id={modalId}
      title={'Transaction'}
      closable={true}
      maskClosable={false}
      onCancel={onCloseModal}
      className={CN(className, 'transaction-modal')}
      fullSizeOnMobile={true}
    >
      <div className={'__transaction-content'}>
        <Form
          className={'form-container form-space-sm'}
          form={form}
          onValuesChange={onValuesChange}
          initialValues={formDefault}
        >
          <Form.Item
            className={'__account-address-input'}
            name={'from'}
          >
            <div className={'__address-input-container'}>
              <label className={'__address-input-label'}>Send from</label>
              <AccountBriefInfo
                account={senderAccount}
                className={'__address-input-content'}
                isDetail={true}
              />
            </div>
          </Form.Item>

          <Form.Item
            name={'to'}
            rules={[
              {
                validator: validateRecipientAddress
              }
            ]}
            statusHelpAsTooltip={true}
            validateTrigger='onBlur'
          >
            <Input
              label={'Send to'}
              className={'__account-address-input'}
              placeholder={'Account address'}
              onBlur={form.submit}
            />
          </Form.Item>

          <Form.Item
            name={'value'}
            rules={[
              {
                validator: validateAmount
              }
            ]}
            statusHelpAsTooltip={true}
            validateTrigger='onBlur'
          >
            <Input
              placeholder={'Amount'}
              className={'__amount-transfer-input'}
              onBlur={form.submit}
              tooltip={'Amount'}
              suffix={suffixAmountInput}
            />
          </Form.Item>

            <div className={'__balance-transferable-item'}>
              {

                  onError ? <span className={'__label-error-balance-transferable'}>Unable to get balance. Please re-enable the network</span>
                    :
                    <>
                      <span className='__label-balance-transferable'>Sender available balance:</span>
                      {
                        availableBalance && onReadyFreeBalance?
                          <Number
                            decimal={availableBalance.decimals}
                            decimalColor={token.colorTextTertiary}
                            intColor={token.colorTextTertiary}
                            size={14}
                            suffix={availableBalance.symbol}
                            unitColor={token.colorTextTertiary}
                            value={availableBalance.value}
                          /> :
                          <ActivityIndicator size={14} />
                      }
                    </>
              }
          </div>
        </Form>
      </div>
      <div className={'__transaction-footer'}>
        <Button
          disabled={!validateTo || !validateValue}
          icon={(
            <Icon
              phosphorIcon={PaperPlaneTilt}
              weight={'fill'}
            />
          )}
          loading={loading}
          onClick={() => onSubmit({from: senderAccount.address, value: transferAmount, to })}
          block={true}
        >
              Transfer
        </Button>
      </div>
    </BaseModal>
  )
}



const TransactionModal = styled(Component)(({ theme: {token} }) => {
  return ({
    '.__brief': {
      paddingLeft: token.padding,
      paddingRight: token.padding,
      marginBottom: token.marginMD
    },

    '.form-row': {
      gap: 8
    },

    '.__address-input-container': {
      backgroundColor: token.colorBgInput,
      borderRadius: 8,
      border: '2px solid transparent',

      '.__address-input-content': {
        backgroundColor: 'transparent',
        outline: 'none',
        padding: 0,
        flexGrow: 1,
        fontWeight: 'inherit',
        height: 48,
        paddingBottom: token.paddingSM,
        paddingTop: token.paddingSM,
        marginLeft: token.marginSM
      },

      '.__address-input-label': {
        fontSize: token.fontSizeSM,
        lineHeight: token.lineHeightSM,
        color: token.colorTextLight4,
        paddingLeft: token.paddingSM,
        paddingRight: token.paddingSM,
        paddingTop: 4,
        top: 4,
        position: 'relative'
      },

      '&:hover': {
        border: '2px solid',
        borderColor: token.colorPrimaryBorderHover,
      }
    },

    '.middle-item': {
      marginBottom: token.marginSM
    },

    '.__transaction-footer': {
      marginTop: token.marginXXL
    },

    '.__amount-token': {
      color: token.colorSuccessText,
      marginRight: token.marginSM
    },

  '.__amount-transfer-input::-webkit-outer-spin-button, .__amount-transfer-input::-webkit-inner-spin-button ': {
      '-webkit-appearance': 'none',
      margin: 0
    },

    '.__amount-transfer-input': {
      '-moz-appearance': 'textfield'
    },
    '.__balance-transferable-item': {
      display: 'flex',
      flexWrap: 'wrap',
      color: token.colorTextTertiary,

      '.__label-balance-transferable, .__label-error-balance-transferable': {
        marginRight: 3
      },
      '.__label-error-balance-transferable': {
        color: token.colorError,
        fontWeight: 600
      }
    }

  });
});

export default TransactionModal;
