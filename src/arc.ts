// const Web3 = require("web3");
import { Address, Arc } from "@daostack/client";
import { NotificationStatus } from "reducers/notifications";
import { Observable } from "rxjs";
import { getNetworkName } from "./lib/util";

const settings = {
  dev: {
    graphqlHttpProvider: "http://127.0.0.1:8000/subgraphs/name/daostack",
    graphqlWsProvider: "ws://127.0.0.1:8001/subgraphs/name/daostack",
    web3Provider: "ws://127.0.0.1:8545",
    ipfsProvider: "localhost",
    contractAddresses: getContractAddresses("private")
  },
  staging: {
    graphqlHttpProvider: "https://rinkeby.subgraph.daostack.io/subgraphs/name/v17",
    graphqlWsProvider: "wss://ws.rinkeby.subgraph.daostack.io/subgraphs/name/v17",
    web3Provider: `wss://rinkeby.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2`,
    ipfsProvider: {
      "host": "rinkeby.subgraph.daostack.io",
      "port": "443",
      "protocol": "https",
      "api-path": "/ipfs/api/v0/"
    },
    contractAddresses: getContractAddresses("rinkeby")
  },
  production: {
    graphqlHttpProvider: "https://subgraph.daostack.io/subgraphs/name/v17",
    graphqlWsProvider: "wss://ws.subgraph.daostack.io/subgraphs/name/v17",
    web3Provider: `wss://mainnet.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2`,
    ipfsProvider: {
      "host": "subgraph.daostack.io",
      "port": "443",
      "protocol": "https",
      "api-path": "/ipfs/api/v0/"
    },
    contractAddresses: getContractAddresses("mainnet")
  }
};

/**
 * get the contract address from the @daostack/migration repository.
 * These may be out of date: consider using getContractAddressesFromSubgraph instead
 * @param  key the network where the contracts are deployed: one of private, rinkeby, mainnet
 * @return   an Array mapping contract names to addresses
 */
export function getContractAddresses(key: "private"|"rinkeby"|"mainnet") {
  const deployedContractAddresses = require("@daostack/migration/migration.json");

  const addresses = {
      ...deployedContractAddresses[key]
   };
  if (!addresses || addresses === {}) {
    throw Error(`No addresses found, does the file at "@daostack/migration/migration.json" exist?`);
  }
  return addresses.base;
}

/**
 * check if the web3 connection is ready to send transactions, and warn the user if it is not
 *
 * @param showNotification the warning will be sent using the showNotification function;
 *    it will use `alert()` if no such function is provided
 * @return the web3 connection, if everything is fine
 */
export async function checkWeb3ProviderAndWarn(showNotification?: any): Promise<boolean> {
  try {
    return checkWeb3Provider();
  } catch (err) {
    const msg =  `${err.message}`;
    if (showNotification) {
      showNotification(NotificationStatus.Failure, msg);
    } else {
      alert(msg);
    }
  }
}

/**
 * Checks if the web3 Provider is ready to send transactions and configured as expected;
 * throws an Error if something is wrong, returns the web3 connection if that is ok
 * @return
 */
export function checkWeb3Provider() {
  let expectedNetworkName;
  switch (process.env.NODE_ENV) {
    case "development": {
      expectedNetworkName = "ganache";
      break;
    }
    case "staging": {
      expectedNetworkName = "rinkeby";
      break;
    }
    case  "production": {
      expectedNetworkName = "main";
      break;
    }
    default: {
      throw new Error(`Unknown NODE_ENV: ${process.env.NODE_ENV}`);
    }
  }

  try {
    const web3Provider = getMetaMask();
    const networkId = web3Provider.networkVersion;
    const networkName = getNetworkName(networkId);
    if (networkName === expectedNetworkName) {
      console.log(`Connected to ${networkName} in ${process.env.NODE_ENV} environment - this is great`);
      return web3Provider;
    } else {
      const msg = `Please connect to "${expectedNetworkName}"`;
      throw new Error(msg);
    }
  } catch (err) {
    if (err.message.match(/enable metamask/i) && process.env.NODE_ENV === "development") {
      const msg = `No metamask connection found - we are in "development" environment, so this may be ok`;
      console.log(msg);
      return settings.dev.web3Provider;
    } else {
      throw err;
    }
  }
}

/**
 * get the current user from the web3 Provider
 * @return [description]
 */
export async function getCurrentAccountAddress(): Promise<Address> {
  // const ethereum = getMetaMask();
  // return ethereum.selectedAddress;
  const web3: any = getArc().web3;
  const accounts = await web3.eth.getAccounts();
  return accounts[0];
}

/**
 * check if a metamask instanse is available and an account is unlocked
 * @return [description]
 */
export function getMetaMask(): any {
  const ethereum = (<any> window).ethereum;
  if (!ethereum) {
    const msg = `Please install or enable metamask`;
    throw Error(msg);
  }
  return ethereum;
}

export async function enableMetamask(): Promise<any> {
  // check if Metamask account access is enabled, and if not, call the (async) function
  // that will ask the user to enable it
  const ethereum = getMetaMask();
  await ethereum.enable();
  return ethereum;
}

// get appropriate Arc configuration for the given environment
function getArcSettings(): any {
  let arcSettings: any;
  switch (process.env.NODE_ENV || "development") {
    case "development": {
      arcSettings = settings.dev;
      break;
    }
    case "staging" : {
      arcSettings = settings.staging;
      break;
    }
    case "production" : {
      arcSettings = settings.production;
      break;
    }
    default: {
      console.log(process.env.NODE_ENV === "development");
      throw Error(`Unknown NODE_ENV environment: "${process.env.NODE_ENV}"`);
    }
  }
  return arcSettings;
}

export function getArc(): Arc {
  // store the Arc instance in the global namespace on the 'window' object
  // (this is not best practice)
  if (typeof(window) !== "undefined" && (<any> window).arc) {
    return (<any> window).arc;
  } else {
    const arcSettings = getArcSettings();
    try {
      arcSettings.web3Provider = checkWeb3Provider();
    } catch (err) {
      // we could not get the web3 connection from metamask, so we use the default settings
      console.log(err.message);
    }

    console.log(`Found NODE_ENV "${process.env.NODE_ENV}", using the following settings for Arc`);
    console.log(arcSettings);
    console.log(`alchemy-server (process.env.API_URL): ${process.env.API_URL}`);
    const arc: Arc = new Arc(arcSettings);
    if (typeof(window) !== "undefined") {
      (<any> window).arc = arc;
    }
    return arc;
  }
}

// cf. https://github.com/MetaMask/faq/blob/master/DEVELOPERS.md#ear-listening-for-selected-account-changes
// Polling is Evil!
// TODO: check if this (new?) function can replace polling:
// https://metamask.github.io/metamask-docs/Main_Concepts/Accessing_Accounts
export function pollForAccountChanges(currentAccountAddress?: string, interval: number = 2000) {
  console.log("start polling for account");
  return Observable.create((observer: any) => {
    let prevAccount = currentAccountAddress;
    function emitIfNewAccount() {
      getCurrentAccountAddress()
        .then((account) => {
          if (prevAccount !== account) {
            observer.next(account);
            prevAccount = account;
          }
        })
        .catch((err) => { console.warn(err.message); });
    }

    emitIfNewAccount();
    const timeout = setInterval(emitIfNewAccount, interval);
    return() => clearTimeout(timeout);
  });
}
