// const Web3 = require("web3");
import { Address } from "@daostack/client";
import * as Sentry from "@sentry/browser";
import * as web3Actions from "actions/web3Actions";
import { checkWeb3Provider, getCurrentAccountAddress, pollForAccountChanges } from "arc";
import AccountProfileContainer from "components/Account/AccountProfileContainer";
import DaoListContainer from "components/DaoList/DaoListContainer";
import MinimizedNotifications from "components/Notification/MinimizedNotifications";
import Notification, { NotificationViewStatus } from "components/Notification/Notification";
import ViewDaoContainer from "components/ViewDao/ViewDaoContainer";
import * as History from "history";
import HeaderContainer from "layouts/HeaderContainer";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { connect } from "react-redux";
import { Route, Switch } from "react-router-dom";
//@ts-ignore
import { ModalContainer } from "react-router-modal";
import { IRootState } from "reducers";
import { dismissNotification, INotificationsState, NotificationStatus, showNotification } from "reducers/notifications";
import { sortedNotifications } from "../selectors/notifications";
import * as css from "./App.scss";

interface IStateProps {
  currentAccountAddress: string;
  history: History.History;
  sortedNotifications: INotificationsState;
}

const mapStateToProps = (state: IRootState, ownProps: any) => ({
  currentAccountAddress: state.web3.currentAccountAddress,
  history: ownProps.history,
  sortedNotifications: sortedNotifications()(state),
});

interface IDispatchProps {
  dismissNotification: typeof dismissNotification;
  setCurrentAccount: typeof web3Actions.setCurrentAccount;
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  dismissNotification,
  setCurrentAccount: web3Actions.setCurrentAccount,
  showNotification,
};

type IProps = IStateProps & IDispatchProps;

interface IState {
  error: Error;
  sentryEventId: string;
  notificationsMinimized: boolean;
}

class AppContainer extends React.Component<IProps, IState> {

  private static hasAcceptedCookiesKey = "acceptedCookies";

  constructor(props: IProps) {
    super(props);
    this.state = {
      error: null,
      sentryEventId: null,
      notificationsMinimized: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    this.setState({ error });

    if (process.env.NODE_ENV === "PRODUCTION") {
      Sentry.withScope((scope) => {
        scope.setExtras(errorInfo);
        const sentryEventId = Sentry.captureException(error);
        this.setState({ sentryEventId });
      });
    }
  }

  public async componentWillMount() {
    let metamask: any;
    let currentAddress = await getCurrentAccountAddress();
    const storageKey = "currentAddress";

    if (currentAddress)  {
      console.log(`using address from web3 connection: ${currentAddress}`);
      localStorage.setItem(storageKey, currentAddress);
    } else {
      currentAddress = localStorage.getItem(storageKey);
      if (currentAddress) {
        console.log(`using address from local storage: ${currentAddress}`);
      } else {
        localStorage.setItem(storageKey, "");
      }
    }

    this.props.setCurrentAccount(currentAddress);

    try {
      metamask = await checkWeb3Provider();
    } catch (err) {
      console.log("MM not available or not set correctly: using default web3 provider: ", err.message);
    }

    if (metamask) {
      pollForAccountChanges(currentAddress).subscribe(
        (newAddress: Address) => {
          if (newAddress && checkWeb3Provider()) {
            console.log(`new address: ${newAddress}`);
            this.props.setCurrentAccount(newAddress);
            localStorage.setItem(storageKey, newAddress);
            window.location.reload();
          }
        });
    }
  }

  public render() {
    const {
      // connectionStatus,
      dismissNotification,
      showNotification,
      sortedNotifications,
    } = this.props;

    if (this.state.error) {
      // Render error fallback UI
      console.log(this.state.error);
      return <div>
        <a onClick={() => Sentry.showReportDialog({ eventId: this.state.sentryEventId })}>Report feedback</a>
        <pre>{ this.state.error.toString() }</pre>
      </div>;
    } else {

      const hasAcceptedCookies = !!localStorage.getItem(AppContainer.hasAcceptedCookiesKey);

      return (
        <div className={css.outer}>
          <BreadcrumbsItem to="/">Alchemy</BreadcrumbsItem>

          <div className={css.container}>
            <Route path="/" render={( props ) => <HeaderContainer {...props} />} />

            <Switch>
              <Route path="/dao/:daoAvatarAddress" component={ViewDaoContainer} />
              <Route path="/profile/:accountAddress" component={AccountProfileContainer} />
              <Route path="/" component={DaoListContainer} />
            </Switch>

            <ModalContainer
              modalClassName={css.modal}
              backdropClassName={css.backdrop}
              containerClassName={css.modalContainer}
              bodyModalClassName={css.modalBody}
            />
          </div>

          <div className={css.pendingTransactions}>
            {this.state.notificationsMinimized ?
              <MinimizedNotifications
                notifications={sortedNotifications.length}
                unminimize={() => this.setState({notificationsMinimized: false})}
              /> :
              sortedNotifications.map(({id, status, title, message, fullErrorMessage, timestamp, url}) => (
                <div key={id}>
                  <Notification
                    title={(title || status).toUpperCase()}
                    status={
                      status === NotificationStatus.Failure ?
                        NotificationViewStatus.Failure :
                        status === NotificationStatus.Success ?
                          NotificationViewStatus.Success :
                          NotificationViewStatus.Pending
                    }
                    message={message}
                    fullErrorMessage={fullErrorMessage}
                    url={url}
                    timestamp={timestamp}
                    dismiss={() => dismissNotification(id)}
                    showNotification={showNotification}
                    minimize={() => this.setState({notificationsMinimized: true})}
                  />
                  <br/>
                </div>
              ))
            }
          </div>
          <div className={css.background}></div>
          { hasAcceptedCookies ? "" :
            <div className={css.cookieDisclaimerContainer}>
              <div className={css.cookieDisclaimer}>
                <div className={css.body}>This website stores cookies on your computer. These cookies are used to collect information about how you interact with our website. We use this information for analytics in order to improve our website.</div>
                <div className={css.accept}><a href="#" onClick={this.handleAccept} className={css.blueButton}><img src="/assets/images/Icon/v-white-thick.svg"></img>Accept</a></div>
              </div>
            </div>
          }
        </div>
      );
    }
  }

  private handleAccept() {
    localStorage.setItem(AppContainer.hasAcceptedCookiesKey, "1");
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AppContainer);
