import Head from "next/head";
import Image from "next/image";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { useState, useEffect, useRef } from "react";
import { BigNumber, Contract, providers, utils } from "ethers";
import Web3Modal from "web3modal";
import {
  ICO_Contract_Address,
  CryptoDev_Contract_Address,
  CryptoDev_Contract_abi,
  ICO_Contract_abi,
} from "../constant/index";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  // creating zero big number
  const zero = BigNumber.from(0);

  const [walletConnected, setWalletConnected] = useState(false);

  const [loading, setLoading] = useState(false);

  // tokensToBeClaimed keeps track of the number of tokens that can be claimed
  // based on the Crypto Dev NFT's held by the user for which they havent claimed the tokens

  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);

  // balanceOfCryptoDevTokens keeps track of number of Crypto Dev tokens owned by an address
  const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] =
    useState(zero);

  const [tokenAmount, setTokenAmount] = useState(0);

  const [isOwner, setIsOwner] = useState(false);

  const [tokensMinted, setTokensMinted] = useState(zero);

  const web3ModalRef = useRef();

  const getProviderorSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Change the network to Goerli");
      // throw new Error("Change network to Goerli");
    }
    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  // checks the balance of tokens that can be claimed by the user

  const getTokensToBeClaimed = async () => {
    try {
      const provider = await getProviderorSigner();
      const cryptoDevContract = new Contract(
        CryptoDev_Contract_Address,
        CryptoDev_Contract_abi,
        provider
      );
      // console.log(cryptoDevContract)
      const ICOContract = new Contract(
        ICO_Contract_Address,
        ICO_Contract_abi,
        provider
      );
      // console.log(ICOContract);
      const signer = await getProviderorSigner(true);
      const address = signer.getAddress();

      const balance = await cryptoDevContract.balanceOf(address);
      setBalanceOfCryptoDevTokens(balance);
      if (balance == zero) {
        setTokensToBeClaimed(zero);
      } else {
        var amount = 0;
        for (var i = 0; i < balance; i++) {
          const tokenId = await cryptoDevContract.tokenOfOwnerByIndex(
            address,
            i
          );
          const claimed = await ICOContract.tokenIdsClaimed(tokenId);
          if (!claimed) {
            amount++;
          }
        }
        setTokensToBeClaimed(BigNumber.from(amount));
        console.log("hello", tokensToBeClaimed.toNumber());
      }
    } catch (error) {
      console.log(error);
      setBalanceOfCryptoDevTokens(zero);
    }
  };

  // checks the balance of Crypto Dev Tokens's held by an address
  const getBalanceOfCryptoDevTokens = async () => {
    try {
      const provider = await getProviderorSigner();
      const ICOcontract = new Contract(
        ICO_Contract_Address,
        ICO_Contract_abi,
        provider
      );
      const signer = await getProviderorSigner(true);
      const address = await signer.getAddress();
      const balance = await ICOcontract.balanceOf(address);
      console.log(balance);
      setBalanceOfCryptoDevTokens(balance);
    } catch (error) {
      console.log(error);
      setBalanceOfCryptoDevTokens(zero);
    }
  };

  const mintCryptoDevToken = async (amount) => {
    try {
      const signer = await getProviderorSigner(true);
      const ICOcontract = new Contract(
        ICO_Contract_Address,
        ICO_Contract_abi,
        signer
      );
      const value = 0.001 * amount;
      const tx = await ICOcontract.mint(amount, {
        value: utils.parseEther(value.toString()),
      });
      setLoading(true);
      await tx.wait();
      setLoading(false);
      alert("Sucessfully mint Crypto Dev Tokens");
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (error) {
      console.log(error);
      alert("insufficent funds");
    }
  };

  const claimCryptoDevTokens = async () => {
    try {
      const signer = await getProviderorSigner(true);
      const ICOcontract = new Contract(
        ICO_Contract_Address,
        ICO_Contract_abi,
        signer
      );

      const tx = await ICOcontract.claim();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      alert("Sucessfully claimed Crypto Dev Tokens");
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (error) {
      console.log(error);
    }
  };

  const getTotalTokensMinted = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderorSigner();
      // Create an instance of token contract
      const tokenContract = new Contract(
        ICO_Contract_Address,
        ICO_Contract_abi,
        provider
      );
      // Get all the tokens that have been minted
      const _tokensMinted = await tokenContract.totalSupply();
      console.log(_tokensMinted);
      setTokensMinted(_tokensMinted);
    } catch (err) {
      console.error(err);
    }
  };

  const getOwner = async () => {
    try {
      const provider = await getProviderorSigner();
      const tokenContract = new Contract(
        ICO_Contract_Address,
        ICO_Contract_abi,
        provider
      );
      // call the owner function from the contract
      const _owner = await tokenContract.owner();
      // we get signer to extract address of currently connected Metamask account
      const signer = await getProviderorSigner(true);
      // Get the address associated to signer which is connected to Metamask
      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const connectWallet = async () => {
    try {
      console.log(tokensToBeClaimed);
      const result = await getProviderorSigner(true);
      console.log(result);
      setWalletConnected(true);
      await getTotalTokensMinted();
      await getBalanceOfCryptoDevTokens();
      await getTokensToBeClaimed();
      console.log(tokensToBeClaimed.toNumber());
      await getOwner();
      // await getOwner();
    } catch (error) {
      console.log(error);
    }
  };

  const withdrawCoins = async () => {
    try {
      const signer = await getProviderorSigner(true);
      const contract = new Contract(
        ICO_Contract_Address,
        ICO_Contract_abi,
        signer
      );
      const tx = await contract.withDraw();
      setLoading(true);
      await tx.wait();
      setLoading(false);
    } catch (error) {
      console.log(error);
      alert("Something went wrong")
    }
  };
  useEffect(() => {
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
    }
  }, [walletConnected]);

  const renderButton = () => {
    if (loading) {
      return (
        <div>
          <button className={styles.button}>Loading...</button>
        </div>
      );
    }
    // If tokens to be claimed are greater than 0, Return a claim button
    if (tokensToBeClaimed > 0 ) {
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed.toNumber() } Tokens can be claimed!
          </div>
          <button className={styles.button} onClick={claimCryptoDevTokens}>
            Claim Tokens
          </button>
        </div>
      );
    }
    return (
      <div style={{ display: "flex-col" }}>
        <div>
          <input
            type="number"
            placeholder="Amount of Tokens"
            // BigNumber.from converts the `e.target.value` to a BigNumber
            onChange={(e) => setTokenAmount(e.target.value)}
            className={styles.input}
          />
        </div>
        <button
          className={styles.button}
          disabled={!(tokenAmount > 0)}
          onClick={() => mintCryptoDevToken(BigNumber.from(tokenAmount))}
        >
          Mint Tokens
        </button>
      </div>
    );
  };
  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="ICO-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs ICO!</h1>
          <div className={styles.description}>
            You can claim or mint Crypto Dev tokens here
          </div>
          {walletConnected ? (
            <div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                You have minted {utils.formatEther(balanceOfCryptoDevTokens)}{" "}
                Crypto Dev Tokens
              </div>

              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                Overall {utils.formatEther(tokensMinted)}/10000 have been
                minted!!!
              </div>
              {renderButton()}
              {isOwner ? (
                <div>
                  {loading ? (
                    <button className={styles.button}>Loading...</button>
                  ) : (
                    <button className={styles.button} onClick={withdrawCoins}>
                      Withdraw Coins
                    </button>
                  )}
                </div>
              ) : (
                ""
              )}
              {/* Display additional withdraw button if connected wallet is owner */}
              {/* {isOwner ? (
                  <div>
                  {loading ? <button className={styles.button}>Loading...</button>
                           : <button className={styles.button} onClick={withdrawCoins}>
                               Withdraw Coins
                             </button>
                  }
                  </div>
                  ) : ("")
                } */}
            </div>
          ) : (
            <button onClick={connectWallet} className={styles.button}>
              Connect your wallet
            </button>
          )}
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}
