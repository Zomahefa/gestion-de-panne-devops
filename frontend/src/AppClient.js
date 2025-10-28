import React from 'react';
import ClientForm from './components/ClientForm.jsx';
import ClientView from './components/ClientView.jsx';

function AppClient() {
  return (
    <>
      <ClientForm />
      {/* ou <ClientView /> selon le contexte */}
    </>
  );
}

export default AppClient;
