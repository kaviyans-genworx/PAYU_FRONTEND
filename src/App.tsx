// mport React from "react";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { store } from "@/app/store";
import { router } from "@/app/routes";

export default function App() {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
}
