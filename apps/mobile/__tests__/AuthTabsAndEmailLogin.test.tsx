import { renderRouter, fireEvent, waitFor, act } from 'expo-router/testing-library';

jest.mock('@/components/animated-icon', () => ({
  AnimatedSplashOverlay: () => null,
  AnimatedIcon: () => null,
}));

const mockLogin = jest.fn();
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: mockLogin,
    logout: jest.fn(),
    deleteAccount: jest.fn(),
    refreshProfile: jest.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.setTimeout(60000);

describe('AuthTabsAndEmailLogin Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).fetch = jest.fn();
  });

  it('renders dual tabs and enforces email & password validation errors', async () => {
    const { findByTestId, queryByTestId, findByText, getByTestId } = await renderRouter('src/app', {
      initialUrl: '/login',
    });

    // 1. Initial State: Phone and Email tabs are visible; Phone mode by default
    const tabPhone = await findByTestId('tab-phone');
    const tabEmail = await findByTestId('tab-email');
    expect(tabPhone).toBeTruthy();
    expect(tabEmail).toBeTruthy();
    expect(await findByTestId('phone-input')).toBeTruthy();
    expect(queryByTestId('email-input')).toBeNull();

    // 2. Switch to Email & Password Tab
    await act(async () => {
      fireEvent.press(tabEmail);
    });
    expect(await findByTestId('email-input')).toBeTruthy();
    expect(await findByTestId('password-input')).toBeTruthy();
    expect(await findByTestId('email-submit-button')).toBeTruthy();
    expect(queryByTestId('phone-input')).toBeNull();

    // 3. Validation: Empty email
    await act(async () => {
      fireEvent.press(getByTestId('email-submit-button'));
    });
    expect(await findByText('Please enter a valid email address')).toBeTruthy();

    // Validation: Invalid email format
    await act(async () => {
      fireEvent.changeText(getByTestId('email-input'), 'notanemail');
    });
    await act(async () => {
      fireEvent.press(getByTestId('email-submit-button'));
    });
    expect(await findByText('Please enter a valid email address')).toBeTruthy();

    // Validation: Short password
    await act(async () => {
      fireEvent.changeText(getByTestId('email-input'), 'player@example.com');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('password-input'), '12345');
    });
    await act(async () => {
      fireEvent.press(getByTestId('email-submit-button'));
    });
    expect(await findByText('Password must be at least 8 characters')).toBeTruthy();
  });

  it('successfully registers new user with email, name, and password', async () => {
    const { findByTestId, getByTestId } = await renderRouter('src/app', {
      initialUrl: '/login',
    });

    await act(async () => {
      fireEvent.press(await findByTestId('tab-email'));
    });

    await act(async () => {
      fireEvent.press(getByTestId('switch-to-register'));
    });

    expect(await findByTestId('email-name-input')).toBeTruthy();

    (global as any).fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'If this email is not registered, an activation link has been sent.',
      }),
    });

    await act(async () => {
      fireEvent.changeText(getByTestId('email-name-input'), 'Kofi Mensah');
      fireEvent.changeText(getByTestId('email-input'), 'kofi.mensah@example.com');
      fireEvent.changeText(getByTestId('password-input'), 'PadelMaster2026!');
    });
    await act(async () => {
      fireEvent.press(getByTestId('email-submit-button'));
    });

    await waitFor(() => {
      expect((global as any).fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'kofi.mensah@example.com',
            password: 'PadelMaster2026!',
            name: 'Kofi Mensah',
          }),
        })
      );
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  it('successfully signs in existing user with email and password', async () => {
    const { findByTestId, getByTestId } = await renderRouter('src/app', {
      initialUrl: '/login',
    });

    await act(async () => {
      fireEvent.press(await findByTestId('tab-email'));
    });

    (global as any).fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'login-jwt-token',
        refresh_token: 'login-refresh-token',
        is_new_user: false,
      }),
    });

    await act(async () => {
      fireEvent.changeText(getByTestId('email-input'), 'kwame.mensah@example.com');
      fireEvent.changeText(getByTestId('password-input'), 'ExistingPassword123');
    });
    await act(async () => {
      fireEvent.press(getByTestId('email-submit-button'));
    });

    await waitFor(() => {
      expect((global as any).fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'kwame.mensah@example.com',
            password: 'ExistingPassword123',
          }),
        })
      );
      expect(mockLogin).toHaveBeenCalledWith('login-jwt-token', 'login-refresh-token');
    });
  });

  it('supports requesting password reset via email', async () => {
    const { findByTestId, getByTestId, findByText } = await renderRouter('src/app', {
      initialUrl: '/login',
    });

    await act(async () => {
      fireEvent.press(await findByTestId('tab-email'));
    });

    await act(async () => {
      fireEvent.press(getByTestId('forgot-password-button'));
    });

    expect(await findByTestId('email-reset-input')).toBeTruthy();
    expect(await findByTestId('send-reset-button')).toBeTruthy();

    (global as any).fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'If an account exists, a password reset link has been dispatched.',
      }),
    });

    await act(async () => {
      fireEvent.changeText(getByTestId('email-reset-input'), 'reset.player@example.com');
    });
    await act(async () => {
      fireEvent.press(getByTestId('send-reset-button'));
    });

    await waitFor(() => {
      expect((global as any).fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/password-reset/request'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'reset.player@example.com',
          }),
        })
      );
    });

    expect(
      await findByText(/Reset instructions have been sent to your email/i)
    ).toBeTruthy();
  });
});
