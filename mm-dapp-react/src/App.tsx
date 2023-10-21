import './App.css';
import { useState, useEffect } from 'react';
import {formatBalance, formatChainAsNum} from './utils';
import detectEthereumProvider from '@metamask/detect-provider';

const App = () => {
  const [hasProvider, setHasProvider] = useState<boolean | null>(null);
  const initialState = {accounts: [], balance:"", chainId:""};
  const [wallet, setWallet] = useState(initialState);

  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const refreshAccounts = (accounts:any) => {
      if (accounts.length > 0){
        updateWallet(accounts);
      } else {
        setWallet(initialState);
      }
    }

    const refreshChain = (chainId: any) => {
      setWallet(() => ({...wallet, chainId}))
    }

    const getProvider = async () => {
      const provider = await detectEthereumProvider({silent:true});
      setHasProvider(Boolean(provider));

      if (provider) {
        const accounts = await window.ethereum.request(
          { method: 'eth_accounts'}
        );

        refreshAccounts(accounts);
        window.ethereum.on('accountsChanged', refreshAccounts);
        window.ethereum.on('chainChanged', refreshChain);
      }
    }

    getProvider();
    return () => {
      window.ethereum?.removeListener('accountsChanged', refreshAccounts);
      window.ethereum?.removeListener('chainChanged', refreshChain);
    }
  }, []);

  const updateWallet = async (accounts: any) => {
    const balance = formatBalance(await window.ethereum!.request({
      method: 'eth_getBalance',
      params: [accounts[0], 'latest'],
    }));

    const chainId = await window.ethereum!.request({
      method:'eth_chainId',
    });

    setWallet({accounts, balance, chainId})
  }

  const handleConnect = async () => {
    setIsConnecting(true);
    await window.ethereum.request({
      method: 'eth_requestAccounts',
    })
    .then((accounts:any) => {
      setError(false);
      updateWallet(accounts);
    })
    .catch((err:any) => {
      setError(true);
      setErrorMessage(err.message);
    })

    setIsConnecting(false);
  }

  return (
    <div className='App'>
      <h2>Injected Provider { hasProvider ? 'DOES' : 'DOES NOT'} Exist </h2>

      {window.ethereum?.isMetaMask && wallet.accounts.length < 1 && 
        <button onClick={handleConnect}>Connect Metamask</button>
      }

      {wallet.accounts.length > 0 &&
      <>
        <div>Wallet accounts: {wallet.accounts[0]}</div>
        <div>Wallet balance: {wallet.balance}</div>
        <div>Hex chain id: {wallet.chainId}</div>
        <div>Number chain id: {formatChainAsNum(wallet.chainId)}</div>
      </>
      }
      { error && (
          <div>
            <strong>Error:</strong> {errorMessage}
          </div>
        )
      }
    </div>
  )
}

export default App