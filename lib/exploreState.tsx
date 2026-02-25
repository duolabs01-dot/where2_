import React, { ReactNode } from 'react';
import { DiscoveryProvider, useDiscoveryContext } from '../src/state/DiscoveryContext';

export const ExploreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <DiscoveryProvider>{children}</DiscoveryProvider>;
};

export const useExploreState = () => {
  const { state, setOrigin, setFocusedPlace } = useDiscoveryContext();
  return {
    state: {
      origin: state.origin,
      focusedPlaceId: state.focusedPlaceId,
    },
    setOrigin,
    setFocusedPlace,
  };
};
