import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CssBaseline, StylesProvider } from '@material-ui/core';
import Theme from './helpers/Theme';
import getStore from './store/index';
import { Provider as ReduxProvider } from "react-redux";
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';
import Dashboard from './Dashboard';
import _ from 'lodash';

const reduxStore = getStore();

export default function App() {
    return (
        <Theme>
            <StylesProvider injectFirst>
                <CssBaseline />
                  <ReduxProvider store={reduxStore}>
                    <Router>
                      <Dashboard />
                    </Router>
                  </ReduxProvider>
            </StylesProvider>
        </Theme>
    )
}