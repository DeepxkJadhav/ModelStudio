import React from 'react';
import { StudioStateProvider } from './core/studioState';
import { StudioLayout } from './ui/StudioLayout';

export const App: React.FC = () => {
  return (
    <StudioStateProvider>
      <StudioLayout />
    </StudioStateProvider>
  );
};

export default App;
