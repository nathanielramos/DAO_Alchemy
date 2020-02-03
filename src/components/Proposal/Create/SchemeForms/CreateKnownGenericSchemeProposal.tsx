import * as React from "react";
import { connect } from "react-redux";
// const BN = require("bn.js");
import { IProposalType, ISchemeState } from "@daostack/client";
import { enableWalletProvider, getArc } from "arc";

import { ErrorMessage, Field, FieldArray, Form, Formik, FormikErrors, FormikProps, FormikTouched } from "formik";
import * as classNames from "classnames";
import Interweave from "interweave";

import { Action, ActionField, GenericSchemeInfo } from "genericSchemeRegistry";

import { IRootState } from "reducers";
import { NotificationStatus, showNotification } from "reducers/notifications";
import * as arcActions from "actions/arcActions";

import Analytics from "lib/analytics";
import { isValidUrl } from "lib/util";
import { exportUrl, importUrlValues } from "lib/proposalUtils";

import TagsSelector from "components/Proposal/Create/SchemeForms/TagsSelector";
import TrainingTooltip from "components/Shared/TrainingTooltip";
import * as css from "../CreateProposal.scss";
import MarkdownField from "./MarkdownField";


interface IStateProps {
  daoAvatarAddress: string;
  genericSchemeInfo: GenericSchemeInfo;
  handleClose: () => any;
  scheme: ISchemeState;
}

const mapStateToProps = (state: IRootState, ownProps: IStateProps) => {
  return ownProps;
};

interface IDispatchProps {
  createProposal: typeof arcActions.createProposal;
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  createProposal: arcActions.createProposal,
  showNotification,
};

type IProps = IStateProps & IDispatchProps;

interface IFormValues {
  description: string;
  title: string;
  url: string;
  [key: string]: any;
}

interface IState {
  actions: Action[];
  currentAction: Action;
  tags: Array<string>;
}

class CreateKnownSchemeProposal extends React.Component<IProps, IState> {

  initialFormValues: IFormValues;

  constructor(props: IProps) {
    super(props);

    if (!props.genericSchemeInfo) {
      throw Error("GenericSchemeInfo should be provided");
    }
    this.setInititialFormValues();
    const actions = props.genericSchemeInfo.actions();
    const initialActionId = this.initialFormValues.currentActionId;
    this.state = {
      actions: props.genericSchemeInfo.actions(),
      currentAction: initialActionId ? actions.find(action => action.id === initialActionId) : actions[0],
      tags: this.initialFormValues.tags,
    };
  }

  private handleSubmit = async (values: IFormValues, { setSubmitting }: any ): Promise<void> => {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

    const currentAction = this.state.currentAction;

    const callValues = [];
    for (const field of currentAction.getFields()) {
      const callValue = field.callValue(values[field.name]);
      values[field.name] = callValue;
      callValues.push(callValue);
    }

    let callData = "";
    try {
      callData = this.props.genericSchemeInfo.encodeABI(currentAction, callValues);
    } catch (err) {
      showNotification(NotificationStatus.Failure, err.message);
      setSubmitting(false);
      return;
    }
    setSubmitting(false);

    const proposalValues = {
      ...values,
      callData,
      dao: this.props.daoAvatarAddress,
      scheme: this.props.scheme.address,
      tags: this.state.tags,
      type: IProposalType.GenericScheme,
      value: 0, // amount of eth to send with the call
    };

    try {
      await this.props.createProposal(proposalValues);
    } catch (err) {
      showNotification(NotificationStatus.Failure, err.message);
      throw err;
    }

    Analytics.track("Submit Proposal", {
      "DAO Address": this.props.daoAvatarAddress,
      "Proposal Title": values.title,
      "Scheme Address": this.props.scheme.address,
      "Scheme Name": this.props.scheme.name,
    });

    this.props.handleClose();
  }

  public handleTabClick = (tab: string) => (_e: any) => {
    this.setState({ currentAction: this.props.genericSchemeInfo.action(tab) });
  }

