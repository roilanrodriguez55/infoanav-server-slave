import { BrowserRouter as Router, Routes, Route, BrowserRouter } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import Placeholder from "./pages/Dashboard/Placeholder";
import FormANAV from "./pages/Forms/FormAnav";
import FormFallas from "./pages/Forms/FormFallas";
import FormMant from "./pages/Forms/FormMantenimientos";
import { AuthProvider } from "./context/AuthContext";


export default function App() {
  return (
    <>
      <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Ruta principal con AppLayout */}
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Placeholder />} />
            <Route path="/dashboard" element={<Placeholder />} />
          </Route>

          {/* Rutas de autenticación (sin layout) */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Rutas de gestión (pueden ir con o sin layout según necesites) */}
          <Route path="/gestion-señales" element={<FormANAV />} />
          <Route path="/gestion-fallas" element={<FormFallas />} />
          <Route path="/gestion-mant" element={<FormMant />} />

          {/* Ruta por defecto para 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </>
  );
}
