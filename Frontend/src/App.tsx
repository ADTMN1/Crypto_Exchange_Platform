import React, { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import Router from "./router";
import { Toaster } from "sonner";
import StoreProvider from "./components/StoreProvider";
import { SocketProvider } from "./components/providers/SocketProvider";

export default function App() {
  useEffect(() => {
    // Add global error handler for debugging
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      if (event.error && event.error.message && event.error.message.includes("Cannot read properties of undefined (reading 'list')")) {
        console.error('🚨 FOUND THE LIST ERROR IN GLOBAL HANDLER:', event.error.stack);
        console.error('Error occurred at:', event.filename, 'line:', event.lineno, 'column:', event.colno);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <BrowserRouter>
      <StoreProvider>
        <SocketProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </SocketProvider>
      </StoreProvider>
    </BrowserRouter>
  );
}
