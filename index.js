import React from 'react';
import { registerRootComponent } from 'expo'; 
import { ExpoRoot } from 'expo-router'; 
import './global.css';
 
export function App() { 
  const ctx = require.context('./app'); 
  return <ExpoRoot context={ctx} />; 
} 
 
registerRootComponent(App);
