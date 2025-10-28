import { render, screen } from '@testing-library/react';
import App from './App.jsx';

test('renders App without crashing', () => {
  render(<App />);
  const linkElement = screen.getByText(/signaler une panne/i);
  expect(linkElement).toBeInTheDocument();
});

