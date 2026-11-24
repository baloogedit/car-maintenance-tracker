import {StyleSheet, View} from 'react-native';

import {AppText} from '@/components/atoms/AppText';
import {Badge} from '@/components/atoms/Badge';
import {Button} from '@/components/atoms/Button';
import {Spacing} from '@/constants/theme';
import type {CompanyMember} from '@/types/company.types';
import {fullName} from '@/utils/formatters';

interface MemberRowProps {
  member: CompanyMember;
  isMe: boolean;
  onToggleRole: () => void;
  onRemove: () => void;
}

export function MemberRow({member, isMe, onToggleRole, onRemove}: MemberRowProps) {
  const isAdmin = member.role === 'COMPANY_ADMIN';
  return (
    <View style={styles.row}>
      <View style={styles.head}>
        <AppText style={styles.name}>
          {fullName(member)}
          {isMe ? ' (te)' : ''}
        </AppText>
        <Badge label={isAdmin ? 'Admin' : 'Tag'} tone={isAdmin ? 'primary' : 'neutral'} />
      </View>
      <AppText variant="muted">{member.email}</AppText>
      {isMe ? null : (
        <View style={styles.actions}>
          <View style={styles.flex}>
            <Button
              title={isAdmin ? 'Legyen tag' : 'Legyen admin'}
              variant="secondary"
              onPress={onToggleRole}
            />
          </View>
          <View style={styles.flex}>
            <Button title="Eltávolítás" variant="danger" onPress={onRemove} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {gap: Spacing.one, paddingVertical: Spacing.two},
  head: {flexDirection: 'row', alignItems: 'center', gap: Spacing.two},
  name: {flexShrink: 1, fontWeight: '600'},
  actions: {flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one},
  flex: {flex: 1},
});
