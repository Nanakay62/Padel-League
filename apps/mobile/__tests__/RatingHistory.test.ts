describe('Rating History & Level Bands Mobile Logic', () => {
  const getRatingBandInfo = (rating: number) => {
    if (rating <= 2.0) return { band: 'Beginner', color: '#10B981' };
    if (rating <= 3.0) return { band: 'Improver', color: '#3B82F6' };
    if (rating <= 4.0) return { band: 'Intermediate', color: '#8B5CF6' };
    if (rating <= 5.5) return { band: 'Advanced', color: '#F59E0B' };
    return { band: 'Expert', color: '#EF4444' };
  };

  const formatRatingDelta = (delta: number) => {
    if (delta > 0) return `+${delta.toFixed(2)}`;
    return delta.toFixed(2);
  };

  it('correctly categorises rating level bands', () => {
    expect(getRatingBandInfo(1.5).band).toBe('Beginner');
    expect(getRatingBandInfo(2.0).band).toBe('Beginner');
    expect(getRatingBandInfo(2.65).band).toBe('Improver');
    expect(getRatingBandInfo(3.5).band).toBe('Intermediate');
    expect(getRatingBandInfo(4.8).band).toBe('Advanced');
    expect(getRatingBandInfo(6.2).band).toBe('Expert');
  });

  it('formats positive and negative rating deltas cleanly', () => {
    expect(formatRatingDelta(0.08)).toBe('+0.08');
    expect(formatRatingDelta(-0.05)).toBe('-0.05');
    expect(formatRatingDelta(0.0)).toBe('0.00');
  });
});
