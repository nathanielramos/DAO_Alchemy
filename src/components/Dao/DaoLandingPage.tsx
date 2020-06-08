import { IDAOState } from "@daostack/arc.js";
import * as React from "react";
import * as css from "./DaoLandingPage.scss";
import { Page } from "pages";
import Analytics from "lib/analytics";
import { Link } from "react-router-dom";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { DiscussionEmbed } from "disqus-react";
import { showSimpleMessage } from "lib/util";

type IExternalProps = {
  daoState: IDAOState;
};

type IProps = IExternalProps;

export default class DaoLandingPage extends React.Component<IProps, null> {

  private disqusConfig = { url: "", identifier: "", title: "" };

  public componentDidMount() {
    Analytics.track("Page View", {
      "Page Name": Page.DAOLanding,
      "DAO Address": this.props.daoState.id,
      "DAO Name": this.props.daoState.name,
    });
  }

  private handleEditContent = () => {
    showSimpleMessage(
      {
        title: "Edit Home Page",
        body:
          <>
            <div>Editing the content on this DAO’s home page will soon be possible via proposal. Stay tuned!</div>
            <div>For now, if you need a change made to a DAO’s home page content, please contact us at <a href="https://support@daostack.zendesk.com" target="_blank" rel="noopener noreferrer">support@daostack.zendesk.com</a></div>
          </>,
      }
    );
  }

  public render() {
    const daoState = this.props.daoState;

    this.disqusConfig.url = `${process.env.BASE_URL}/dao/${this.props.daoState.address}/discussion`;
    this.disqusConfig.identifier = this.props.daoState.address;
    this.disqusConfig.title = "Discuss " + this.props.daoState.name;

    return (
      <div className={css.landingPage}>

        <BreadcrumbsItem to={"/dao/" + daoState.address}>{daoState.name}</BreadcrumbsItem>

        <div className={css.infoContainer}>
          <div className={css.titleContainer}>
            <div className={css.row}>
              <div className={css.headerText}>{daoState.name}</div>
              <div className={css.editButton}>
                <button onClick={this.handleEditContent}>Edit Home Page</button>
              </div>
            </div>
          </div>

          { (daoState.address === "0xfaf05fedf06cac499b899d6a2052f23ae239b29d") ? // SoS Collective on xDAI
            <>
              <div className={css.welcome}>Welcome to the {daoState.name} digital co-op.</div>
              <div className={css.welcome}>Our first event is the <a href="https://soshackathon.com/" target="_blank" rel="noopener noreferrer">SoS Hackathon</a>: Fund your ideas and solutions to heal the world in crisis.</div>
              <ul>
                <li>Register for the hackathon <a href="https://bit.ly/GlobalSOSRegistration" target="_blank" rel="noopener noreferrer">here</a>.</li>
                <li>Create an onboarding proposal for the cooperative <Link to={`/dao/${daoState.id}/scheme/0xd4b6ee901566c88f942c2a04803f65cb7a554d8bc9a8f4fb5ded5cd012ca0897/proposals/create/?beneficiary=&description=This%20is%20an%20introduction%20proposal%20to%20join%20the%20builder%20collective%20and%20SoS%20hackathon.%20Please%20fill%20out%20%3CYOUR%20NAME%3E,%20%3CLINK%20TO%20YOUR%20DISCORD%20ID%3E,%20%3CYOURSKILLS%3E,%20and%20%3CWHAT%20ARE%20YOU%20EXCITED%20ABOUT%3E&ethReward=0&externalTokenAddress=0x543ff227f64aa17ea132bf9886cab5db55dcaddf&externalTokenReward=0&nativeTokenReward=0&reputationReward=50&title=Onboarding%20:%20%3CYOUR%20NAME%3E&url=&tags=[]`}>here</Link>.</li>
                <li>Join our Discord community for further discussions here: <a href="https://discord.gg/rUr3rp7" target="_blank" rel="noopener noreferrer">https://discord.gg/rUr3rp7</a></li>
              </ul>
            </>
            :
            <>
              <div className={css.welcome}>Welcome to {daoState.name}, a decentralized organization built on DAOstack.</div>

              <div className={css.visitProposals}>Visit the <Link to={`/dao/${daoState.id}/schemes/`}>Proposals page</Link> to
                make a proposal to the DAO or vote on existing proposals.</div>
            </>
          }

        </div>
        <div className={css.wallContainer}>
          <div className={css.headerText}>Discuss {daoState.name}</div>
          <DiscussionEmbed shortname={process.env.DISQUS_SITE} config={this.disqusConfig} />
        </div>
      </div>
    );
  }
}
