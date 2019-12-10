import BN = require("bn.js");
import AccountImage from "components/Account/AccountImage";
import AccountProfileName from "components/Account/AccountProfileName";
import * as GeoPattern from "geopattern";
import { fromWei } from "lib/util";

import moment = require("moment");
import { Link } from "react-router-dom";
import { IProfileState } from "reducers/profilesReducer";
import * as React from "react";
import DaoFeedItem from "./DaoFeedItem";
import ProposalFeedItem from "./ProposalFeedItem";
import UserFeedItem from "./UserFeedItem";
import * as css from "./Feed.scss";

interface IProps {
  event: any;
  currentAccountProfile: IProfileState;
  userProfile: IProfileState;
}

const accountTitle = (event: any, userProfile: IProfileState, text: string) => {
  return <span>
    <AccountImage accountAddress={event.user} width={17} profile={userProfile} />
    <span className={css.accountName}><AccountProfileName accountAddress={event.user} accountProfile={userProfile} daoAvatarAddress={event.dao.id} /></span>
    <span>{text}</span>
  </span>;
};

const daoTitle = (event: any, text = "") => {
  const bgPattern = GeoPattern.generate(event.dao.id + event.dao.name);

  return <span>
    <Link to={"/dao/" + event.dao.id}>
      <b className={css.daoIcon} style={{ backgroundImage: bgPattern.toDataUrl() }}></b>
      <em></em>
      <span>{event.dao.name}</span>
      &nbsp;
    </Link>
    <span>{text}</span>
  </span>;
};

const FeedItem = (props: IProps) => {
  const { event, userProfile } = props;

  let title;
  let content;
  let icon;
  let eventData;
  try {
    // XXX: only need to try this because of malformed JSON in subgraph
    //      (right now quotes in proposal titles are not escaped)
    eventData = JSON.parse(event.data);
  } catch (e) {
    return null;
  }

  switch (event.type) {
    case "NewDAO":
      title = <span>New DAO! {daoTitle(event)}</span>;
      icon = "🎉";
      content = <DaoFeedItem event={event} />;
      break;
    case "NewReputationHolder":
      title = daoTitle(event, "has a new reputation holder");
      icon = <img src="/assets/images/Icon/new-person.svg" />;
      content = <UserFeedItem event={event} />;
      break;
    case "ProposalStageChange":
      title = event.from === "dao"
        ? daoTitle(event, ` - proposal is ${eventData.stage}`)
        : `Proposal is ${eventData.stage}`;
      icon = <img src="/assets/images/Icon/Info.svg" />;
      content = <ProposalFeedItem event={event} />;
      break;
    case "VoteFlip": {
      const voteFlipForAgainst = eventData.outcome === "Pass" ? "Pass" : "Fail";
      title = event.from === "dao"
        ? daoTitle(event, `Vote Flip - ${voteFlipForAgainst} is now in the lead`)
        : `Vote Flip - ${voteFlipForAgainst} is now in the lead`;
      icon = <img src="/assets/images/Icon/Info.svg" />;
      content = <ProposalFeedItem event={event} />;
      break;
    }
    case "NewProposal":
      title = event.from === "dao"
        ? daoTitle(event, "has a new proposal")
        : accountTitle(event, userProfile, "submitted a new proposal");
      icon = <img src="/assets/images/Icon/circle-plus.svg" />;
      content = <ProposalFeedItem event={event} />;
      break;
    case "Stake": {
      const stakeForAgainst = eventData.outcome === "Pass" ? "Pass" : "Fail";
      title = accountTitle(event, userProfile, `staked on ${stakeForAgainst} with ${fromWei(new BN(eventData.stakeAmount))} GEN`);
      icon = <img src="/assets/images/Icon/v-small-line.svg" />;
      content = <ProposalFeedItem event={event} />;
      break;
    }
    case "Vote": {
      const voteForAgainst = eventData.outcome === "Pass" ? "For" : "Against";
      title = accountTitle(event, userProfile, `voted ${voteForAgainst} with ${fromWei(new BN(eventData.reputationAmount))} REP`);
      icon = <img src="/assets/images/Icon/vote/for-gray.svg" />;
      content = <ProposalFeedItem event={event} />;
      break;
    }
    default:
      return null;
  }

  return (
    <div className={css.feedItemContainer} data-test-id={`eventCard-${event.id}`}>
      <span className={css.icon}>{icon}</span>
      <div className={css.itemTitle}>
        <span>{title}</span>
        <span className={css.timestamp}>{moment.unix(event.timestamp).fromNow()}</span>
      </div>
      <div className={css.itemContent}>{content}</div>
    </div>
  );
};

export default FeedItem;
