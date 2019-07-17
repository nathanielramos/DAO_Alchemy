/* tslint:disable:max-classes-per-file */

import { Address, ISchemeState } from "@daostack/client";
import { linkToEtherScan, schemeName } from "lib/util";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import * as css from "./SchemeInfo.scss";

interface IProps {
  daoAvatarAddress: Address;
  scheme: ISchemeState;
}

export default class SchemeInfo extends React.Component<IProps, null> {

  public render() {
    const { daoAvatarAddress, scheme } = this.props;

    return <div>
      <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/scheme/${scheme.id}/info`}>{schemeName(scheme, scheme.address)}</BreadcrumbsItem>

      <div className={css.schemeInfoContainer}>
        <h3>{schemeName(scheme, scheme.address)}</h3>
        Address <a href={linkToEtherScan(scheme.address)} target="_blank">icon</a>: {scheme.address}<br/>
        Param Hash: {scheme.paramsHash}
      </div>

      <div className={css.schemeInfoContainer}>
        <h3>Genesis Protocol Params -- <a href="https://daostack.zendesk.com/hc/en-us/articles/360002000537" target="_blank">Learn more</a></h3>
      </div>
    </div>
  }
}

