import { denormalize } from "normalizr";
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IDaoState } from "reducers/arcReducer";

import * as schemas from "schemas";

import * as css from "./DaoList.scss";

interface IStateProps {
  daos: { [key: string]: IDaoState };
  daosLoaded: boolean;
}

const mapStateToProps = (state: IRootState, ownProps: any) => ({
  daos: denormalize(state.arc.daos, schemas.daoList, state.arc),
  daosLoaded: state.arc.daosLoaded,
});

interface IDispatchProps {
  getDAOs: typeof arcActions.getDAOs;
}

const mapDispatchToProps = {
  getDAOs: arcActions.getDAOs,
};

type IProps = IStateProps & IDispatchProps;

class DaoListContainer extends React.Component<IProps, null> {

  public daoSubscription: any;

  public async componentWillMount() {
    this.daoSubscription = this.props.getDAOs();
  }

  public componentWillUnmount() {
    this.daoSubscription.unsubscribe();
  }

  public render() {
    const { daos, daosLoaded } = this.props;

    const daoNodes = Object.keys(daos).map((key: string) => {
      const dao = daos[key];
      return (
        <Link
          className={css.daoLink}
          to={"/dao/" + dao.avatarAddress}
          key={"dao_" + dao.avatarAddress}
          data-test-id="dao-link"
        >
          <div className={css.dao}>
            <div className={css.daoAvatar}>
              <img src="/assets/images/daostack-logo.png"/>
            </div>
            <h3 className={css.daoName}>{dao.name}</h3>
            <div className={css.daoInfo}>Token: {dao.tokenName} ({dao.tokenSymbol})</div>
            <div className={css.daoInfo}>Num tokens: {Math.round(dao.tokenCount).toLocaleString()}</div>
            <div className={css.daoInfo}>Reputation: {Math.round(dao.reputationCount).toLocaleString()}</div>
          </div>
        </Link>
      );
    });

    return (
      daosLoaded ? (
        <div className={css.wrapper}>
          <div className={css.daoListHeader + " " + css.clearfix}>
            <h2 data-test-id="header-all-daos">All DAOs</h2>
          </div>
          {daoNodes ? daoNodes : "None"}
        </div>)
      : (
        <div className={css.wrapper}>
          <div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/>
          </div>
        </div>)
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(DaoListContainer);
