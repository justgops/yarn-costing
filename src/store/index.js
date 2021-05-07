/**
 * Redux store setup.
 */

import { createStore, combineReducers, applyMiddleware } from "redux";

// Logger with default options
import settingsReducer from './reducers/settings';
import notifyReducer from './reducers/notification';

export default function getStore() {
  let initialState = {
    settings: {},
    notify: {
      type: null,
      message: null,
    },
  };
  const store = createStore(combineReducers({
    settings: settingsReducer,
    notify: notifyReducer,
  }), initialState);
  return store;
}