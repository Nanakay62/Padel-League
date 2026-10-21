import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { CheckoutModal } from '@/features/billing/CheckoutModal';
import { OrganizerMarkPaidModal } from '@/features/billing/OrganizerMarkPaidModal';

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn().mockResolvedValue({ type: 'opened' }),
}));

describe('CheckoutModal and Organizer Payment Flows', () => {
  it('renders transparent court fee, platform fee, and total payable in Ghana Cedis', async () => {
    await render(
      <CheckoutModal
        visible={true}
        eventTitle="Sunset Americano"
        courtFeePesewas={8000}
        platformFeePesewas={500}
        onClose={jest.fn()}
        onInitiatePayment={jest.fn()}
        onCheckOrderStatus={jest.fn()}
        onPaymentConfirmed={jest.fn()}
      />
    );

    expect(screen.getByText('Sunset Americano')).toBeTruthy();
    expect(screen.getByText('GH₵ 80.00')).toBeTruthy();
    expect(screen.getByText('GH₵ 5.00')).toBeTruthy();
    expect(screen.getByText('GH₵ 85.00')).toBeTruthy();
  });

  it('displays and deducts platform credits when available', async () => {
    await render(
      <CheckoutModal
        visible={true}
        eventTitle="Sunset Americano"
        courtFeePesewas={5000}
        platformFeePesewas={500}
        userCreditsPesewas={2000}
        onClose={jest.fn()}
        onInitiatePayment={jest.fn()}
        onCheckOrderStatus={jest.fn()}
        onPaymentConfirmed={jest.fn()}
      />
    );

    // Initial total 5500 - 2000 credit = 3500 (GH₵ 35.00)
    expect(screen.getByText('- GH₵ 20.00')).toBeTruthy();
    expect(screen.getByText('GH₵ 35.00')).toBeTruthy();
    expect(screen.getByText('Using Platform Credits (GH₵ 20.00 available)')).toBeTruthy();
  });

  it('completes payment immediately when platform credits cover 100% of event fee', async () => {
    const onPaymentConfirmed = jest.fn();
    const onClose = jest.fn();
    const onInitiatePayment = jest.fn().mockResolvedValue({
      orderId: 'ord-123',
      reference: 'padel_ref_123',
      isFullyPaid: true,
    });

    await render(
      <CheckoutModal
        visible={true}
        eventTitle="Sunset Americano"
        courtFeePesewas={5000}
        platformFeePesewas={500}
        userCreditsPesewas={6000}
        onClose={onClose}
        onInitiatePayment={onInitiatePayment}
        onCheckOrderStatus={jest.fn()}
        onPaymentConfirmed={onPaymentConfirmed}
      />
    );

    const payButton = screen.getByLabelText('Pay Now');
    fireEvent.press(payButton);

    await waitFor(() => {
      expect(onInitiatePayment).toHaveBeenCalledWith('PAYSTACK', true);
      expect(onPaymentConfirmed).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('provides a test simulation button for MoMo approval during test/preview mode', async () => {
    const onSimulateSuccess = jest.fn().mockResolvedValue(undefined);
    const onPaymentConfirmed = jest.fn();
    const onClose = jest.fn();
    const onInitiatePayment = jest.fn().mockResolvedValue({
      orderId: 'ord-momo-456',
      reference: 'padel_ref_456',
      authorizationUrl: 'https://checkout.paystack.com/mock-ref',
    });

    await render(
      <CheckoutModal
        visible={true}
        eventTitle="Sunset Americano"
        courtFeePesewas={5000}
        platformFeePesewas={500}
        onClose={onClose}
        onInitiatePayment={onInitiatePayment}
        onCheckOrderStatus={jest.fn().mockResolvedValue({ status: 'PENDING' })}
        onPaymentConfirmed={onPaymentConfirmed}
        onSimulateSuccess={onSimulateSuccess}
      />
    );

    const payButton = screen.getByLabelText('Pay Now');
    fireEvent.press(payButton);

    // Waiting approval state is shown
    const simulateButton = await screen.findByText('Simulate MoMo Approval (Test Mode)');
    expect(simulateButton).toBeTruthy();

    fireEvent.press(simulateButton);

    await waitFor(() => {
      expect(onSimulateSuccess).toHaveBeenCalledWith('ord-momo-456');
      expect(onPaymentConfirmed).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('validates and submits manual confirmation in OrganizerMarkPaidModal', async () => {
    const onConfirmPaid = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();

    await render(
      <OrganizerMarkPaidModal
        visible={true}
        playerName="Kofi Mensah"
        amountFormatted="GH₵ 55.00"
        onClose={onClose}
        onConfirmPaid={onConfirmPaid}
      />
    );

    expect(screen.getByText('Mark Payment Confirmed')).toBeTruthy();

    // Trigger validation error on empty reference
    const confirmButton = screen.getByLabelText('Confirm Paid');
    fireEvent.press(confirmButton);
    expect(await screen.findByText('Please enter payment reference or receipt code.')).toBeTruthy();

    // Fill reference & note
    const refInput = screen.getByPlaceholderText('e.g. CASH-RECEPTION or MoMo ID');
    fireEvent.changeText(refInput, 'MOMO_REC_12345');

    const noteInput = screen.getByPlaceholderText('e.g. Paid at desk to Coach Kojo');
    fireEvent.changeText(noteInput, 'Paid cash at club reception');

    await waitFor(() => {
      expect(refInput.props.value).toBe('MOMO_REC_12345');
    });

    fireEvent.press(screen.getByLabelText('Confirm Paid'));

    await waitFor(() => {
      expect(onConfirmPaid).toHaveBeenCalledWith(
        'MOMO_REC_12345',
        'Paid cash at club reception'
      );
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
