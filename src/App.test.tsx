import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { App } from './App';

test('renders the desktop surface', () => {
  render(<App />);
  expect(screen.getByTestId('desktop')).toBeInTheDocument();
});
