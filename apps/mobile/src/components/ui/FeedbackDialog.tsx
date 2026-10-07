import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PadelBrand } from '@/constants/theme';

export interface DialogButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: (inputValue?: string) => void | Promise<void>;
}

export interface DialogConfig {
  title: string;
  message?: string;
  buttons?: DialogButton[];
  prompt?: {
    placeholder?: string;
    defaultValue?: string;
  };
}

interface FeedbackDialogProps {
  visible: boolean;
  config: DialogConfig | null;
  onClose: () => void;
}

export function FeedbackDialog({ visible, config, onClose }: FeedbackDialogProps) {
  if (!visible || !config) return null;
  return <FeedbackDialogModal config={config} onClose={onClose} />;
}

function FeedbackDialogModal({ config, onClose }: { config: DialogConfig; onClose: () => void }) {
  const [inputValue, setInputValue] = React.useState(config.prompt?.defaultValue ?? '');

  const buttons = config.buttons && config.buttons.length > 0
    ? config.buttons
    : [{ text: 'OK', style: 'default' as const, onPress: () => onClose() }];

  const handleButtonPress = async (btn: DialogButton) => {
    onClose();
    if (btn.onPress) {
      await btn.onPress(inputValue);
    }
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={true}
      onRequestClose={onClose}
      testID="feedback-dialog-modal"
    >
      <View style={styles.overlay}>
        <View style={styles.dialogCard} testID="feedback-dialog-card">
          <Text style={styles.title} testID="feedback-dialog-title">
            {config.title}
          </Text>

          {!!config.message && (
            <Text style={styles.message} testID="feedback-dialog-message">
              {config.message}
            </Text>
          )}

          {!!config.prompt && (
            <TextInput
              style={styles.input}
              placeholder={config.prompt.placeholder || 'Enter text...'}
              placeholderTextColor="#64748B"
              value={inputValue}
              onChangeText={setInputValue}
              autoFocus
              testID="feedback-dialog-input"
            />
          )}

          <View style={styles.buttonRow}>
            {buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';

              return (
                <Pressable
                  key={`${btn.text}-${index}`}
                  style={[
                    styles.button,
                    isCancel && styles.cancelButton,
                    isDestructive && styles.destructiveButton,
                    !isCancel && !isDestructive && styles.defaultButton,
                  ]}
                  onPress={() => handleButtonPress(btn)}
                  testID={`feedback-dialog-btn-${index}`}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isCancel && styles.cancelButtonText,
                      isDestructive && styles.destructiveButtonText,
                      !isCancel && !isDestructive && styles.defaultButtonText,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function useFeedbackDialog() {
  const [config, setConfig] = React.useState<DialogConfig | null>(null);
  const [visible, setVisible] = React.useState(false);

  const showDialog = React.useCallback((dialogConfig: DialogConfig) => {
    setConfig(dialogConfig);
    setVisible(true);
  }, []);

  const hideDialog = React.useCallback(() => {
    setVisible(false);
    setConfig(null);
  }, []);

  return {
    showDialog,
    hideDialog,
    dialogProps: {
      visible,
      config,
      onClose: hideDialog,
    },
  };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: '#CBD5E1',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#0B0F0E',
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
  },
  defaultButton: {
    backgroundColor: PadelBrand.electricGreen,
  },
  defaultButtonText: {
    color: '#0B0F0E',
    fontWeight: '700',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: '#1E2925',
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  cancelButtonText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 14,
  },
  destructiveButton: {
    backgroundColor: '#DC2626',
  },
  destructiveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
