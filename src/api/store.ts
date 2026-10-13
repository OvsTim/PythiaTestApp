import {configureStore} from '@reduxjs/toolkit';

import {messagesApi} from './messages/messagesApi';

export const store = configureStore({
  reducer: {
    [messagesApi.reducerPath]: messagesApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(messagesApi.middleware),
});

export type AppDispatch = typeof store.dispatch;
