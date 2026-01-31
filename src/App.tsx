import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './layout/AppLayout';
import SignIn from './components/auth/SignInForm';
import SignUp from './components/auth/SignUpForm';
import ContentArea from './pages/Dashboard/ContentArea';
import FormANAV from './pages/Forms/FormAnav';
import FormFallas from './pages/Forms/FormFallas';
import FormMantenimientos from './pages/Forms/FormMantenimientos';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

              <Route element={<AppLayout />}>
                {/* Contenido dinámico según la ruta */}
                <Route path="/" element={<ContentArea />} />
                <Route path="/dashboard" element={<ContentArea />} />
                <Route path="/gestion-senales" element={<ContentArea />} />
                <Route path="/gestion-fallas" element={<ContentArea />} />
                <Route path="/gestion-mant" element={<ContentArea />} />
              </Route>
              
              {/* Formularios SIN layout (pantalla completa) */}
              <Route path="/gestion-senales/nuevo" element={<FormANAV />} />
              <Route path="/gestion-senales/editar/:id" element={<FormANAV />} />
              <Route path="/gestion-fallas/nuevo" element={<FormFallas />} />
              <Route path="/gestion-fallas/editar/:id" element={<FormFallas />} />
              <Route path="/gestion-mant/nuevo" element={<FormMantenimientos />} />
              <Route path="/gestion-mant/editar/:id" element={<FormMantenimientos />} />

            {/* Ruta 404 */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
