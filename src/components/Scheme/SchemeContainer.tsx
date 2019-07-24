import * as H from "history";
import { Address, ISchemeState, Scheme } from "@daostack/client";
import { checkWeb3ProviderAndWarn, getArc } from "arc";
import * as classNames from "classnames";
import Loading from "components/Shared/Loading";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import { schemeName} from "lib/util";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { Link, Route, RouteComponentProps, Switch } from "react-router-dom";
import * as Sticky from "react-stickynode";
import { from } from "rxjs";
import { concatMap } from "rxjs/operators";
import { showNotification } from "reducers/notifications";
import { IRootState } from "reducers";
import { connect } from "react-redux";
import SchemeInfoPage from "./SchemeInfoPage";
import SchemeProposalsPage from "./SchemeProposalsPage";
import * as css from "./Scheme.scss";

interface IDispatchProps {
  showNotification: typeof showNotification;
}

interface IExternalProps {
  currentAccountAddress: Address;
  history: H.History;
}

type IProps = IExternalProps & IDispatchProps;

const mapStateToProps = (_state: IRootState, ownProps: IExternalProps): IExternalProps => {
  return ownProps;
};

const mapDispatchToProps = {
  showNotification,
};

class SchemeContainer extends React.Component<IProps & RouteComponentProps<any>, IExternalProps> {

  private async handleNewProposal(daoAvatarAddress: Address, schemeId: any): Promise<void> {
    if ((await checkWeb3ProviderAndWarn(this.props.showNotification.bind(this)))) {
      this.props.history.push(`/dao/${daoAvatarAddress}/scheme/${schemeId}/proposals/create`);
    }
  }

  public render(): any {
    const { currentAccountAddress, match } = this.props;
    const schemeId = match.params.schemeId;
    const daoAvatarAddress = match.params.daoAvatarAddress;
    const _handleNewProposal = (e: any): void => { this.handleNewProposal(daoAvatarAddress, schemeId); e.preventDefault(); /* e.stopPropagation(); */};

    const arc = getArc();
    const schemeObservable = from(arc.scheme(schemeId)).pipe(concatMap((scheme: Scheme): any => scheme.state()));

    return <Subscribe observable={schemeObservable}>{(state: IObservableState<ISchemeState>): any => {
      if (state.isLoading) {
        return  <div className={css.loading}><Loading/></div>;
      }
      if (state.error) {
        throw state.error;
      }

      const scheme = state.data;

      const proposalsTabClass = classNames({
        [css.proposals]: true,
        [css.active]: !this.props.location.pathname.includes("info"),
      });
      const infoTabClass = classNames({
        [css.info]: true,
        [css.active]: this.props.location.pathname.includes("info"),
      });

      return <div className={css.schemeContainer}>
        <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/scheme/${schemeId}`}>{schemeName(scheme, scheme.address)}</BreadcrumbsItem>

        <Sticky enabled top={50} innerZ={10000}>
          <h2 className={css.schemeName}>
            {schemeName(scheme, scheme.address)}
          </h2>

          <div className={css.schemeMenu}>
            <Link className={proposalsTabClass} to={`/dao/${daoAvatarAddress}/scheme/${scheme.id}/proposals/`}>Proposals</Link>
            <Link className={infoTabClass} to={`/dao/${daoAvatarAddress}/scheme/${scheme.id}/info/`}>Info</Link>
            <a className={css.createProposal}
              data-test-id="createProposal"
              href="#"
              onClick={_handleNewProposal}
            >+ New proposal</a>
          </div>
        </Sticky>

        <Switch>
          <Route exact path="/dao/:daoAvatarAddress/scheme/:schemeId/info"
            render={(props) => <SchemeInfoPage {...props} daoAvatarAddress={daoAvatarAddress} scheme={scheme} />} />

          <Route path="/dao/:daoAvatarAddress/scheme/:schemeId"
            render={(props) => <SchemeProposalsPage {...props} currentAccountAddress={currentAccountAddress} scheme={scheme} />} />
        </Switch>
      </div>;
    }}</Subscribe>;
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(SchemeContainer);
