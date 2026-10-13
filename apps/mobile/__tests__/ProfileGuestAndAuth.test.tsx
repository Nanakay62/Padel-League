import React from 'react';
import { Alert } from 'react-native';
import { renderRouter } from 'expo-router/testing-library';
import { courtsideScoreQueue } from '@/lib/offlineQueue';
import { fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('@/components/animated-icon', () => ({
  AnimatedSplashOverlay: () => null,
  AnimatedIcon: () => null,
}));

// Mock useAuth
const mockLogout = jest.fn();
const mockDeleteAccount = jest.fn();
let mockAuthState = {
  user: null as any,
  isAuthenticated: false,
  isLoading: false,
  login: jest.fn(),
  logout: mockLogout,
  deleteAccount: mockDeleteAccount,
  refreshProfile: jest.fn(),
};

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuthState,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.setTimeout(60000);

describe('Profile Screen Guest State and Session Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    courtsideScoreQueue.clear();
  });

  it('renders guest profile cleanly with NO hardcoded user or rating strings', async () => {
    mockAuthState = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      logout: mockLogout,
      deleteAccount: mockDeleteAccount,
      refreshProfile: jest.fn(),
    };

    const { findByText, queryByText } = await renderRouter('src/app', {
      initialUrl: '/profile',
    });

    // Must show Guest Player and prompt to sign in with phone
    expect(await findByText('Guest Player')).toBeTruthy();
    expect(await findByText('Sign in with phone')).toBeTruthy();
    expect(await findByText('Set your level')).toBeTruthy();
    expect(await findByText('GUEST')).toBeTruthy();

    // MUST NOT contain hardcoded sample person or rating
    expect(queryByText('Kwame Antwi-Boasiako')).toBeNull();
    expect(queryByText('+233 24 412 3456')).toBeNull();
    expect(queryByText('Level 3.42')).toBeNull();
    expect(queryByText('GH₵ 340.00')).toBeNull();
    expect(queryByText('24 Played')).toBeNull();
    expect(queryByText('16 Wins (67%)')).toBeNull();
    expect(queryByText('Premier Box')).toBeNull();
    expect(queryByText('Accra Ladder')).toBeNull();
  });

  it('navigates to login with return-to-origin redirect parameter when guest clicks sign in', async () => {
    mockAuthState = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      logout: mockLogout,
      deleteAccount: mockDeleteAccount,
      refreshProfile: jest.fn(),
    };

    const { findByTestId } = await renderRouter('src/app', {
      initialUrl: '/profile',
    });

    const signInBtn = await findByTestId('profile-guest-signin-button');
    expect(signInBtn).toBeTruthy();
  });

  it('renders authenticated profile with verified data from /me and calibrated level', async () => {
    mockAuthState = {
      user: {
        id: 'usr-real-99',
        name: 'Abena Mansa',
        phone_e164: '+233209876543',
        level: 3.25,
        is_provisional: false,
        level_band: 'Intermediate',
      },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: mockLogout,
      deleteAccount: mockDeleteAccount,
      refreshProfile: jest.fn(),
    };

    const { findByText, findByTestId } = await renderRouter('src/app', {
      initialUrl: '/profile',
    });

    expect(await findByText('Abena Mansa')).toBeTruthy();
    expect(await findByText('+233209876543')).toBeTruthy();
    expect(await findByText(/Level 3\.25/)).toBeTruthy();
    expect(await findByText('SIGNED IN')).toBeTruthy();
    expect(await findByTestId('profile-logout-button')).toBeTruthy();
    expect(await findByTestId('profile-delete-account-button')).toBeTruthy();
  });

  it('calls logout directly when offline queue is empty', async () => {
    mockAuthState = {
      user: {
        id: 'usr-real-99',
        name: 'Abena Mansa',
        phone_e164: '+233209876543',
        level: 3.25,
      },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: mockLogout,
      deleteAccount: mockDeleteAccount,
      refreshProfile: jest.fn(),
    };

    const { findByTestId } = await renderRouter('src/app', {
      initialUrl: '/profile',
    });

    const logoutBtn = await findByTestId('profile-logout-button');
    fireEvent.press(logoutBtn);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('warns about unsent offline scores before logging out without dropping queue', async () => {
    mockAuthState = {
      user: {
        id: 'usr-real-99',
        name: 'Abena Mansa',
        phone_e164: '+233209876543',
        level: 3.25,
      },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: mockLogout,
      deleteAccount: mockDeleteAccount,
      refreshProfile: jest.fn(),
    };

    // Add an offline score to queue
    courtsideScoreQueue.enqueue({
      result_id: 'res-off-1',
      match_id: 'm-1',
      team_a_score: 16,
      team_b_score: 8,
      entered_by: 'Abena',
      timestamp: Date.now(),
    });
    expect(courtsideScoreQueue.size()).toBe(1);

    const alertSpy = jest.spyOn(Alert, 'alert');

    const { findByTestId } = await renderRouter('src/app', {
      initialUrl: '/profile',
    });

    const logoutBtn = await findByTestId('profile-logout-button');
    fireEvent.press(logoutBtn);

    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unsent Scores'),
      expect.stringContaining('1 unsent courtside match score'),
      expect.any(Array)
    );

    // Queue must NOT be dropped
    expect(courtsideScoreQueue.size()).toBe(1);

    // Confirm logout anyway
    const buttons = alertSpy.mock.calls[0][2];
    const logoutAnywayBtn = buttons?.find((b) => b.text === 'Log Out Anyway');
    expect(logoutAnywayBtn).toBeDefined();
    logoutAnywayBtn?.onPress?.();

    expect(mockLogout).toHaveBeenCalledTimes(1);
    alertSpy.mockRestore();
  });

  it('prompts confirmation and invokes deleteAccount upon user confirmation', async () => {
    mockAuthState = {
      user: {
        id: 'usr-real-99',
        name: 'Abena Mansa',
        phone_e164: '+233209876543',
        level: 3.25,
      },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: mockLogout,
      deleteAccount: mockDeleteAccount,
      refreshProfile: jest.fn(),
    };

    const alertSpy = jest.spyOn(Alert, 'alert');

    const { findByTestId } = await renderRouter('src/app', {
      initialUrl: '/profile',
    });

    const deleteBtn = await findByTestId('profile-delete-account-button');
    fireEvent.press(deleteBtn);

    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining('Delete Account'),
      expect.stringContaining('Act 843'),
      expect.any(Array)
    );

    // Confirm deletion
    const buttons = alertSpy.mock.calls[0][2];
    const confirmDeleteBtn = buttons?.find((b) => b.text === 'Delete Forever');
    expect(confirmDeleteBtn).toBeDefined();
    confirmDeleteBtn?.onPress?.();

    expect(mockDeleteAccount).toHaveBeenCalledTimes(1);
    alertSpy.mockRestore();
  });
});
