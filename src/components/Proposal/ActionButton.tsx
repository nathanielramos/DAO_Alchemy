import { Address, IDAOState, IProposalStage, IProposalState, IRewardState, Token, IProposalOutcome } from "@daostack/client";
import { executeProposal, redeemProposal } from "actions/arcActions";
import { enableWalletProvider, getArc } from "arc";
import * as classNames from "classnames";
import { ActionTypes, default as PreTransactionModal } from "components/Shared/PreTransactionModal";
import { getCRRewards, getGpRewards } from "lib/util";
import Tooltip from "rc-tooltip";
import * as React from "react";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { showNotification, NotificationStatus } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { of, combineLatest, Observable } from "rxjs";
import * as css from "./ActionButton.scss";
import RedemptionsTip from "./RedemptionsTip";

import BN = require("bn.js");

interface IExternalProps {
  currentAccountAddress?: Address;
  daoState: IDAOState;
  daoEthBalance: BN;
  detailView?: boolean;
  expanded?: boolean;
  proposalState: IProposalState;
  /**
   * unredeemed GP rewards due to the current account
   */
  rewards: IRewardState;
  expired: boolean;
}

interface IStateProps {
  beneficiaryProfile: IProfileState;
}

interface IDispatchProps {
  executeProposal: typeof executeProposal;
  redeemProposal: typeof redeemProposal;
  showNotification: typeof showNotification;
}

type IProps = IExternalProps & IStateProps & IDispatchProps & ISubscriptionProps<[BN,BN]>;

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {
  const proposalState = ownProps.proposalState;
  return {...ownProps,
    beneficiaryProfile: proposalState.contributionReward ? state.profiles[proposalState.contributionReward.beneficiary] : null,
  };
};

const mapDispatchToProps = {
  redeemProposal,
  executeProposal,
  showNotification,
};

interface IState {
  preRedeemModalOpen: boolean;
}

