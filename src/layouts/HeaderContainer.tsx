import * as Arc from "@daostack/arc.js";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { connect } from "react-redux";
import { Link, RouteComponentProps } from "react-router-dom";
import { CSSTransition } from "react-transition-group";

import * as web3Actions from "actions/web3Actions";
import * as operationsActions from "actions/operationsActions";
import { IRootState } from "reducers";
import { IDaoState, emptyAccount } from "reducers/arcReducer";
import { IWeb3State } from "reducers/web3Reducer";

import AccountBalance from "components/Account/AccountBalance";
import AccountImage from "components/Account/AccountImage";

import * as css from "./App.scss";
import Util from "lib/util";
import Tooltip from "rc-tooltip";
import { OperationsStatus } from "reducers/operations";
import ReputationView from "components/Account/ReputationView";
import { FilterResult } from "web3";
import promisify = require("es6-promisify");

interface IStateProps {
  dao: IDaoState;
  web3State: IWeb3State;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    dao: state.arc.daos[ownProps.daoAddress],
    web3State: state.web3,
  };
};

interface IDispatchProps {
  changeAccount: typeof web3Actions.changeAccount;
  onApprovedStakingGens: typeof web3Actions.onApprovedStakingGens;
  onEthBalanceChanged: typeof web3Actions.onEthBalanceChanged;
  onGenBalanceChanged: typeof web3Actions.onGenBalanceChanged;
  onGenStakingAllowanceChanged: typeof web3Actions.onGenStakingAllowanceChanged;
  showOperation: typeof operationsActions.showOperation;
}

const mapDispatchToProps = {
  changeAccount: web3Actions.changeAccount,
  onApprovedStakingGens: web3Actions.onApprovedStakingGens,
  onEthBalanceChanged: web3Actions.onEthBalanceChanged,
  onGenBalanceChanged: web3Actions.onGenBalanceChanged,
  onGenStakingAllowanceChanged: web3Actions.onGenStakingAllowanceChanged,
  showOperation: operationsActions.showOperation
};

type IProps = IStateProps & IDispatchProps;

const Fade = ({ children, ...props }: any) => (
  <CSSTransition
    {...props}
    timeout={1000}
    classNames={{
     enter: css.fadeEnter,
     enterActive: css.fadeEnterActive,
     exit: css.fadeExit,
     exitActive: css.fadeExitActive,
    }}
  >
    {children}
  </CSSTransition>
);

class HeaderContainer extends React.Component<IProps, null> {

  private ethBalanceWatcher: FilterResult;
  private approvalWatcher: FilterResult;

  constructor(props: IProps) {
    super(props);

    this.copyAddress = this.copyAddress.bind(this);
  }

  public async componentDidMount() {
    const { web3State: { ethAccountAddress }, onApprovedStakingGens, onEthBalanceChanged, onGenBalanceChanged, onGenStakingAllowanceChanged } = this.props;
    const web3 = await Arc.Utils.getWeb3();
    const votingMachineInstance = await Arc.GenesisProtocolFactory.deployed();
    const stakingTokenAddress = await votingMachineInstance.contract.stakingToken();
    const stakingToken = await (await Arc.Utils.requireContract("StandardToken")).at(stakingTokenAddress) as any;

    this.ethBalanceWatcher = web3.eth.filter('latest');
    this.ethBalanceWatcher.watch(async (err, res) => {
      if (!err && res) {
        const newEthBalance = Util.fromWei(await promisify(web3.eth.getBalance)(ethAccountAddress)).toNumber();
        onEthBalanceChanged(newEthBalance);
        const newGenBalance = Util.fromWei(await stakingToken.balanceOf(ethAccountAddress)).toNumber();
        onGenBalanceChanged(newGenBalance);
        const newGenStakingAllowance = Util.fromWei(await stakingToken.allowance(ethAccountAddress, votingMachineInstance.address)).toNumber();
        onGenStakingAllowanceChanged(newGenStakingAllowance);
      }
    });

    // Watch for approval of GEN token tranfers
    this.approvalWatcher = stakingToken.Approval({ owner: ethAccountAddress }, { fromBlock: "latest" });
    this.approvalWatcher.watch((error: any, result: any) => {
      if (!error && result) {
        onApprovedStakingGens(result.args.value.toNumber());
      }
    });
  }

  public componentWillUnmount() {
    this.ethBalanceWatcher.stopWatching();
    this.approvalWatcher.stopWatching();
  }

  public copyAddress() {
    const { showOperation, web3State: { ethAccountAddress } } = this.props;

    // Copy the address to clipboard
    Util.copyToClipboard(ethAccountAddress);

    showOperation(OperationsStatus.Success, `Copied to clipboard!`, {totalSteps: 1});
  }

  public handleChangeAccount = (e: any) => {
    const selectElement = ReactDOM.findDOMNode(this.refs.accountSelectNode) as HTMLSelectElement;
    const newAddress = selectElement.value;
    this.props.changeAccount(newAddress);
  }

  public render() {
    const { dao, web3State } = this.props;

    let member = dao ? dao.members[web3State.ethAccountAddress] : false;
    if (!member) {
      member = {...emptyAccount };
    }

    const accountOptionNodes = web3State.accounts.map((account: string) => (
      <option key={"account_" + account}>
        {account}
      </option>
    ));

    return(
      <div>
        <div className={css.notice}>
          <div>
            <img src="/assets/images/Icon/Alert.svg"/>
            Alchemy and the Genesis Alpha arc release are in Alpha. There will be BUGS! All reputation accumulated will be reset. We don't guarantee complete security. <b>**Play at your own risk**</b>
          </div>
          <a className={css.reportBugs} href="mailto:bugs@daostack.io">REPORT BUGS</a>
        </div>
        <nav className={css.header}>
          <Link className={css.alchemyLogo} to="/"><img src="/assets/images/alchemy-logo.svg"/></Link>
          <span className={css.version}><b>Alchemy {Util.networkName(web3State.networkId)}</b> <span> v.{VERSION}</span></span>
          <div className={css.accountInfo}>
            <div className={css.holdings}>
              <div>
                <span className={css.holdingsLabel}>Current account: <b style={{cursor: 'pointer'}} onClick={this.copyAddress}>{web3State.ethAccountAddress.slice(0, 8)}...(copy)</b></span>
                <select onChange={this.handleChangeAccount} ref="accountSelectNode" defaultValue={web3State.ethAccountAddress}>
                  {accountOptionNodes}
                </select>
              </div>
              <div>
                <span className={css.holdingsLabel}>Wallet: </span>
                <AccountBalance tokenSymbol="ETH" balance={web3State.ethAccountBalance} accountAddress={web3State.ethAccountAddress} />&nbsp;&amp;&nbsp;
                <AccountBalance tokenSymbol="GEN" balance={web3State.currentAccountGenBalance} accountAddress={web3State.ethAccountAddress} />
                <br/>
                {web3State.currentAccountGenStakingAllowance} GEN approved for staking
                { dao
                  ? <div>
                      <AccountBalance tokenSymbol={dao.tokenSymbol} balance={member.tokens} accountAddress={web3State.ethAccountAddress} />
                      &nbsp; | &nbsp;
                      <ReputationView daoName={dao.name} totalReputation={dao.reputationCount} reputation={member.reputation}/>
                    </div>
                  : ""
                }
              </div>
            </div>
            <button className={css.profileLink}>
              <AccountImage accountAddress={web3State.ethAccountAddress} />
            </button>
          </div>
        </nav>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(HeaderContainer);
