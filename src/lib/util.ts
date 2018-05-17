import * as Arc from "@daostack/arc.js";
import { BigNumber } from "bignumber.js";
import { IEventSubscription } from "@daostack/arc.js";

// haven’t figured out how to get web3 typings to properly expose the Web3 constructor.
// v1.0 may improve on this entire Web3 typings experience
/* tslint:disable-next-line:no-var-requires */
const Web3 = require("web3");

export default class Util {

  public static fromWei(amount: BigNumber): BigNumber {
    const web3 = new Web3();
    return web3.fromWei(amount, "ether");
  }

  // TODO: should probably return a BigNumber instead of a string.
  public static toWei(amount: number): string {
    const web3 = new Web3();
    return web3.toWei(amount, "ether");
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
        return "Unknown network"
    }
  }

  /**
   * Performs an Arc.js action.
   * @param topic Arc.js TransactionService topic to listen to for pending transactions
   * @param action Function that will invoke the action to perform
   * @param opts options to pass to @f
   * @param onPending callback that's called on every pending transaction
   * @param onError callback that's called upon any error / failed transaction
   */
  public static async performAction<T>(
    topic: string,
    action: (opts: any) => Promise<T>,
    opts: any,
    onPending: (txCount: number) => any
  ): Promise<T> {

    let sub: IEventSubscription;
    const unsubscribe = () => {
      if (sub) {
        // workaround to get last transaction notification before unsubscribing.
        setTimeout(sub.unsubscribe, 0);
      }
    }

    try {
      const key = Arc.TransactionService.generateInvocationKey(`${topic}.pendingTransactions`);
      sub = Arc.TransactionService.subscribe(topic, (topic, info) => {
        if (info.options.key === key && info.tx) {
          onPending(info.txCount);
        }
      });
      const result = await action({ ...opts, key });
      unsubscribe();
      return result;
    } catch (e) {
      console.error(e);
      unsubscribe();
      throw e;
    }
  }
}