class ActionButton extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
    this.state = {
      preRedeemModalOpen: false,
    };
    this.handleRedeemProposal = this.handleRedeemProposal.bind(this);
  }

  private handleClickExecute = () => async(): Promise<void> => {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

    await this.props.executeProposal(this.props.daoState.address, this.props.proposalState.id, this.props.currentAccountAddress);
  }

  private handleClickRedeem = (canRedeem: boolean) => async (): Promise<void> => {

    if (!canRedeem) {
      this.props.showNotification(NotificationStatus.Failure, "The DAO does not have enough funds to pay for these redemptions");
    } else {
      if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

      this.setState({ preRedeemModalOpen: true });
    }
  }

  private closePreRedeemModal = () => (): void => {
    this.setState({ preRedeemModalOpen: false });
  }

  public render(): RenderOutput {
    const {
      beneficiaryProfile,
      currentAccountAddress,
      daoState,
      daoEthBalance,
      detailView,
      expired,
      expanded,
      proposalState,
      /**
       * unredeemed GP rewards due to the current account
       */
      rewards,
    } = this.props;

    const daoBalances: {[key: string]: BN} = {
      eth: daoEthBalance,
      externalToken: this.props.data[0],
      GEN:this.props.data[1],
      nativeToken: undefined,
      rep: undefined,
    };
    /**
     * unredeemed by the current account
     */
    const gpRewards = getGpRewards(rewards);
    const currentAccountHasUnredeemedGpRewards = Object.keys(gpRewards).length > 0;
    /**
     * unredeemed and available to the current account
     */
    const availableGpRewards = getGpRewards(rewards, daoBalances);
    const currentAccountHasAvailableUnredeemedGpRewards = Object.keys(availableGpRewards).length > 0;
    /**
     * note beneficiary may not be the current account
     */
    let beneficiaryHasAvailableUnredeemedCrRewards = false;
    let beneficiaryHasUnredeemedCrRewards = false;
    if (proposalState.contributionReward) {
      /**
       * unredeemed by the beneficiary
       */
      const contributionRewards = getCRRewards(proposalState.contributionReward);
      beneficiaryHasUnredeemedCrRewards = Object.keys(contributionRewards).length > 0;
      /**
       * unredeemed and available to the beneficiary
       */
      const availableContributionRewards = getCRRewards(proposalState.contributionReward, daoBalances);
      beneficiaryHasAvailableUnredeemedCrRewards = Object.keys(availableContributionRewards).length > 0;
    }
    /**
     * Can't redeem unless executed.  We'll make the redeem button available even if the DAO can't pay.
     * Similarly if even if the current account is not the CR beneficiary.
     */
    const redeemable = proposalState.executedAt &&
                       ((currentAccountAddress ? currentAccountHasUnredeemedGpRewards : false) ||
                        ((proposalState.winningOutcome === IProposalOutcome.Pass) && beneficiaryHasUnredeemedCrRewards));

    const redemptionsTip = RedemptionsTip({
      currentAccountAddress,
      dao: daoState,
      proposal: proposalState,
      gpRewardsForCurrentUser: rewards, 
    });

    const redeemButtonClass = classNames({
      [css.redeemButton]: true,
    });

    const wrapperClass = classNames({
      [css.wrapper]: true,
      [css.detailView]: detailView,
      [css.expanded]: expanded,
    });

    return (
      <div className={wrapperClass}>
        {this.state.preRedeemModalOpen ?
          <PreTransactionModal
            actionType={ActionTypes.Redeem}
            action={this.handleRedeemProposal}
            beneficiaryProfile={beneficiaryProfile}
            closeAction={this.closePreRedeemModal()}
            dao={daoState}
            effectText={redemptionsTip}
            proposal={proposalState}
          /> : ""
        }

        { proposalState.stage === IProposalStage.Queued && proposalState.upstakeNeededToPreBoost.lt(new BN(0)) ?
          <button className={css.preboostButton} onClick={this.handleClickExecute()} data-test-id="buttonBoost">
            <img src="/assets/images/Icon/boost.svg"/>
            { /* space after <span> is there on purpose */ }
            <span> Pre-Boost</span>
          </button> :
          proposalState.stage === IProposalStage.PreBoosted && expired && proposalState.downStakeNeededToQueue.lte(new BN(0)) ?
            <button className={css.unboostButton} onClick={this.handleClickExecute()} data-test-id="buttonBoost">
              <img src="/assets/images/Icon/boost.svg"/>
              <span> Un-Boost</span>
            </button> :
            proposalState.stage === IProposalStage.PreBoosted && expired ?
              <button className={css.boostButton} onClick={this.handleClickExecute()} data-test-id="buttonBoost">
                <img src="/assets/images/Icon/boost.svg"/>
                <span> Boost</span>
              </button> :
              (proposalState.stage === IProposalStage.Boosted || proposalState.stage === IProposalStage.QuietEndingPeriod) && expired ?
                <button className={css.executeButton} onClick={this.handleClickExecute()}>
                  <img src="/assets/images/Icon/execute.svg"/>
                  { /* space after <span> is there on purpose */ }
                  <span> Execute</span>
                </button>
                : redeemable ?
                  <div>
                    <Tooltip placement="left" trigger={["hover"]} overlay={redemptionsTip}>
                      <button
                        style={{ whiteSpace: "nowrap" }}
                        disabled={false}
                        className={redeemButtonClass}
                        onClick={this.handleClickRedeem(beneficiaryHasAvailableUnredeemedCrRewards || currentAccountHasAvailableUnredeemedGpRewards)}
                        data-test-id="button-redeem"
                      >
                        <img src="/assets/images/Icon/redeem.svg" />
                        {
                          beneficiaryHasUnredeemedCrRewards && !currentAccountHasUnredeemedGpRewards ?
                            // note beneficiary can be the current account
                            " Redeem for beneficiary" : " Redeem"
                        }
                      </button>
                    </Tooltip>
                  </div>
                  : ""
        }
      </div>
    );
  }

  private async handleRedeemProposal(): Promise<void> {

    // may not be required, but just in case
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

    const {
      currentAccountAddress,
      daoState,
      proposalState,
      redeemProposal,
    } = this.props;

    await redeemProposal(daoState.address, proposalState.id, currentAccountAddress);
  }
}

const SubscribedActionButton = withSubscription({
  wrappedComponent: ActionButton,
  // Don't ever update the subscription
  checkForUpdate: () => { return false; },
  loadingComponent: null,
  createObservable: (props: IProps) => {
    let externalTokenObservable: Observable<BN>;

    const arc = getArc();
    const genToken = arc.GENToken();
    
    if (props.proposalState.contributionReward && 
      props.proposalState.contributionReward.externalTokenReward &&
      !props.proposalState.contributionReward.externalTokenReward.isZero()) {

      const token = new Token(props.proposalState.contributionReward.externalToken, arc);

      externalTokenObservable = token.balanceOf(props.daoState.address);
    } else {
      externalTokenObservable = of(undefined);
    }

    return combineLatest(
      externalTokenObservable,
      genToken.balanceOf(props.daoState.address)
    );
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SubscribedActionButton);
