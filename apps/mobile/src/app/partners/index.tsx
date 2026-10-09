import React, { useEffect, useState } from 'react';
import { PartnerFinder, PartnerItem } from '@/features/partners/PartnerFinder';
import { Screen, PageHeader } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';

const FALLBACK_PARTNERS: PartnerItem[] = [
  {
    id: 'u1',
    displayName: 'Kojo A.',
    level: 3.4,
    levelBand: 'Intermediate',
    preferredSide: 'LEFT',
    homeVenueName: 'Accra Padel Club',
  },
  {
    id: 'u2',
    displayName: 'Yaw B.',
    level: 3.8,
    levelBand: 'Intermediate',
    preferredSide: 'RIGHT',
    homeVenueName: 'East Legon Padel Center',
  },
  {
    id: 'u3',
    displayName: 'Esi A.',
    level: 2.9,
    levelBand: 'Improver',
    preferredSide: 'EITHER',
    homeVenueName: 'Burma Camp Padel Court',
  },
  {
    id: 'u4',
    displayName: 'Fiifi S.',
    level: 4.2,
    levelBand: 'Advanced',
    preferredSide: 'LEFT',
    homeVenueName: 'Accra Padel Club',
  },
];

export default function PartnersIndexScreen() {
  const [partners, setPartners] = useState<PartnerItem[]>(FALLBACK_PARTNERS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadPartners() {
      try {
        const res = await apiFetch('/partners?min_level=1.0&max_level=7.0');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0 && isMounted) {
            const mapped: PartnerItem[] = data.map((p: any) => ({
              id: p.id,
              displayName: p.display_name,
              level: p.level,
              levelBand: p.level_band,
              preferredSide:
                p.preferred_side === 'left'
                  ? 'LEFT'
                  : p.preferred_side === 'right'
                    ? 'RIGHT'
                    : 'EITHER',
              homeVenueName: p.home_venue_id || 'Accra Padel Club',
            }));
            setPartners(mapped);
          }
        }
      } catch {
        // Fallback to initial partners on network disconnect
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadPartners();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleInvite = (_partnerId: string) => {
    // In production, opens WhatsApp link or sends match invitation
  };

  return (
    <Screen>
      <PageHeader
        title="Find a Partner"
        subtitle={isLoading ? 'Loading players...' : 'Looking for players'}
        showBack
      />
      <PartnerFinder partners={partners} onInvite={handleInvite} />
    </Screen>
  );
}
