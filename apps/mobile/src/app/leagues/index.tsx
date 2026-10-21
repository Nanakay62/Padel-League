import React from 'react';
import { Redirect } from 'expo-router';

export { SAMPLE_BOXES } from '../(tabs)/leagues';

export default function LeaguesIndexScreen() {
  return <Redirect href="/(tabs)/leagues" />;
}
