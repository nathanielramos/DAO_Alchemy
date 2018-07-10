import * as moment from "moment";
import * as React from "react";
import * as css from "./Notification.scss";
import classNames = require("classnames");
import Util from "lib/util";
import { NotificationStatus, showNotification } from "reducers/notifications";
import Linkify from 'react-linkify';

export enum NotificationViewStatus {
  Pending = 'Pending',
  Failure = 'Failure',
  Success = 'Success'
}

interface IProps {
  title: string;
  status: NotificationViewStatus;
  message: string;
  fullErrorMessage?: string;
  timestamp: number;
  url?: string;
  dismiss: () => any;
  showNotification: typeof showNotification;
}

interface IState {
  minimized: boolean
}

export default class Notification extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = { minimized: false };

    this.handleClose = this.handleClose.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.copyToClipboard = this.copyToClipboard.bind(this);
  }

  public handleClose(e: any) {
    const { dismiss } = this.props;
    dismiss();
  }

  public handleClick(e: any) {
    const { status } = this.props;
    const { minimized } = this.state;

    if (status === NotificationViewStatus.Pending && minimized) {
      this.setState({minimized: false});
    }
  }

  public copyToClipboard(message: string) {
    const { showNotification } = this.props;
    Util.copyToClipboard(message);
    showNotification(NotificationStatus.Success, `Copied to clipboard!`);
  }

  public render() {
    const { title, message, timestamp, status, url, fullErrorMessage } = this.props;
    const { minimized } = this.state;

    const transactionClass = classNames({
      [css.pendingTransaction]: true,
      [css.clearfix]: true,
      [css.pending]: status === NotificationViewStatus.Pending,
      [css.error]: status === NotificationViewStatus.Failure,
      [css.success]: status === NotificationViewStatus.Success,
      [css.minimized]: status === NotificationViewStatus.Pending && minimized,
    });

    return (
      <div className={transactionClass} onClick={(e) => this.handleClick(e)}>
        <div className={css.statusIcon}>
          <img className={css.pending} src="/assets/images/Icon/Loading-white.svg" />
          <img className={css.success} src="/assets/images/Icon/Success-notification.svg" />
          <img className={css.error} src="/assets/images/Icon/Error-notification.svg" />
        </div>
        <div className={css.transactionMessage}>
          <div className={css.clearfix}>
            <div className={css.left}>
              <span className={css.pending}>{title}</span>
              <span className={css.success}>{title}</span>
              <span className={css.error}>{title}</span>
            </div>
            <div className={css.right}>
              <span className={css.error}>ERROR</span>
            </div>
          </div>
          <div className={css.notificationMessage}>
            <Linkify>{message}</Linkify>
            {
              fullErrorMessage ?
                <span style={{cursor: 'pointer'}} onClick={() => this.copyToClipboard(fullErrorMessage)}>&nbsp;(copy full error)</span>
                : ''
            }
            {
              url ?
              <span><br/><a href={url}>See in etherscan</a></span>
              : ''
            }
          </div>
        </div>
        <div className={css.notificationControls}>
          <button className={css.pending} onClick={() => this.setState({minimized: true})}><img src="/assets/images/Icon/Minimize-notification.svg" /></button>
          <button className={css.success} onClick={(e) => this.handleClose(e)}><img src="/assets/images/Icon/Close.svg" /></button>
          <button className={css.error} onClick={(e) => this.handleClose(e)}><img src="/assets/images/Icon/Close.svg" /></button>
        </div>
      </div>
    );
  }
}
