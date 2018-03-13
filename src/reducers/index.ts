import { routerReducer } from "react-router-redux";
import { combineReducers, Reducer } from "redux";

import arcReducer, { IArcState } from "./arcReducer";
import notificationsReducer, { INotificationsState } from "./notificationsReducer";
import web3Reducer, { IWeb3State } from "./web3Reducer";

export interface IRootState {
  arc: IArcState;
  notifications: INotificationsState;
  web3: IWeb3State;
  router: any;
}

const reducers = {
  arc: arcReducer,
  notifications: notificationsReducer,
  web3: web3Reducer,
  router: routerReducer,
};

export default combineReducers(reducers);