  public renderField(field: ActionField, values: IFormValues, touched: FormikTouched<IFormValues>, errors: FormikErrors<IFormValues>) {
    let type = "string";
    switch (field.type) {
      case "uint256":
        type = "number";
        break;
      case "bool":
        return <div className={css.radioButtons}>
          <Field
            id={field.name + "_true"}
            name={field.name}
            checked={parseInt(values[field.name], 10) === 1}
            type="radio"
            value={1}
          />
          <label htmlFor={field.name + "_true"}>
            {field.labelTrue}
          </label>

          <Field
            id={field.name + "_false"}
            name={field.name}
            checked={parseInt(values[field.name], 10) === 0}
            type="radio"
            value={0}
          />
          <label htmlFor={field.name + "_false"}>
            {field.labelFalse}
          </label>
        </div>;
      default:
        if (field.type.includes("[]")) {
          // eslint-disable-next-line react/jsx-no-bind
          return <FieldArray name={field.name} render={(arrayHelpers) => (
            <div className={css.arrayFieldContainer}>
              {values[field.name] && values[field.name].length > 0 ? (
                values[field.name].map((value: any, index: number) => (
                  <div key={field.name + "_" + index} className={css.arrayField}>
                    {this.renderField(
                      new ActionField({name: `${field.name}.${index}`, type: field.type.slice(0, -2), label: "", placeholder: field.placeholder}),
                      values,
                      touched,
                      errors
                    )}
                    <button
                      className={css.removeItemButton}
                      type="button"
                      onClick={() => arrayHelpers.remove(index)} // remove an item from the list
                    >
                      -
                    </button>
                  </div>
                ))
              ) : ""}
              <button className={css.addItemButton} data-test-id={field.name + ".add"} type="button" onClick={() => arrayHelpers.push("")}>
                Add {field.label}
              </button>
            </div>
          )}
          />;
        }
        break;
    }

    return <Field
      id={field.name}
      data-test-id={field.name}
      placeholder={field.placeholder}
      name={field.name}
      type={type}
      className={touched[field.name] && errors[field.name] ? css.error : null}
    />;
  }

  private onTagsChange = (tags: any[]): void => {
    this.setState({tags});
  }

  private setInititialFormValues(){
    this.initialFormValues = {
      description: "",
      title: "",
      url: "",
      currentActionId:"",
      tags: [],
    };
    const actions = this.props.genericSchemeInfo.actions();
    const daoAvatarAddress = this.props.daoAvatarAddress;
    actions.forEach((action) => action.getFields().forEach((field: ActionField) => {
      if (typeof(field.defaultValue) !== "undefined") {
        if (field.defaultValue === "_avatar") {
          this.initialFormValues[field.name] = daoAvatarAddress;
        } else {
          this.initialFormValues[field.name] = field.defaultValue;
        }
      } else {
        switch (field.type) {
          case "uint64":
          case "uint256":
          case "bytes32":
          case "bytes":
          case "address":
          case "string":
            this.initialFormValues[field.name] = "";
            break;
          case "bool":
            this.initialFormValues[field.name] = 0;
            break;
          case "address[]":
            this.initialFormValues[field.name] = [""];
            break;
        }
      }
    }));
    this.initialFormValues = importUrlValues<IFormValues>(this.initialFormValues);
  }
  public exportFormValues(values: IFormValues) {
    values = {
      ...values,
      currentActionId: this.state.currentAction.id,
      ...this.state,
    };
    exportUrl(values);
    this.props.showNotification(NotificationStatus.Success, "Exportable url is now in clipboard :)");
  }

