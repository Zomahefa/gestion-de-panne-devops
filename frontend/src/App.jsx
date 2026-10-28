import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ClientForm from './components/ClientForm.jsx';
import ClientView from './components/ClientView.jsx';
import LoginTechnician from './components/LoginTechnician.jsx';
import TechnicianDashboard from './components/TechnicianDashboard.jsx';
import AdminLogin from './components/AdminLogin.jsx';
import AdminRegister from './components/AdminRegister.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/theme.css';
import AdminTechnicianManager from './components/AdminTechnicianManager.jsx';
import HelpPage from './components/HelpPage.jsx';
import AdminProfile from './components/AdminProfile.jsx';
import PanneChart from './components/PanneChart.jsx';



function App() {
  return (
    <Router>
      <Routes>
        {/* Vue client */}
        <Route path="/" element={<ClientForm />} />
        <Route path="/suivi" element={<ClientView />} />

        {/* Vue technicien */}
        <Route path="/login" element={<LoginTechnician />} />
        <Route path="/technicien" element={<TechnicianDashboard />} />

        {/* Vue admin */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-register" element={<AdminRegister />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin-technicians" element={<AdminTechnicianManager />} />
        <Route path="/admin-profile" element={<AdminProfile />} />
        <Route path="/admin-chart" element={<PanneChart />} />
        <Route path="/help" element={<HelpPage />} />

        {/* Redirection si route inconnue */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
