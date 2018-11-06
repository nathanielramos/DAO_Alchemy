import createHistory from "history/createBrowserHistory";
import { routerMiddleware } from "react-router-redux";
import { applyMiddleware, compose, createStore } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import loggerMiddleware from "redux-logger";
import thunkMiddleware from "redux-thunk";

import reducers from "./reducers";
import { operationsTracker } from "reducers/operations";
import { successDismisser, notificationUpdater } from "reducers/notifications";
import { persistStore, createTransform } from 'redux-persist';

export const history = createHistory();

let store: any

if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'dev-profiling') {
  store = createStore(
    reducers,
    applyMiddleware(
      operationsTracker,
      notificationUpdater,
      successDismisser(15000),
      thunkMiddleware,
      routerMiddleware(history),
    ),
  )
} else {
  store = createStore(
    reducers,
    composeWithDevTools(   // makes the store available to the Chrome redux dev tools
      applyMiddleware(
        operationsTracker,
        notificationUpdater,
        successDismisser(15000),
        thunkMiddleware,
        routerMiddleware(history),
        loggerMiddleware,
      ),
    ),
  );
}
const persistor = persistStore(store);
export default store;
