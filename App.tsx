'use client';

import React, { useCallback, useMemo } from 'react';
import { FiltersProvider } from './lib/filtersStore';
import { DiscoveryProvider } from './src/state/DiscoveryContext';
import { Discover } from './components/Discover';

export const App: React.FC = () => {
  const handleCityChange = useCallback(() => undefined, []);
  const handleRequireAuth = useCallback(() => undefined, []);
  const handleSwitchToMap = useCallback(() => undefined, []);
  const userPreferences = useMemo<string[]>(() => [], []);

  return (
    <DiscoveryProvider>
      <FiltersProvider>
        <Discover
          userCity="Johannesburg"
          onCityChange={handleCityChange}
          userPreferences={userPreferences}
          onRequireAuth={handleRequireAuth}
          session={null}
          initialIntent={null}
          onSwitchToMap={handleSwitchToMap}
        />
      </FiltersProvider>
    </DiscoveryProvider>
  );
};

export default App;
