import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Tokens, Typography } from '@/constants/theme';

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
              placeholderTextColor={Tokens.colors.textMuted}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Tokens.spacing.lg,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Tokens.colors.card,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    padding: Tokens.spacing.xl,
  },
  title: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.lg,
    lineHeight: Tokens.lineHeight.lg,
    color: Tokens.colors.text,
    marginBottom: Tokens.spacing.sm,
  },
  message: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
    marginBottom: Tokens.spacing.base,
  },
  input: {
    backgroundColor: Tokens.colors.background,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    borderRadius: Tokens.radii.input,
    paddingHorizontal: Tokens.spacing.md,
    paddingVertical: Tokens.spacing.sm,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    minHeight: Tokens.touch.minTarget,
    marginBottom: Tokens.spacing.base,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Tokens.spacing.sm,
    marginTop: Tokens.spacing.xs,
  },
  button: {
    minHeight: Tokens.touch.minTarget,
    paddingHorizontal: Tokens.spacing.base,
    paddingVertical: Tokens.spacing.sm,
    borderRadius: Tokens.radii.button,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
  },
  defaultButton: {
    backgroundColor: Tokens.colors.primary,
  },
  defaultButtonText: {
    color: Tokens.colors.textOnPrimary,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  cancelButton: {
    backgroundColor: Tokens.colors.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  cancelButtonText: {
    color: Tokens.colors.textMuted,
  },
  destructiveButton: {
    backgroundColor: Tokens.colors.danger,
  },
  destructiveButtonText: {
    color: Tokens.colors.card,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
});
