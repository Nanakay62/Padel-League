import React from 'react';
import { StyleSheet, Text, View, Linking } from 'react-native';
import { Zap, Phone, MessageCircle } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { Card, Button } from '@/components/ui';
import type { VenueItem } from '../hooks/useVenueFilters';

export interface VenueBookingModalProps {
  venue: VenueItem;
  visible: boolean;
}

export function VenueBookingModal({ venue, visible }: VenueBookingModalProps) {
  if (!visible) return null;

  const handleCallClub = (phone?: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {});
    }
  };

  const handleWhatsAppClub = (phone?: string) => {
    if (phone) {
      const clean = phone.replace(/[^0-9]/g, '');
      const text = encodeURIComponent(`Hi ${venue.name}, I'd like to ask about court availability.`);
      Linking.openURL(`https://wa.me/${clean}?text=${text}`).catch(() => {});
    }
  };

  return (
    <Card style={styles.bookingModalCard}>
      <View style={styles.modalHeader}>
        <Zap size={20} color={Tokens.colors.primary} />
        <Text style={styles.modalTitle}>Court booking opens soon</Text>
      </View>
      <Text style={styles.modalDesc}>
        Online slot reservations and mobile money checkout are rolling out across Accra clubs. In the meantime, contact the club directly to hold this court.
      </Text>
      <View style={styles.modalActions}>
        {venue.bookingPhone ? (
          <Button
            title="Call Club"
            variant="primary"
            size="md"
            icon={<Phone size={16} color={Tokens.colors.textOnPrimary} />}
            onPress={() => handleCallClub(venue.bookingPhone)}
            style={styles.modalBtn}
          />
        ) : null}
        {venue.bookingWhatsapp || venue.bookingPhone ? (
          <Button
            title="WhatsApp Club"
            variant="secondary"
            size="md"
            icon={<MessageCircle size={16} color={Tokens.colors.text} />}
            onPress={() =>
              handleWhatsAppClub(venue.bookingWhatsapp || venue.bookingPhone)
            }
            style={styles.modalBtn}
          />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  bookingModalCard: {
    padding: Tokens.spacing.base,
    backgroundColor: Tokens.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Tokens.colors.primary,
    borderRadius: Tokens.radii.card,
    gap: Tokens.spacing.sm,
    marginTop: Tokens.spacing.xs,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  modalTitle: {
    ...Typography.headlineSm,
    color: Tokens.colors.text,
  },
  modalDesc: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
    lineHeight: Tokens.lineHeight.sm,
  },
  modalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.sm,
    paddingTop: Tokens.spacing.xs,
  },
  modalBtn: {
    flex: 1,
    minWidth: 120,
  },
});
