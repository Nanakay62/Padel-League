import React from 'react';
import { PartnerFinder, PartnerItem } from '@/features/partners/PartnerFinder';
import { Screen, PageHeader } from '@/components/ui';

const SAMPLE_PARTNERS: PartnerItem[] = [
  {
    id: 'u1',
    displayName: 'Kojo Ansah',
    level: 3.4,
    levelBand: 'Intermediate',
    preferredSide: 'LEFT',
    homeVenueName: 'Accra City Padel Club',
  },
  {
    id: 'u2',
    displayName: 'Yaw Boateng',
    level: 3.8,
    levelBand: 'Intermediate',
    preferredSide: 'RIGHT',
    homeVenueName: 'Trust Sports Emporium',
  },
  {
    id: 'u3',
    displayName: 'Esi Appiah',
    level: 2.9,
    levelBand: 'Improver',
    preferredSide: 'EITHER',
    homeVenueName: 'Burma Camp Padel Court',
  },
  {
    id: 'u4',
    displayName: 'Fiifi Sam',
    level: 4.2,
    levelBand: 'Advanced',
    preferredSide: 'LEFT',
    homeVenueName: 'Accra City Padel Club',
  },
];

export default function PartnersIndexScreen() {
  const handleInvite = (partnerId: string) => {
    // In production, opens WhatsApp link or sends match invitation
  };

  return (
    <Screen>
      <PageHeader
        title="Find a Partner"
        subtitle="Looking for players"
        showBack
      />
      <PartnerFinder partners={SAMPLE_PARTNERS} onInvite={handleInvite} />
    </Screen>
  );
}
