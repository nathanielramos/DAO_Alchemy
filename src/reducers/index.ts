import { routerReducer } from "react-router-redux";
import { combineReducers, Reducer } from "redux";

import arcReducer, { IArcState } from "./arcReducer";
import uiReducer, { IUIState } from './uiReducer';
import web3Reducer, { IWeb3State } from "./web3Reducer";
import { persistReducer, createTransform } from 'redux-persist';
import storage from "redux-persist/lib/storage";
import { INotificationsState, notificationsReducer, NotificationStatus } from "./notifications";
import { IOperationsState, operationsReducer, OperationStatus } from "./operations";

export interface IRootState {
  arc: IArcState;
  notifications: INotificationsState,
  operations: IOperationsState,
  router: any;
  ui: IUIState;
  web3: IWeb3State;
}

const reducers = {
  arc: arcReducer,
  notifications: notificationsReducer,
  operations: operationsReducer ,
  router: routerReducer,
  ui: uiReducer,
  web3: web3Reducer,
};

export default persistReducer({
  key: 'state',
  transforms: [],
  whitelist: ['operations'],
  storage,
}, combineReducers(reducers));
