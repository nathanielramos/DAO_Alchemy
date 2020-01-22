import { Address, IDAOState, IProposalOutcome, IProposalStage, IProposalState, Stake } from "@daostack/client";
import * as arcActions from "actions/arcActions";
import { enableWalletProvider } from "arc";

import BN = require("bn.js");
import * as classNames from "classnames";
import { formatTokens } from "lib/util";
import { ActionTypes, default as PreTransactionModal } from "components/Shared/PreTransactionModal";
import Tooltip from "rc-tooltip";
import * as React from "react";
import { connect } from "react-redux";
import { Modal } from "react-router-modal";
import { showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";

import * as css from "./StakeButtons.scss";

interface IState {
  pendingPrediction: number;
  showApproveModal: boolean;
  showPreStakeModal: boolean;
}

interface IExternalProps {
  proposal: IProposalState;
  beneficiaryProfile?: IProfileState;
  contextMenu?: boolean;
  currentAccountAddress?: Address;
  currentAccountGens: BN|null;
  currentAccountGenStakingAllowance: BN;
  dao: IDAOState;
  detailView?: boolean;
  expired?: boolean;
  historyView?: boolean;
  stakes: Stake[];
}

interface IDispatchProps {
  stakeProposal: typeof arcActions.stakeProposal;
  showNotification: typeof showNotification;
  approveStakingGens: typeof arcActions.approveStakingGens;
}

const mapDispatchToProps = {
  approveStakingGens: arcActions.approveStakingGens,
  stakeProposal: arcActions.stakeProposal,
  showNotification,
};

type IProps = IExternalProps & IDispatchProps;

class StakeButtons extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      pendingPrediction: null,
      showApproveModal: false,
      showPreStakeModal: false,
    };
  }

  public showApprovalModal = async (_event: any): Promise<void> => {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

    this.setState({ showApproveModal: true });
  }

  public closeApprovalModal = (_event: any): void => {
    this.setState({ showApproveModal: false });
  }

  public closePreStakeModal = (_event: any): void => {
    this.setState({ showPreStakeModal: false });
  }

  public showPreStakeModal = (prediction: number): (_event: any) => void => async (_event: any): Promise<void> => {
    if (!await enableWalletProvider( { showNotification: this.props.showNotification })) { return; }
    this.setState({ pendingPrediction: prediction, showPreStakeModal: true });
  }

  public handleCancelPreApprove = async (_event: any): Promise<void> => {
    this.setState({ showApproveModal: false });
  }

  public handleClickPreApprove = async (_event: any): Promise<void> => {
    if (!await enableWalletProvider( { showNotification: this.props.showNotification })) { return; }

    const { approveStakingGens } = this.props;
    approveStakingGens(this.props.proposal.votingMachine);
    this.setState({ showApproveModal: false });
  }

  private getStakeProposalAction = (stakeProposal: typeof arcActions.stakeProposal, proposal: IProposalState, pendingPrediction: number) =>
    (amount: number) => { stakeProposal(proposal.dao.id, proposal.id, pendingPrediction, amount); };

  public render(): RenderOutput {
    const {
      beneficiaryProfile,
      contextMenu,
      currentAccountAddress,
      currentAccountGens,
      currentAccountGenStakingAllowance,
      dao,
      detailView,
      expired,
      historyView,
      proposal,
      stakeProposal,
      stakes,
    } = this.props;

    const {
      pendingPrediction,
      showApproveModal,
      showPreStakeModal,
    } = this.state;

    let currentStake: Stake;
    let currentAccountPrediction = 0;
    if (stakes.length > 0) {
      currentStake = stakes[0];
    }
    if (currentStake) {
      currentAccountPrediction = currentStake.staticState.outcome;
    }

    const isPredicting = pendingPrediction !== null;

    if (showApproveModal) {
      return (
        <Modal onBackdropClick={this.closeApprovalModal}>
          <div className={css.preApproval}>
            <div className={css.preapproveWrapper}>
              <h3>Activate predictions</h3>
              <p>
                In order to activate predictions, you must authorize our smart
                contract to receive GENs from you. Upon activation, the smart contract
                will be authorized to receive up to 100000 GENs. This transaction will not
                cost you GEN or commit you in any way to spending your GENs in the future.
              </p>
              <div className={css.preapproveButtonsWrapper}>
                <button onClick={this.handleCancelPreApprove} data-test-id="button-cancel">Cancel</button>
                <button onClick={this.handleClickPreApprove} data-test-id="button-preapprove">Preapprove</button>
              </div>
            </div>
          </div>
        </Modal>
      );
    }

    const wrapperClass = classNames({
      [css.predictions]: true,
      [css.contextMenu]: contextMenu,
      [css.detailView]: detailView,
      [css.historyView]: historyView,
      [css.unconfirmedPrediction]: isPredicting,
    });

    const stakingEnabled = (proposal.stage === IProposalStage.Queued && !expired) ||
      (proposal.stage === IProposalStage.PreBoosted);

    const disabledMessage =
      (proposal.stage === IProposalStage.Queued && expired) || proposal.stage === IProposalStage.ExpiredInQueue ? "Can't predict on expired proposals" :
        (proposal.stage === IProposalStage.Boosted || proposal.stage === IProposalStage.QuietEndingPeriod) ? "Can't predict on boosted proposals" :
          (proposal.stage === IProposalStage.Executed) ? `Can't predict on ${proposal.winningOutcome === IProposalOutcome.Pass ? "passed" : "failed"} proposals` : "";

    const hasGens = currentAccountGens && currentAccountGens.gt(new BN(0));

    // show staking buttons when !this.props.currentAccountAddress, even if no GENs
    const disableStakePass = (currentAccountAddress && !hasGens) || currentAccountPrediction === IProposalOutcome.Fail;
    const disableStakeFail = (currentAccountAddress && !hasGens) || currentAccountPrediction === IProposalOutcome.Pass;

    const passButtonClass = classNames({
      [css.pendingPrediction]: pendingPrediction === IProposalOutcome.Pass,
      [css.passButton]: true,
    });

    const failButtonClass = classNames({
      [css.pendingPrediction]: pendingPrediction === IProposalOutcome.Fail,
      [css.failButton]: true,
    });

    const tip = (prediction: IProposalOutcome) =>
      !hasGens ?
        "Insufficient GENs" :
        currentAccountPrediction === prediction ?
          "Can't change your prediction" : ""
      ;

    const passButton = (
      <button className={passButtonClass} onClick={disableStakePass ? null : this.showPreStakeModal(1)} data-test-id="stakePass">
        <img className={css.stakeIcon} src="/assets/images/Icon/v.svg"/> Pass
      </button>
    );

    const failButton = (
      <button className={failButtonClass} onClick={disableStakeFail ? null : this.showPreStakeModal(2)}>
        <img className={css.stakeIcon} src="/assets/images/Icon/x.svg"/> Fail
      </button>
    );

    // If don't have any staking allowance, replace with button to pre-approve
    // show staking buttons when !this.props.currentAccountAddress, even if no allowance
    if (stakingEnabled && (currentAccountAddress && currentAccountGenStakingAllowance && currentAccountGenStakingAllowance.eq(new BN(0)))) {
      return (
        <div className={wrapperClass}>

          {contextMenu ?
            <div className={css.contextTitle}>
              <div>
                <span>
                  Predict
                </span>
              </div>
            </div>
            : ""
          }

          <div className={css.enablePredictions}>
            <button onClick={this.showApprovalModal} data-test-id="button-enable-predicting">Enable Predictions</button>
          </div>
        </div>
      );
    }

    return (
      <div className={wrapperClass}>
        {showPreStakeModal ?
          <PreTransactionModal
            actionType={pendingPrediction === IProposalOutcome.Pass ? ActionTypes.StakePass : ActionTypes.StakeFail}
            action={this.getStakeProposalAction(stakeProposal, proposal, pendingPrediction)}
            beneficiaryProfile={beneficiaryProfile}
            closeAction={this.closePreStakeModal}
            currentAccountGens={currentAccountGens}
            dao={dao}
            proposal={proposal}

          /> : ""
        }

        {contextMenu ?
          <div className={css.contextTitle}>
            <div>
              <span>
                Predict
              </span>
            </div>
          </div>
          : ""
        }

        <div className={contextMenu ? css.contextContent : css.stakeControls}>
          {stakingEnabled ?
            <div>
              {
                (currentAccountAddress && tip(IProposalOutcome.Fail) !== "") ?
                  <Tooltip placement="left" trigger={["hover"]} overlay={tip(IProposalOutcome.Fail)}>
                    {passButton}
                  </Tooltip> :
                  passButton
              }
              {!detailView && proposal.stage === IProposalStage.Queued && !expired ?
                <div className={css.toBoostMessage}>{formatTokens(proposal.upstakeNeededToPreBoost, "GEN to boost")}</div>
                : ""}
              {
                (currentAccountAddress && tip(IProposalOutcome.Pass) !== "") ?
                  <Tooltip placement="left" trigger={["hover"]} overlay={tip(IProposalOutcome.Pass)}>
                    {failButton}
                  </Tooltip> :
                  failButton
              }
              {!detailView && proposal.stage === IProposalStage.PreBoosted && !expired ?
                <div className={css.toBoostMessage}>{formatTokens(proposal.downStakeNeededToQueue, " GEN to un-boost")}</div>
                : ""}
            </div>
            : <span className={css.disabledPredictions}>
              {disabledMessage}
            </span>
          }
        </div>
      </div>
    );
  }
}

export default connect(null, mapDispatchToProps)(StakeButtons);
