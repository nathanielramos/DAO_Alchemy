import { IDAOState, IProposalStage, IProposalState, ISchemeState, Proposal, Scheme } from "@daostack/client";
import { getArc } from "arc";
import VoteGraph from "components/Proposal/Voting/VoteGraph";
import Countdown from "components/Shared/Countdown";
import Loading from "components/Shared/Loading";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import { humanProposalTitle, schemeName } from "lib/util";
import * as React from "react";
import { Link } from "react-router-dom";
import { closingTime } from "reducers/arcReducer";
import { combineLatest } from "rxjs";
import * as css from "./SchemeCard.scss";

const ProposalDetail = (props: { proposal: Proposal; dao: IDAOState }) => {
  const { proposal, dao } = props;
  return <Subscribe key={proposal.id} observable={proposal.state()}>{
    (state: IObservableState<IProposalState>): any => {
      if (state.isLoading) {
        return <div>Loading...</div>;
      } else if (state.error) {
        throw state.error;
      } else {
        const proposalState = state.data;
        return (
          <Link className={css.proposalTitle} to={"/dao/" + dao.address + "/proposal/" + proposal.id} data-test-id="proposal-title">
            <span>
              <em className={css.miniGraph}>
                <VoteGraph size={20} proposal={proposalState} />
              </em>
              {humanProposalTitle(proposalState)}
            </span>
            <b>
              <Countdown toDate={closingTime(proposalState)} detailView={false} schemeView />
            </b>
          </Link>
        );
      }
    }
  }</Subscribe>;

};

interface IExternalProps {
  dao: IDAOState;
  scheme: Scheme;
}

interface IInternalProps {
  dao: IDAOState;
  boostedProposals: Proposal[];
  preBoostedProposals: Proposal[];
  queuedProposals: Proposal[];
  scheme: ISchemeState;
}

const SchemeCardContainer = (props: IInternalProps) => {

  const { dao, scheme, boostedProposals, preBoostedProposals, queuedProposals } = props;

  const numProposals = boostedProposals.length + preBoostedProposals.length + queuedProposals.length;
  const proposals = boostedProposals.slice(0, 3);

  const proposalsHTML = proposals.map((proposal: Proposal) => <ProposalDetail key={proposal.id} proposal={proposal} dao={dao} />);
  return (
    <div className={css.wrapper} data-test-id={`schemeCard-${scheme.name}`}>
      <Link className={css.headerLink} to={`/dao/${dao.address}/proposals/${scheme.id}`}>
        <h2>{schemeName(scheme, "[Unknown]")}</h2>
        <div>
          <b>{boostedProposals.length}</b> <span>Boosted</span> <b>{preBoostedProposals.length}</b> <span>Pending</span> <b>{queuedProposals.length}</b> <span>Regular</span>
        </div>
        {proposals.length === 0 ?
          <div className={css.loading}>
            <img src="/assets/images/meditate.svg" />
            <div>
              No upcoming proposals
            </div>
          </div>
          : " "
        }
      </Link>
      {proposals.length > 0 ?
        <div>
          {proposalsHTML}
          <div className={css.numProposals}>
            <Link to={`/dao/${dao.address}/proposals/${scheme.id}`}>View all {numProposals} &gt;</Link>
          </div>
        </div>
        : " "
      }
    </div>
  );

};

export default (props: IExternalProps) => {
  const arc = getArc();

  const dao = arc.dao(props.dao.address);
  const observable = combineLatest(
    props.scheme.state(),
    dao.proposals({where: {
      scheme:  props.scheme.id,
      stage: IProposalStage.Queued,
      // eslint-disable-next-line @typescript-eslint/camelcase
      expiresInQueueAt_gt: Math.floor(new Date().getTime() / 1000),
    }}), // the list of queued proposals
    dao.proposals({ where: {
      scheme:  props.scheme.id,
      stage: IProposalStage.PreBoosted,
    }}), // the list of preboosted proposals
    dao.proposals({ where: {
      scheme:  props.scheme.id,
      // eslint-disable-next-line @typescript-eslint/camelcase
      stage_in: [IProposalStage.Boosted, IProposalStage.QuietEndingPeriod],
    }}) // the list of boosted proposals
  );

  return <Subscribe observable={observable}>{
    (state: IObservableState<[ISchemeState, Proposal[], Proposal[], Proposal[]]>): any => {
      if (state.isLoading) {
        return  <div><Loading/></div>;
      } else if (state.error) {
        throw state.error;
      } else {
        return <SchemeCardContainer {...props} scheme={state.data[0]} boostedProposals={state.data[3]} preBoostedProposals={state.data[2]} queuedProposals={state.data[1]} />;
      }
    }
  }</Subscribe>;
};
