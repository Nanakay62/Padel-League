import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { PhoneLoginScreen } from '@/features/auth/PhoneLoginScreen';

export default function LoginRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ redirect?: string }>();

  const handleSuccess = () => {
    if (params.redirect) {
      router.replace(params.redirect as any);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return <PhoneLoginScreen onSuccess={handleSuccess} />;
}
