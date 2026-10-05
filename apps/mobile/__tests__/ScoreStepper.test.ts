describe('ScoreStepper calculations', () => {
  const pointTarget = 24;

  function adjustScore(
    currentA: number,
    deltaA: number,
    target: number
  ): { scoreA: number; scoreB: number } {
    const nextA = Math.max(0, Math.min(target, currentA + deltaA));
    const nextB = target - nextA;
    return { scoreA: nextA, scoreB: nextB };
  }

  it('keeps total points exactly equal to pointTarget', () => {
    let state = { scoreA: 12, scoreB: 12 };
    expect(state.scoreA + state.scoreB).toBe(pointTarget);

    // Increase A
    state = adjustScore(state.scoreA, 2, pointTarget);
    expect(state.scoreA).toBe(14);
    expect(state.scoreB).toBe(10);
    expect(state.scoreA + state.scoreB).toBe(pointTarget);

    // Decrease A
    state = adjustScore(state.scoreA, -5, pointTarget);
    expect(state.scoreA).toBe(9);
    expect(state.scoreB).toBe(15);
    expect(state.scoreA + state.scoreB).toBe(pointTarget);
  });

  it('clamps at zero and target', () => {
    let state = adjustScore(24, 5, pointTarget);
    expect(state.scoreA).toBe(24);
    expect(state.scoreB).toBe(0);
    expect(state.scoreA + state.scoreB).toBe(pointTarget);

    state = adjustScore(0, -5, pointTarget);
    expect(state.scoreA).toBe(0);
    expect(state.scoreB).toBe(24);
    expect(state.scoreA + state.scoreB).toBe(pointTarget);
  });
});
