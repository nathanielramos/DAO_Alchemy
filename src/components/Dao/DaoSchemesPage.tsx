import { IDAOState, Scheme } from "@daostack/client";
import { getArc } from "arc";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import UnknownSchemeCard from "components/Dao/UnknownSchemeCard";
import { KNOWN_SCHEME_NAMES, PROPOSAL_SCHEME_NAMES } from "lib/util";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { RouteComponentProps } from "react-router-dom";
import * as Sticky from "react-stickynode";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { combineLatest } from "rxjs";
import * as css from "./DaoSchemesPage.scss";
import ProposalSchemeCard from "./ProposalSchemeCard";
import SimpleSchemeCard from "./SimpleSchemeCard";

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

type IExternalProps = RouteComponentProps<any>;
type IProps = IExternalProps & ISubscriptionProps<[IDAOState, Scheme[]]>;

const DaoSchemesPage = (props: IProps) => {
  // const [dao, allSchemes, knownSchemes, unknownSchemes ] = props.data;
  const dao = props.data[0];
  const allSchemes = props.data[1];
  const contributionReward = allSchemes.filter((scheme: Scheme) => scheme.staticState.name === "ContributionReward");
  const knownSchemes = allSchemes.filter((scheme: Scheme) => scheme.staticState.name !== "ContributionReward" && KNOWN_SCHEME_NAMES.indexOf(scheme.staticState.name) >= 0);
  const unknownSchemes = allSchemes.filter((scheme: Scheme) =>  KNOWN_SCHEME_NAMES.indexOf(scheme.staticState.name) === -1 );
  const allKnownSchemes = [...contributionReward, ...knownSchemes];

  const schemeCardsHTML = (
    <TransitionGroup>
      { allKnownSchemes.map((scheme: Scheme) => (
        <Fade key={"scheme " + scheme.id}>
          {PROPOSAL_SCHEME_NAMES.includes(scheme.staticState.name)
            ? <ProposalSchemeCard dao={dao} scheme={scheme} />
            : <SimpleSchemeCard dao={dao} scheme={scheme} />
          }
        </Fade>
      ))
      }

      {!unknownSchemes ? "" :
        <Fade key={"schemes unknown"}>
          <UnknownSchemeCard schemes={unknownSchemes} />
        </Fade>
      }
    </TransitionGroup>
  );

  return (
    <div className={css.wrapper}>
      <BreadcrumbsItem to={"/dao/" + dao.address}>{dao.name}</BreadcrumbsItem>

      <Sticky enabled top={50} innerZ={10000}>
        <h1>All Schemes</h1>
      </Sticky>
      {(allKnownSchemes.length + unknownSchemes.length) === 0
        ? <div>
          <img src="/assets/images/meditate.svg" />
          <div>
            No schemes registered
          </div>
        </div>
        :
        <div className={css.allSchemes}>{schemeCardsHTML}</div>
      }
    </div>
  );
};

export default withSubscription({
  wrappedComponent: DaoSchemesPage,
  loadingComponent: <div className={css.loading}><Loading/></div>,
  errorComponent: (props) => <span>{props.error.message}</span>,
  checkForUpdate: (oldProps: IExternalProps, newProps: IExternalProps) => {
    return oldProps.match.params.daoAvatarAddress !== newProps.match.params.daoAvatarAddress;
  },
  createObservable: (props: IExternalProps) => {
    const daoAvatarAddress = props.match.params.daoAvatarAddress;
    const arc = getArc();
    const dao = arc.dao(daoAvatarAddress);
    return combineLatest(
      dao.state({ fetchAllData: true }), // DAO state
      arc.dao(daoAvatarAddress).schemes({}, { fetchAllData: true }),
    );
  },
});
