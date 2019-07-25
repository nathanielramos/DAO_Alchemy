import BN = require("bn.js");
import { fromWei } from "lib/util";
import Tooltip from "rc-tooltip";
import * as React from "react";

interface IProps {
  daoName?: string;
  hideSymbol?: boolean;
  hideTooltip?: boolean;
  reputation: BN;
  totalReputation: BN;
}

export default class Reputation extends React.Component<IProps, null> {
  public render() {
    const { daoName, hideSymbol, hideTooltip, reputation, totalReputation } = this.props;
    const PRECISION  = 2; // how many digits behind
    let percentage = 0;
    if (totalReputation.gt(new BN(0))) {
      percentage = new BN(100 * 10 ** PRECISION).mul(reputation).div(totalReputation).toNumber() / (10 ** PRECISION);
    }
    let percentageString = percentage.toLocaleString(undefined, {minimumFractionDigits: PRECISION, maximumFractionDigits: PRECISION});
    if (percentage === 0 && !reputation.isZero()) {
      percentageString = `+${percentageString}`;
    }
    return (
      <Tooltip
        placement="bottom"
        overlay={<span>{fromWei(totalReputation).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})} {daoName || ""} Reputation in total</span>}
        trigger={hideTooltip ? [] : ["hover"]}
      >
        <span data-test-id="reputation">
          { percentageString}  % {hideSymbol ? "" : "Rep."}
        </span>
      </Tooltip>
    );
  }
}
