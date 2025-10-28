import React from 'react';
import LoginTechnician from './components/LoginTechnician.jsx';
import TechnicianDashboard from './components/TechnicianDashboard.jsx';

function AppTechnician() {
  return (
    <>
      <LoginTechnician />
      {/* ou <TechnicianDashboard /> selon le contexte */}
    </>
  );
}

export default AppTechnician;
