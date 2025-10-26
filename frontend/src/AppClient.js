import React from 'react';
import ClientForm from './components/ClientForm';
import ClientView from './components/ClientView';

function AppClient() {
  return (
    <>
      <ClientForm />
      {/* ou <ClientView /> selon le contexte */}
    </>
  );
}

export default AppClient;