  public render(): RenderOutput {
    const { handleClose } = this.props;
    const arc = getArc();

    const actions = this.state.actions;
    const currentAction = this.state.currentAction;

    return (
      <div className={css.createWrapperWithSidebar}>
        <div className={css.sidebar}>
          { actions.map((action) =>
            <button
              data-test-id={"action-tab-" + action.id}
              key={action.id}
              className={classNames({
                [css.tab]: true,
                [css.selected]: currentAction.id === action.id,
              })}
              onClick={this.handleTabClick(action.id)}>
              <span></span>
              { action.label }
            </button>
          )}
        </div>

        <div className={css.formWrapper}>
          <Formik
            initialValues={this.initialFormValues}
            // eslint-disable-next-line react/jsx-no-bind
            validate={(values: IFormValues): void => {
              const errors: any = {};

              const valueIsRequired = (name: string) => {
                const value = values[name];
                if (value === 0) {
                  return;
                }
                if (!value || (Array.isArray(value) && value.length === 0)) {
                  errors[name] = "Required";
                }
              };

              valueIsRequired("description");
              valueIsRequired("title");

              if (values.title.length > 120) {
                errors.title = "Title is too long (max 120 characters)";
              }

              if (!isValidUrl(values.url)) {
                errors.url = "Invalid URL";
              }

              for (const field of this.state.currentAction.getFields()) {
                if (field.type !== "bool" && !field.optional) {
                  valueIsRequired(field.name);
                }

                // Check if value can be interpreted correctly for this particular field
                let value = values[field.name];
                try {
                  value = field.callValue(value);
                } catch (error) {
                  if (error.message === "Assertion failed") {
                    // thank you BN.js for your helpful error messages
                    errors[field.name] = "Invalid number value";
                  } else {
                    errors[field.name] = error.message;
                  }
                }

                if (field.type === "address") {
                  if (!arc.web3.utils.isAddress(value)) {
                    errors[field.name] = "Invalid address";
                  }
                }

                if (field.type.includes("bytes")) {
                  if (!arc.web3.utils.isHexStrict(value)) {
                    errors[field.name] = "Must be a hex value";
                  }
                }

                if (field.type === "address[]") {
                  for (const i of value) {
                    if (!arc.web3.utils.isAddress(i)) {
                      errors[field.name] = "Invalid address";
                    }
                  }
                }
              }
              return errors;
            }}
            onSubmit={this.handleSubmit}
            // eslint-disable-next-line react/jsx-no-bind
            render={({
              errors,
              touched,
              isSubmitting,
              setFieldValue,
              values,
            }: FormikProps<IFormValues>) => {
              return (
                <Form noValidate>
                  <label className={css.description}>What to Expect</label>
                  <div className={css.description}>
                    <Interweave content={currentAction.description} />
                  </div>
                  <label htmlFor="titleInput">
                      Title
                    <ErrorMessage name="title">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                    <div className={css.requiredMarker}>*</div>
                  </label>
                  <Field
                    autoFocus
                    id="titleInput"
                    maxLength={120}
                    placeholder="Summarize your proposal"
                    name="title"
                    type="text"
                    className={touched.title && errors.title ? css.error : null}
                  />

                  <label htmlFor="descriptionInput">
                      Description
                    <div className={css.requiredMarker}>*</div>
                    <img className={css.infoTooltip} src="/assets/images/Icon/Info.svg"/>
                    <ErrorMessage name="description">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                  <Field
                    component={MarkdownField}
                    onChange={(value: any) => { setFieldValue("description", value); }}
                    id="descriptionInput"
                    placeholder="Describe your proposal in greater detail"
                    name="description"
                    className={touched.description && errors.description ? css.error : null}
                  />

                  <label className={css.tagSelectorLabel}>
                    Tags
                  </label>

                  <div className={css.tagSelectorContainer}>
                    <TagsSelector onChange={this.onTagsChange} tags={this.state.tags}></TagsSelector>
                  </div>

                  <label htmlFor="urlInput">
                    URL
                    <ErrorMessage name="url">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                  <Field
                    id="urlInput"
                    maxLength={120}
                    placeholder="Description URL"
                    name="url"
                    type="text"
                    className={touched.url && errors.url ? css.error : null}
                  />

                  <div key={currentAction.id}
                    className={classNames({
                      [css.tab]: true,
                      [css.selected]: this.state.currentAction.id === currentAction.id,
                    })
                    }
                  >
                    {
                      currentAction.getFields().map((field: ActionField) => {
                        return (
                          <div key={field.name}>
                            <label htmlFor={field.name}>
                              { field.label }
                              <ErrorMessage name={field.name}>{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                              {field.type !== "bool" && !field.optional ? <div className={css.requiredMarker}>*</div> : ""}
                            </label>
                            {this.renderField(field, values, touched, errors)}
                          </div>
                        );
                      })
                    }
                  </div>

                  <div className={css.createProposalActions}>
                    <TrainingTooltip overlay="Export proposal" placement="top">
                      <button id="export-proposal" className={css.exportProposal} type="button" onClick={() => this.exportFormValues(values)}>
                        <img src="/assets/images/Icon/share-blue.svg" />
                      </button>
                    </TrainingTooltip>
                    <button className={css.exitProposalCreation} type="button" onClick={handleClose}>
                      Cancel
                    </button>
                    <TrainingTooltip overlay="Once the proposal is submitted it cannot be edited or deleted" placement="top">
                      <button className={css.submitProposal} type="submit" disabled={isSubmitting}>
                        Submit proposal
                      </button>
                    </TrainingTooltip>
                  </div>
                </Form>
              );
            }}
          />
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateKnownSchemeProposal);
