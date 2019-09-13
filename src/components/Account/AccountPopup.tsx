import { Address, IDAOState, IMemberState } from "@daostack/client";
import { getArc } from "arc";
import * as classNames from "classnames";
import AccountImage from "components/Account/AccountImage";
import AccountProfileName from "components/Account/AccountProfileName";
import OAuthLogin from "components/Account/OAuthLogin";
import Reputation from "components/Account/Reputation";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { copyToClipboard  } from "lib/util";
import * as React from "react";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { NotificationStatus, showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";

import BN = require("bn.js");

import * as css from "./Account.scss";


interface IExternalProps {
  accountAddress: Address;
  dao: IDAOState;
  detailView?: boolean;
  historyView?: boolean;
}

interface IStateProps {
  profile: IProfileState;
}

const mapStateToProps = (state: IRootState, ownProps: IExternalProps & ISubscriptionProps<IMemberState>): IExternalProps & IStateProps & ISubscriptionProps<IMemberState> => {
  const account = ownProps.data;

  return {
    ...ownProps,
    profile: account ? state.profiles[account.address] : null,
  };
};

interface IDispatchProps {
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  showNotification,
};

type IProps = IExternalProps & IStateProps & IDispatchProps & ISubscriptionProps<IMemberState>;

class AccountPopup extends React.Component<IProps, null> {

  public copyAddress = (e: any) => {
    const { showNotification, accountAddress } = this.props;
    copyToClipboard(accountAddress);
    showNotification(NotificationStatus.Success, "Copied to clipboard!");
    e.preventDefault();
  }

  public render() {
    const accountInfo = this.props.data;
    const { accountAddress, dao, profile } = this.props;
    const reputation = accountInfo ? accountInfo.reputation : new BN(0);

    const targetAccountClass = classNames({
      [css.detailView]: this.props.detailView,
      [css.historyView]: this.props.historyView,
      [css.targetAccount]: true,
    });

    return (
      <div className={targetAccountClass}>
        <div className={css.avatar}>
          <AccountImage accountAddress={accountAddress} />
        </div>
        <div className={css.accountInfo}>
          <div className={css.name}><AccountProfileName accountAddress={accountAddress} accountProfile={profile} daoAvatarAddress={dao.address} /></div>
          {!profile || Object.keys(profile.socialURLs).length === 0 ? "No social profiles" :
            <div>
              <OAuthLogin editing={false} provider="facebook" accountAddress={accountAddress} profile={profile} />
              <OAuthLogin editing={false} provider="twitter" accountAddress={accountAddress} profile={profile} />
              <OAuthLogin editing={false} provider="github" accountAddress={accountAddress} profile={profile} />
            </div>
          }
          <div className={css.beneficiaryAddress}>
            <span>{accountAddress}</span>
            <button onClick={this.copyAddress}><img src="/assets/images/Icon/Copy-black.svg"/></button>
          </div>
          <div className={css.holdings}>
            <span>HOLDINGS</span>
            <div><Reputation daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={reputation}/></div>
          </div>
        </div>
      </div>
    );
  }
}

const ConnectedAccountPopup = connect(mapStateToProps, mapDispatchToProps)(AccountPopup);

// TODO: move this subscription to ProposalData.
//  Can't do that right now because need to get the proposal state first to get the proposer and beneficiary
//  before we can load the member data for those addresses
const SubscribedAccountPopup = withSubscription({
  wrappedComponent: ConnectedAccountPopup,
  loadingComponent: <div>Loading...</div>,
  errorComponent: (props) => <div>{props.error.message}</div>,

  checkForUpdate: (oldProps, newProps) => { return oldProps.accountAddress !== newProps.accountAddress || oldProps.dao.address !== newProps.dao.address; },

  createObservable: (props: IProps) => {
    const subscribe = props.historyView !== true;
    const arc = getArc();
    return arc.dao(props.dao.address).member(props.accountAddress).state({subscribe});
  },
});

export default SubscribedAccountPopup;
