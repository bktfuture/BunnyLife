// Copyright 2019-2022 @subwallet/sub-connect authors & contributors
// SPDX-License-Identifier: Apache-2.0

import EvmWalletInfo from "./pages/EvmWalletInfo";
import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import Layout from "./components/layout/Layout";
import Welcome from './pages/Welcome';
import WalletInfo from './pages/WalletInfo';

require('./App.scss');

// Add new example wallet
// doAddWallet();

export function App () {
  return (
      <HashRouter>
        <Routes>
          <Route
            element={<Layout />}
            path='/'
          >
            <Route
              element={<Welcome />}
              index
            />
            <Route
              element={<Welcome />}
              path='/welcome'
            />
            <Route
              element={<WalletInfo />}
              path='/wallet-info'
            />
            <Route
              element={<EvmWalletInfo />}
              path='/evm-wallet-info'
            />
          </Route>
        </Routes>
      </HashRouter>
  );
}
