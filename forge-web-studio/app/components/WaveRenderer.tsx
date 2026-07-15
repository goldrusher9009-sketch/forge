'use client';
import React from 'react';
import * as _WC from './WaveComponents';

const _map = _WC as Record<string, React.ComponentType>;

export function WaveRenderer({ tabId }: { tabId: string }) {
  const C = _map['ForgeTab_' + tabId];
  return C ? React.createElement(C) : null;
}
