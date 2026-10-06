import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { EventDisplayScreen } from '@/features/display/EventDisplayScreen';

export default function EventDisplayRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <EventDisplayScreen eventId={id || 'default'} />;
}
