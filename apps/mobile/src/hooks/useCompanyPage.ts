import {useFocusEffect} from 'expo-router';
import {useCallback, useState} from 'react';
import {Share} from 'react-native';

import {authApi} from '@/api/authApi';
import {companyApi} from '@/api/companyApi';
import {useAuthStore, useCurrentUser} from '@/store/useAuthStore';
import type {Company, CompanyMember} from '@/types/company.types';
import {confirmAction, showError} from '@/utils/confirm';
import {errorMessage} from '@/utils/errorMessage';

interface CompanyPageData {
  company: Company | null;
  members: CompanyMember[];
}

// A Profil > Ceg resz adatai es muveletei.
export function useCompanyPage() {
  const user = useCurrentUser();
  const setUser = useAuthStore((state) => state.setUser);
  const setSession = useAuthStore((state) => state.setSession);
  const isAdmin = user.role === 'COMPANY_ADMIN';
  const [data, setData] = useState<CompanyPageData>({company: null, members: []});
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // A profilt mindig frissen kerjuk le: egy admin kozben eltavolithatott vagy
  // atallithatott minket (a backend is az adatbazisbol olvassa, nem a tokenbol).
  const reload = useCallback(async () => {
    setRefreshing(true);
    try {
      const me = await authApi.me();
      await setUser(me);
      if (!me.companyId) {
        setData({company: null, members: []});
      } else {
        const [company, members] = await Promise.all([
          companyApi.getMine(),
          me.role === 'COMPANY_ADMIN' ? companyApi.listMembers() : Promise.resolve([]),
        ]);
        setData({company, members});
      }
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setRefreshing(false);
    }
  }, [setUser]);

  // Betoltes a kepernyore lepeskor. (Ha cegbe lepunk vagy kilepunk, a Profil
  // kepernyo ujra letrehozza ezt a panelt, igy akkor is ujratolt.)
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const shareJoinCode = useCallback(() => {
    const {company} = data;
    if (company?.joinCode) {
      void Share.share({message: `Csatlakozz a(z) ${company.name} céghez: ${company.joinCode}`});
    }
  }, [data]);

  const regenerateJoinCode = useCallback(async () => {
    const ok = await confirmAction(
      'Új csatlakozási kód',
      'A régi kód azonnal érvénytelen lesz. A már csatlakozott tagokat ez nem érinti.',
      'Új kód',
    );
    if (!ok) {
      return;
    }
    try {
      const {joinCode} = await companyApi.regenerateJoinCode();
      setData((prev) => ({...prev, company: prev.company && {...prev.company, joinCode}}));
    } catch (e) {
      showError(errorMessage(e));
    }
  }, []);

  const toggleMemberRole = useCallback(
    async (member: CompanyMember) => {
      try {
        const role = member.role === 'COMPANY_ADMIN' ? 'COMPANY_MEMBER' : 'COMPANY_ADMIN';
        await companyApi.changeMemberRole(member.id, role);
        await reload();
      } catch (e) {
        showError(errorMessage(e));
      }
    },
    [reload],
  );

  const removeMember = useCallback(
    async (member: CompanyMember) => {
      const ok = await confirmAction(
        'Tag eltávolítása',
        `${member.firstName} kikerül a cégből; a céges járművei egy adminhoz kerülnek.`,
        'Eltávolítás',
      );
      if (!ok) {
        return;
      }
      try {
        await companyApi.removeMember(member.id);
        await reload();
      } catch (e) {
        showError(errorMessage(e));
      }
    },
    [reload],
  );

  const leaveCompany = useCallback(async () => {
    const ok = await confirmAction(
      'Kilépés a cégből',
      'A céges járművek a cégnél maradnak, a magánjárműveid veled jönnek.',
      'Kilépés',
    );
    if (!ok) {
      return;
    }
    setLeaving(true);
    try {
      await setSession(await companyApi.leave());
      setData({company: null, members: []});
    } catch (e) {
      showError(errorMessage(e));
    } finally {
      setLeaving(false);
    }
  }, [setSession]);

  return {
    user,
    isAdmin,
    company: data.company,
    members: data.members,
    error,
    refreshing,
    reload,
    leaving,
    shareJoinCode,
    regenerateJoinCode,
    toggleMemberRole,
    removeMember,
    leaveCompany,
  };
}
