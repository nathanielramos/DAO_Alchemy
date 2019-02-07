import * as Arc from "@daostack/arc.js";
import { Address } from '@daostack/client'
import { arc } from 'arc'
import { BigNumber } from "bignumber.js";
import promisify = require("es6-promisify");

// haven’t figured out how to get web3 typings to properly expose the Web3 constructor.
// v1.0 may improve on this entire Web3 typings experience
/* tslint:disable-next-line:no-var-requires */
const Web3 = require("web3");
const path = require('path')

export default class Util {

  public static fromWei(amount: BigNumber): number {
    return Number(arc.web3.utils.fromWei(arc.web3.utils.toBN(amount), "ether"))
  }

  public static toWei(amount: number): BigNumber {
    return new BigNumber(arc.web3.utils.toWei(amount.toString(), "ether"))
  }

  public static getBalance(account: Address) {
    return arc.web3.eth.getBalance(account)
  }

  public static networkName(id: number) {
    switch (id) {
      case 1:
        return "Mainnet"
      case 2:
        return "Morden"
      case 3:
        return "Ropsten"
      case 4:
        return "Rinkeby"
      case 42:
        return "Kovan"
      case 1512051714758:
        return "Ganache"
      default:
        return "Ganache"
    }
  }

  public static copyToClipboard(value: any) {
    const el = document.createElement('textarea');
    el.value = value;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }

  public static async getLatestBlock() {
    try {
      const web3 = await Arc.Utils.getWeb3();
      const getBlock = promisify(web3.eth.getBlock);
      return (await getBlock('latest')).number;
    } catch (err) {
      throw err
    }
  }

  public static trace<T>(x: T, ...args: any[]): T {
    // tslint:disable-next-line:no-console
    console.debug('trace', ...args, x);
    return x;
  }
}

export function getLocalContractAddresses() {
  const deployedContractAddresses = require(`../../config/migration.json`)

  const addresses = {
      ...deployedContractAddresses.private.base,
      // ...require(path).private.dao
   }
  console.log(addresses)
  if (!addresses || addresses === {}) {
      throw Error(`No addresses found, does the file at ${'../../config/migration.json'} exist?`)
    }
  return addresses
}
