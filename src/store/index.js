/**
 * Redux store setup.
 */

import { createStore, combineReducers, applyMiddleware } from "redux";

// Logger with default options
import qualitiesReducer from './reducers/qualities';
import notifyReducer from './reducers/notification';

export default function getStore() {
  let initialState = {
    qualities: [],
    notify: {
      type: null,
      message: null,
    },
  };
  const store = createStore(combineReducers({
    qualities: qualitiesReducer,
    notify: notifyReducer,
  }), initialState);
  return store;
}