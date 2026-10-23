import { renderRouter } from 'expo-router/testing-library';
import { fireEvent, waitFor, act } from '@testing-library/react-native';

jest.mock('@/components/animated-icon', () => ({
  AnimatedSplashOverlay: () => null,
  AnimatedIcon: () => null,
}));

jest.setTimeout(60000);

describe('Leagues Tab Layout & Challenge Workflow', () => {
  it('completes the entire leagues workflow: clean banner, single YOU badge, challenge modals, and score entry', async () => {
    const { findByText, queryByText, findByTestId, findAllByText } = await renderRouter('src/app', {
      initialUrl: '/leagues',
    });

    // 1. Verify clean banner without badge collision
    expect(await findByText('Accra Padel Leagues & Ladders')).toBeTruthy();
    expect(queryByText('ACCRA CHAMPIONSHIP CIRCUIT')).toBeNull();
    const createBtn = await findByTestId('leagues-create-challenge-btn');
    expect(createBtn).toBeTruthy();

    // 2. Verify single [YOU] badge at Rung 4 and champion at Rung 1
    expect(await findByText('Kojo A. & Yaw O.')).toBeTruthy();
    const userTeams = await findAllByText('Kwame A. & Partner');
    expect(userTeams.length).toBeGreaterThanOrEqual(1);

    const youBadges = await findAllByText('YOU');
    expect(youBadges.length).toBe(1);

    // 3. Verify Upcoming Scheduled Challenge Card
    expect(await findByText('Official Rung Duel')).toBeTruthy();
    expect(await findByText('Defender (Rung 3)')).toBeTruthy();

    // 4. Open and verify Create Ladder Challenge Modal from banner
    await act(async () => {
      fireEvent.press(createBtn);
    });
    expect(await findByText('Issue Ladder Challenge')).toBeTruthy();
    expect(await findByText('Challenger (You)')).toBeTruthy();
    expect(await findByText('Send Official Challenge')).toBeTruthy();

    const closeBtn = await findByTestId('challenge-modal-close-btn');
    await act(async () => {
      fireEvent.press(closeBtn);
    });

    // 5. Open and verify pre-filled challenge modal from table row (Rung 2)
    const challengeRung2Btn = await findByTestId('ladder-challenge-btn-rung-2');
    await act(async () => {
      fireEvent.press(challengeRung2Btn);
    });
    expect(await findByText('Issue Ladder Challenge')).toBeTruthy();
    const kofiMatches = await findAllByText(/Kofi M\. & Nii T\./);
    expect(kofiMatches.length).toBeGreaterThanOrEqual(1);

    const closeBtn2 = await findByTestId('challenge-modal-close-btn');
    await act(async () => {
      fireEvent.press(closeBtn2);
    });

    // 6. Open and verify Enter Scores modal from scheduled duel card
    const enterScoresBtn = await findByTestId('challenge-enter-scores-btn');
    await act(async () => {
      fireEvent.press(enterScoresBtn);
    });
    expect(await findByText('Enter Challenge Match Score')).toBeTruthy();
    expect(await findByText('Submit Verified Result')).toBeTruthy();

    const closeScoreBtn = await findByTestId('score-modal-close-btn');
    await act(async () => {
      fireEvent.press(closeScoreBtn);
    });
  });
});
