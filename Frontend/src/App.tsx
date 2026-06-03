import { BrowserRouter } from "react-router-dom";
import Router from "./router";
import { Toaster, toast } from "sonner";
export default function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <Router />
    </BrowserRouter>
  );
}
