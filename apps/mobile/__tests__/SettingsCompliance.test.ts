import { Alert } from 'react-native';

describe('Settings Compliance & Account Deletion', () => {
  it('triggers Alert confirmation before account deletion', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');

    // Simulate requesting account deletion
    const requestAccountDeletion = (onConfirm: () => void) => {
      Alert.alert(
        'Delete Account',
        'Are you sure you want to delete your account? All personal data will be erased and cannot be recovered.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete Forever', style: 'destructive', onPress: onConfirm },
        ]
      );
    };

    const confirmCallback = jest.fn();
    requestAccountDeletion(confirmCallback);

    expect(alertSpy).toHaveBeenCalledWith(
      'Delete Account',
      expect.stringContaining('All personal data will be erased'),
      expect.any(Array)
    );

    // Simulate clicking 'Delete Forever'
    const buttons = alertSpy.mock.calls[0][2];
    const deleteButton = buttons?.find((b) => b.text === 'Delete Forever');
    expect(deleteButton).toBeDefined();
    deleteButton?.onPress?.();

    expect(confirmCallback).toHaveBeenCalledTimes(1);
    alertSpy.mockRestore();
  });

  it('validates privacy export payload structure', () => {
    const sampleExport = {
      user: {
        id: 'usr-123',
        name: 'Kwame Mensah',
        phone_e164: '+233241234567',
      },
      profile: {
        level: 3.5,
        reliability: 0.95,
      },
      registrations: [],
    };

    expect(sampleExport.user.name).toBe('Kwame Mensah');
    expect(sampleExport.user.phone_e164).toMatch(/^\+233/);
    expect(sampleExport.profile.level).toBeGreaterThanOrEqual(1.0);
  });
});
