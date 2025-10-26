import React from 'react';
import LoginTechnician from './components/LoginTechnician';
import TechnicianDashboard from './components/TechnicianDashboard';

function AppTechnician() {
  return (
    <>
      <LoginTechnician />
      {/* ou <TechnicianDashboard /> selon le contexte */}
    </>
  );
}

export default AppTechnician;
