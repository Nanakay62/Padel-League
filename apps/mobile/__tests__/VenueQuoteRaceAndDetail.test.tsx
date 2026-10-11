import React, { useState } from 'react';
import { Button, Text, View } from 'react-native';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { useQuote, QuoteParams } from '@/hooks/useVenues';
import { apiFetch } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  apiFetch: jest.fn(),
}));

function QuoteHarness({ initialParams }: { initialParams: QuoteParams }) {
  const [params, setParams] = useState<QuoteParams>(initialParams);
  const { quote, isUpdating, error } = useQuote(params);

  return (
    <View>
      <Text testID="quote-id">{quote?.quote_id || 'none'}</Text>
      <Text testID="is-priced">{quote ? String(quote.is_priced) : 'none'}</Text>
      <Text testID="total">{quote ? String(quote.total_pesewas) : 'none'}</Text>
      <Text testID="updating">{isUpdating ? 'updating' : 'idle'}</Text>
      <Text testID="error">{error || 'none'}</Text>
      <Button
        testID="set-duration-90"
        title="Set 90"
        onPress={() => setParams((p) => ({ ...p, durationMin: 90 }))}
      />
      <Button
        testID="set-duration-120"
        title="Set 120"
        onPress={() => setParams((p) => ({ ...p, durationMin: 120 }))}
      />
    </View>
  );
}

describe('Venue Dynamic Quote Hook & Race Condition Prevention', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debounces rapid quote parameter changes and returns single final quote', async () => {
    let callCount = 0;
    (apiFetch as jest.Mock).mockImplementation(async () => {
      callCount++;
      return {
        ok: true,
        json: async () => ({
          quote_id: 'q1',
          is_priced: true,
          total_pesewas: 18000,
          lines: [{ code: 'court_fee', label: 'Court Fee', amount_pesewas: 18000 }],
          expires_at: '2026-10-10T19:00:00Z',
          price_version: 1,
          token: 'valid.token',
        }),
      };
    });

    const initialParams: QuoteParams = {
      venueId: 'v1',
      courtId: 'c1',
      start: '2026-10-24T16:00:00Z',
      durationMin: 60,
      addOns: [],
    };

    render(<QuoteHarness initialParams={initialParams} />);

    // Rapidly switch duration to 90 min before 300ms debounce
    await new Promise((r) => setTimeout(r, 60));
    fireEvent.press(screen.getByTestId('set-duration-90'));

    // Rapidly switch duration to 120 min before debounce completes
    await new Promise((r) => setTimeout(r, 60));
    fireEvent.press(screen.getByTestId('set-duration-120'));

    // Wait for the debounced request to fire and settle
    await waitFor(
      () => {
        expect(screen.getByTestId('quote-id').props.children).toBe('q1');
      },
      { timeout: 3000 }
    );

    // Only 1 network request should be sent due to debounce consolidation
    expect(callCount).toBe(1);
    expect(screen.getByTestId('total').props.children).toBe('18000');
  });

  it('discards stale out-of-order responses using monotonic sequence tracking', async () => {
    let resolveFirst: (val: any) => void;
    let resolveSecond: (val: any) => void;

    const promise1 = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    const promise2 = new Promise((resolve) => {
      resolveSecond = resolve;
    });

    let calls = 0;
    (apiFetch as jest.Mock).mockImplementation(() => {
      calls++;
      return calls === 1 ? promise1 : promise2;
    });

    const initialParams: QuoteParams = {
      venueId: 'v1',
      courtId: 'c1',
      start: '2026-10-24T16:00:00Z',
      durationMin: 60,
      addOns: [],
    };

    render(<QuoteHarness initialParams={initialParams} />);

    // Wait for first request to fire past 300ms debounce
    await waitFor(() => expect(calls).toBe(1), { timeout: 1500 });

    // Now trigger second parameter change
    fireEvent.press(screen.getByTestId('set-duration-90'));

    // Wait for second request to fire past 300ms debounce
    await waitFor(() => expect(calls).toBe(2), { timeout: 1500 });

    // Second request finishes FIRST (fast response)
    resolveSecond!({
      ok: true,
      json: async () => ({
        quote_id: 'q_second',
        is_priced: true,
        total_pesewas: 27000,
        lines: [],
        expires_at: '2026-10-10T19:00:00Z',
        price_version: 1,
        token: 'token_second',
      }),
    });

    await waitFor(() => {
      expect(screen.getByTestId('quote-id').props.children).toBe('q_second');
    });

    // First request finishes AFTER second (stale out-of-order arrival)
    resolveFirst!({
      ok: true,
      json: async () => ({
        quote_id: 'q_first_stale',
        is_priced: true,
        total_pesewas: 18000,
        lines: [],
        expires_at: '2026-10-10T19:00:00Z',
        price_version: 1,
        token: 'token_first_stale',
      }),
    });

    // Pause briefly
    await new Promise((r) => setTimeout(r, 100));

    // Stale response must be discarded; quote remains q_second
    expect(screen.getByTestId('quote-id').props.children).toBe('q_second');
    expect(screen.getByTestId('total').props.children).toBe('27000');
  });

  it('handles unpriced quotes (is_priced = false) cleanly without throwing errors', async () => {
    (apiFetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        quote_id: 'q_unpriced',
        is_priced: false,
        total_pesewas: 0,
        lines: [],
        expires_at: '2026-10-10T19:00:00Z',
        price_version: 1,
        token: 'token_unpriced',
      }),
    });

    const params: QuoteParams = {
      venueId: 'v_unpriced',
      courtId: 'c_unpriced',
      start: '2026-10-24T16:00:00Z',
      durationMin: 60,
      addOns: [],
    };

    render(<QuoteHarness initialParams={params} />);

    await waitFor(
      () => {
        expect(screen.getByTestId('is-priced').props.children).toBe('false');
        expect(screen.getByTestId('total').props.children).toBe('0');
        expect(screen.getByTestId('error').props.children).toBe('none');
      },
      { timeout: 2000 }
    );
  });
});
