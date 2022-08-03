import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import {providers, Contract, utils}from 'ethers';
import { useEffect, useState, useRef} from 'react'
import Web3Modal from 'web3modal'
import {NFT_CONTRACT_ABI,NFT_CONTRACT_ADDRESS} from '../constants'

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [numTokensMinted, setNumTokensMinted] = useState("");
  const web3ModalRef = useRef();

  const getNumMintedTokens = async() => {
    const provider = await getProviderOrSigner();
    const nftContract = new Contract(
      NFT_CONTRACT_ADDRESS,
      NFT_CONTRACT_ABI,
      provider
    );

  const numTokenIds = await nftContract.tokenIds();
  setNumTokensMinted(numTokenIds.toString());
  }

  const presaleMint = async() => {
    try {
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );

      const txn = await nftContract.presaleMint({
        value: utils.parseEther("0.01")
      })
      await txn.wait();
      window.alert("You successfully minted a CryptoDev!");
    } catch (error) {
      console.error(error);
    }
  }

  const publicMint = async() => {
    try {
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );

      const txn = await nftContract.mint({
        value: utils.parseEther("0.01")
      })
      await txn.wait();
      window.alert("You successfully minted a CryptoDev!");
    } catch (error) {
      console.error(error);
    }
  }
  
  const getOwner = async() => {
    try{
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      ); 

      const owner = await nftContract.owner();
      const userAddress = await signer.getAddress();

      if(owner.toLowerCase() === userAddress.toLowerCase()){
        setIsOwner(true);
      }
  }
    catch(error){
      console.error(error);
    }
  }

  const startPresale = async() => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      ); 
      const txn = await nftContract.startPresale();
      await txn.wait();
    } catch (error) {
      console.error(error)
    }
  }

  const checkIfPresaleStarted = async() => {
    try {
      const provider = await getProviderOrSigner();
      
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );
      
      const isPresaleStarted = await nftContract.presaleStarted();
      setPresaleStarted(isPresaleStarted);
      return isPresaleStarted;
    } catch (error) {
      console.error(error);
      return false
    }
  }

  const checkIfPresaleEnded = async() => {
    try {
      const provider = await getProviderOrSigner();
      
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );
      
      const presaleEndTime = nftContract.presaleEnded();
      const currentTimeInSeconds = Date.now() / 1000;
      const hasPresaleEnded = presaleEndTime.lt(
        Math.floor(currentTimeInSeconds)
      );
      setPresaleEnded(hasPresaleEnded);
    } catch (error) {
      console.error(error);
    }
  }
  const onPageLoad = async() => {
    await connectWallet();
    await getOwner();
    const presaleStarted = await checkIfPresaleStarted(); 
    if(presaleStarted){
      await checkIfPresaleEnded();
    }
    await getNumMintedTokens();

    setInterval(async()=>{
      await getNumMintedTokens();
    }, 5*1000);

    setInterval(async()=>{
      const presaleStarted = await checkIfPresaleStarted();
      if(presaleStarted){
        await checkIfPresaleEnded();
      }
    }, 5*1000);

  }

  const connectWallet = async() => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.error(error);
    }
    
  }

  const getProviderOrSigner = async(needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const {chainId} = await web3Provider.getNetwork();
    if(chainId!==4){
      window.alert("Please switch to Rinkeby Network");
      throw new Error("Incorrect Network");
    }

    if(needSigner){
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  }

  useEffect(()=>{
    if(!walletConnected){
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false
      });
      onPageLoad(); 
    }
  },[])

  const renderButton = () => {
    
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }
    if(loading){
      return (
        <div>
          <div className={styles.description}>loading ...</div>
        </div>
      );
    }
    if(isOwner && !presaleStarted){
      return (
        <div>
          <button onClick={startPresale} className={styles.button}>
            Start Presale
          </button>
        </div>
      );
    }
    if(!presaleStarted){
      return(
        <div>
          <div className={styles.description}>Presale has not started yet. Comeback later</div>
        </div>
      );
    }
    if(presaleStarted && !presaleEnded){
      return(
        <div>
          <div className={styles.description}>Presale has not started!! If your address is whitelisted, you can mint a CryptoDev</div>
          <button onClick={presaleMint} className={styles.button}>Presale Mint 🚀</button>
        </div>
      );
    }
    if(presaleEnded){
      return(
        <div>
          <div className={styles.description}>Presale has ended. You can mint a CryptoDev in public sale if any remain</div>
          <button onClick={publicMint} className={styles.button}>Public Mint 🚀</button>
        </div>
      );
    }
  }

  return (
    <div>
      <Head>
        <title>Crypto Devs NFT</title>
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to CryptoDevs NFT</h1>
          <div className={styles.description}>
            CryptoDevs NFT is a collection for developers in web3
          </div>
          <div className={styles.description}>
            {numTokensMinted}/20 have been minted already!
          </div>
          {renderButton()}
        </div>
        <img className={styles.images} src="/cryptodevs/3.svg"/>
      </div>
      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}
