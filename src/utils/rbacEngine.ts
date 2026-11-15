import {
  AmiTabId,
  RbacPermissions,
  RbacRole,
  RoleAssignment,
  SsoUserProfile,
  StudyProgramIdentity,
} from '../types/ami';

export const RBAC_ROLE_META: Record<
  RbacRole,
  {
    title: string;
    shortLabel: string;
    badgeClass: string;
    summary: string;
  }
> = {
  kaprodi: {
    title: 'Kaprodi (Auditee)',
    shortLabel: 'Kaprodi',
    badgeClass: 'bg-blue-50 text-blue-900 border-blue-200',
    summary: 'Mengelola identitas prodi, unggah bukti instrumen, pengisian PTK/RTL & realisasi Monev (terkunci 1 prodi).',
  },
  auditor: {
    title: 'Auditor (Tim AMI Internal)',
    shortLabel: 'Auditor AMI',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-300',
    summary: 'Menilai instrumen standar, mengisi temuan PLOR+CA, dan verifikasi akhir Monev pada prodi binaan SK.',
  },
  dekanat: {
    title: 'Dekanat (Pimpinan Fakultas)',
    shortLabel: 'Dekanat',
    badgeClass: 'bg-indigo-50 text-indigo-900 border-indigo-200',
    summary: 'Memantau seluruh prodi fakultas, memberi catatan fakultas & menyetujui formulir PTK/RTL sebelum Monev.',
  },
  rektorat: {
    title: 'Rektorat (Pimpinan Universitas)',
    shortLabel: 'Rektorat',
    badgeClass: 'bg-slate-900 text-amber-300 border-slate-700',
    summary: 'Akses eksekutif Read-Only untuk Dashboard PPEPP, Rekap, Grafik & Laporan AMI/RTM seluruh 118 prodi.',
  },
  lembaga: {
    title: 'Lembaga (LPMPP / LPPM)',
    shortLabel: 'Lembaga',
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    summary: 'Monitoring lintas 118 prodi sesuai fokus lembaga (LPMPP Pendidikan/SPMI atau LPPM Riset/PkM) & status siklus.',
  },
  pusat: {
    title: 'Pusat (Unit Pusat LPMPP/LPPM)',
    shortLabel: 'Pusat',
    badgeClass: 'bg-teal-50 text-teal-900 border-teal-200',
    summary: 'Analisis mendalam indikator 118 prodi sesuai klaster standar unit pusat (tanpa ubah prodi/siklus/pengguna).',
  },
  asesor_lam: {
    title: 'Asesor LAM (Eksternal)',
    shortLabel: 'Asesor LAM',
    badgeClass: 'bg-purple-50 text-purple-900 border-purple-300',
    summary: 'Mode Read-Only eksternal terbatas pada prodi & siklus yang ditugaskan Admin (Dashboard, Grafik, Laporan SPMI).',
  },
  asesor_banpt: {
    title: 'Asesor BAN-PT (Eksternal)',
    shortLabel: 'Asesor BAN-PT',
    badgeClass: 'bg-fuchsia-50 text-fuchsia-900 border-fuchsia-300',
    summary: 'Mode Read-Only eksternal tingkat PT (118 prodi & semua siklus) untuk evaluasi makro & RTM.',
  },
  admin: {
    title: 'Admin (Super Admin)',
    shortLabel: 'Super Admin',
    badgeClass: 'bg-red-50 text-red-900 border-red-200',
    summary: 'Kontrol penuh seluruh modul, manajemen pengguna multi-role, mapping SK Auditor & izin Asesor LAM.',
  },
};

export function computeRbacPermissions(
  assignment: RoleAssignment,
  allPrograms: StudyProgramIdentity[]
): RbacPermissions {
  const role = assignment.role;
  const meta = RBAC_ROLE_META[role];

  const resolveProdiNames = (ids?: string[]) => {
    if (!ids || ids.length === 0) return 'Belum Ada Prodi Ditugaskan';
    const names = ids
      .map((id) => allPrograms.find((p) => p.id === id)?.nama_prodi)
      .filter(Boolean) as string[];
    if (names.length === 0) return `${ids.length} Prodi Terdaftar`;
    if (names.length <= 2) return names.join(', ');
    return `${names[0]}, ${names[1]} (+${names.length - 2} Prodi)`;
  };

  const resolveProdiFaculties = (ids: string[]) => {
    const facs = new Set<string>();
    ids.forEach((id) => {
      const found = allPrograms.find((p) => p.id === id);
      if (found) facs.add(found.fakultas);
    });
    return Array.from(facs);
  };

  switch (role) {
    case 'kaprodi': {
      const targetProdi =
        allPrograms.find((p) => p.id === assignment.prodiId) ?? allPrograms[0];
      const allowedProdiIds = targetProdi ? [targetProdi.id] : [];
      const allowedFakultas = targetProdi ? [targetProdi.fakultas] : [];
      return {
        role,
        assignment,
        legacyMode: 'auditee',
        roleDisplayName: meta.title,
        badgeColorClass: meta.badgeClass,
        isExternalAssessor: false,
        isStrictReadOnly: false,
        readOnlyBanner: null,
        scopeLabel: targetProdi
          ? `Terkunci: ${targetProdi.nama_prodi} (${targetProdi.fakultas})`
          : 'Terkunci: 1 Program Studi',
        lockFakultas: true,
        lockProdi: true,
        allowedFakultas,
        allowedProdiIds,
        allowedCycleYears: 'all',
        allowedStandardIds: 'all',
        allowedTabs: [
          'dashboard',
          'identitas',
          'instrumen',
          'rekap',
          'laporan',
          'temuan',
          'ptk',
          'monev',
          'panduan',
          'perengkingan',
          'laporan_spmi',
        ],
        canCreateProdi: false,
        canEditIdentitas: true,
        canEditInstrumenEvidence: true,
        canScoreInstrumen: false,
        canCrudIndicators: false,
        canEditPlorCa: false,
        canEditPtkDraft: true,
        canSubmitPtkToDekan: true,
        canApprovePtkDekan: false,
        canUploadMonevEvidence: true,
        canVerifyMonevClosed: false,
        canManageCycleStatus: false,
        canManageUsers: false,
        canSyncSupabase: false,
        canExportReports: true,
      };
    }

    case 'auditor': {
      const assignedIds = assignment.assignedProdiIds ?? [];
      const allowedFakultas = resolveProdiFaculties(assignedIds);
      return {
        role,
        assignment,
        legacyMode: 'auditor',
        roleDisplayName: meta.title,
        badgeColorClass: meta.badgeClass,
        isExternalAssessor: false,
        isStrictReadOnly: false,
        readOnlyBanner: null,
        scopeLabel: `Prodi Binaan SK (${assignedIds.length}): ${resolveProdiNames(assignedIds)}`,
        lockFakultas: false,
        lockProdi: assignedIds.length <= 1,
        allowedFakultas,
        allowedProdiIds: assignedIds,
        allowedCycleYears: 'all',
        allowedStandardIds: 'all',
        allowedTabs: [
          'dashboard',
          'identitas',
          'instrumen',
          'rekap',
          'laporan',
          'temuan',
          'ptk',
          'monev',
          'panduan',
          'perengkingan',
          'laporan_spmi',
        ],
        canCreateProdi: false,
        canEditIdentitas: false,
        canEditInstrumenEvidence: false,
        canScoreInstrumen: true,
        canCrudIndicators: false,
        canEditPlorCa: true,
        canEditPtkDraft: true,
        canSubmitPtkToDekan: false,
        canApprovePtkDekan: false,
        canUploadMonevEvidence: false,
        canVerifyMonevClosed: true,
        canManageCycleStatus: false,
        canManageUsers: false,
        canSyncSupabase: true,
        canExportReports: true,
      };
    }

    case 'dekanat': {
      const fac = assignment.fakultas ?? allPrograms[0]?.fakultas ?? '';
      const facProdiIds = allPrograms
        .filter((p) => p.fakultas === fac)
        .map((p) => p.id);
      return {
        role,
        assignment,
        legacyMode: 'auditor',
        roleDisplayName: meta.title,
        badgeColorClass: meta.badgeClass,
        isExternalAssessor: false,
        isStrictReadOnly: false,
        readOnlyBanner:
          'Mode Pimpinan Fakultas (Dekanat): Pantau rekap fakultas & berikan persetujuan resmi pada modul 06. Formulir PTK / RTL.',
        scopeLabel: `Terkunci Fakultas: ${fac} (${facProdiIds.length} Prodi)`,
        lockFakultas: true,
        lockProdi: false,
        allowedFakultas: fac ? [fac] : 'all',
        allowedProdiIds: facProdiIds,
        allowedCycleYears: 'all',
        allowedStandardIds: 'all',
        allowedTabs: [
          'dashboard',
          'identitas',
          'rekap',
          'laporan',
          'temuan',
          'ptk',
          'monev',
          'panduan',
          'perengkingan',
          'laporan_spmi',
        ],
        canCreateProdi: false,
        canEditIdentitas: false,
        canEditInstrumenEvidence: false,
        canScoreInstrumen: false,
        canCrudIndicators: false,
        canEditPlorCa: false,
        canEditPtkDraft: false,
        canSubmitPtkToDekan: false,
        canApprovePtkDekan: true,
        canUploadMonevEvidence: false,
        canVerifyMonevClosed: false,
        canManageCycleStatus: false,
        canManageUsers: false,
        canSyncSupabase: false,
        canExportReports: true,
      };
    }

    case 'rektorat':
      return {
        role,
        assignment,
        legacyMode: 'auditor',
        roleDisplayName: meta.title,
        badgeColorClass: meta.badgeClass,
        isExternalAssessor: false,
        isStrictReadOnly: true,
        readOnlyBanner:
          'Mode Eksekutif Rektorat (Read-Only): Tampilan agregat 118 Program Studi & Rapat Tinjauan Manajemen (RTM).',
        scopeLabel: 'Global: Semua Fakultas & 118 Program Studi',
        lockFakultas: false,
        lockProdi: false,
        allowedFakultas: 'all',
        allowedProdiIds: 'all',
        allowedCycleYears: 'all',
        allowedStandardIds: 'all',
        allowedTabs: [
          'dashboard',
          'rekap',
          'laporan',
          'perengkingan',
          'laporan_spmi',
          'panduan',
        ],
        canCreateProdi: false,
        canEditIdentitas: false,
        canEditInstrumenEvidence: false,
        canScoreInstrumen: false,
        canCrudIndicators: false,
        canEditPlorCa: false,
        canEditPtkDraft: false,
        canSubmitPtkToDekan: false,
        canApprovePtkDekan: false,
        canUploadMonevEvidence: false,
        canVerifyMonevClosed: false,
        canManageCycleStatus: false,
        canManageUsers: false,
        canSyncSupabase: false,
        canExportReports: true,
      };

    case 'lembaga': {
      const entity = assignment.lembagaEntity ?? 'LPMPP';
      const defaultStandards =
        entity === 'LPPM' ? [9, 10] : [1, 2, 3, 4, 5, 6, 7, 8];
      const allowedStandardIds = assignment.allowedStandardIds ?? defaultStandards;
      return {
        role,
        assignment,
        legacyMode: 'auditor',
        roleDisplayName: `Lembaga (${entity})`,
        badgeColorClass: meta.badgeClass,
        isExternalAssessor: false,
        isStrictReadOnly: false,
        readOnlyBanner:
          entity === 'LPPM'
            ? 'Entitas Lembaga LPPM: Fokus monitoring Standar Penelitian & PkM (Standar 9–10) serta kontrol status siklus.'
            : 'Entitas Lembaga LPMPP: Fokus monitoring Pendidikan, Kurikulum & SPMI (Standar 1–8) serta kontrol status siklus.',
        scopeLabel: `Lembaga ${entity} · Semua Fakultas & 118 Prodi (Standar ${allowedStandardIds.join(', ')})`,
        lockFakultas: false,
        lockProdi: false,
        allowedFakultas: 'all',
        allowedProdiIds: 'all',
        allowedCycleYears: 'all',
        allowedStandardIds,
        allowedTabs: [
          'dashboard',
          'identitas',
          'instrumen',
          'rekap',
          'laporan',
          'temuan',
          'ptk',
          'monev',
          'perengkingan',
          'laporan_spmi',
          'panduan',
          'manajemen',
        ],
        canCreateProdi: false,
        canEditIdentitas: false,
        canEditInstrumenEvidence: false,
        canScoreInstrumen: false,
        canCrudIndicators: true,
        canEditPlorCa: false,
        canEditPtkDraft: false,
        canSubmitPtkToDekan: false,
        canApprovePtkDekan: false,
        canUploadMonevEvidence: false,
        canVerifyMonevClosed: false,
        canManageCycleStatus: true,
        canManageUsers: false,
        canSyncSupabase: true,
        canExportReports: true,
      };
    }

    case 'pusat': {
      const entity = assignment.lembagaEntity ?? 'LPMPP';
      const pName = assignment.pusatName ?? `Unit Pusat (${entity})`;
      const defaultStandards =
        entity === 'LPPM' ? [9, 10] : [1, 2, 3, 4, 5, 6, 7, 8];
      const allowedStandardIds = assignment.allowedStandardIds ?? defaultStandards;
      return {
        role,
        assignment,
        legacyMode: 'auditor',
        roleDisplayName: `Pusat (${entity})`,
        badgeColorClass: meta.badgeClass,
        isExternalAssessor: false,
        isStrictReadOnly: true,
        readOnlyBanner: `${pName} (${entity}): Analisis mendalam standar klaster ${allowedStandardIds.join(', ')} di 118 prodi (tanpa ubah master data).`,
        scopeLabel: `${pName} (${entity}) · 118 Prodi`,
        lockFakultas: false,
        lockProdi: false,
        allowedFakultas: 'all',
        allowedProdiIds: 'all',
        allowedCycleYears: 'all',
        allowedStandardIds,
        allowedTabs: [
          'dashboard',
          'instrumen',
          'rekap',
          'laporan',
          'temuan',
          'monev',
          'perengkingan',
          'laporan_spmi',
          'panduan',
        ],
        canCreateProdi: false,
        canEditIdentitas: false,
        canEditInstrumenEvidence: false,
        canScoreInstrumen: false,
        canCrudIndicators: false,
        canEditPlorCa: false,
        canEditPtkDraft: false,
        canSubmitPtkToDekan: false,
        canApprovePtkDekan: false,
        canUploadMonevEvidence: false,
        canVerifyMonevClosed: false,
        canManageCycleStatus: false,
        canManageUsers: false,
        canSyncSupabase: false,
        canExportReports: true,
      };
    }

    case 'asesor_lam': {
      const assignedIds = assignment.assignedProdiIds ?? [];
      const assignedCycles = assignment.assignedCycleYears ?? ['2025/2026'];
      const allowedFakultas = resolveProdiFaculties(assignedIds);
      return {
        role,
        assignment,
        legacyMode: 'auditor',
        roleDisplayName: meta.title,
        badgeColorClass: meta.badgeClass,
        isExternalAssessor: true,
        isStrictReadOnly: true,
        readOnlyBanner: `Mode Asesor Eksternal - Read Only · Terkunci pada ${resolveProdiNames(assignedIds)} (${assignedCycles.join(', ')}).`,
        scopeLabel: `LAM Terkunci: ${resolveProdiNames(assignedIds)} · Siklus ${assignedCycles.join(', ')}`,
        lockFakultas: allowedFakultas.length <= 1,
        lockProdi: assignedIds.length <= 1,
        allowedFakultas,
        allowedProdiIds: assignedIds,
        allowedCycleYears: assignedCycles,
        allowedStandardIds: 'all',
        allowedTabs: ['dashboard', 'laporan', 'laporan_spmi'],
        canCreateProdi: false,
        canEditIdentitas: false,
        canEditInstrumenEvidence: false,
        canScoreInstrumen: false,
        canCrudIndicators: false,
        canEditPlorCa: false,
        canEditPtkDraft: false,
        canSubmitPtkToDekan: false,
        canApprovePtkDekan: false,
        canUploadMonevEvidence: false,
        canVerifyMonevClosed: false,
        canManageCycleStatus: false,
        canManageUsers: false,
        canSyncSupabase: false,
        canExportReports: true,
      };
    }

    case 'asesor_banpt':
      return {
        role,
        assignment,
        legacyMode: 'auditor',
        roleDisplayName: meta.title,
        badgeColorClass: meta.badgeClass,
        isExternalAssessor: true,
        isStrictReadOnly: true,
        readOnlyBanner:
          'Mode Asesor Eksternal - Read Only · Akses penilaian akreditasi PT (118 Program Studi & semua siklus).',
        scopeLabel: 'BAN-PT Eksternal: 118 Program Studi & Semua Siklus (Read-Only)',
        lockFakultas: false,
        lockProdi: false,
        allowedFakultas: 'all',
        allowedProdiIds: 'all',
        allowedCycleYears: 'all',
        allowedStandardIds: 'all',
        allowedTabs: [
          'dashboard',
          'rekap',
          'laporan',
          'perengkingan',
          'laporan_spmi',
        ],
        canCreateProdi: false,
        canEditIdentitas: false,
        canEditInstrumenEvidence: false,
        canScoreInstrumen: false,
        canCrudIndicators: false,
        canEditPlorCa: false,
        canEditPtkDraft: false,
        canSubmitPtkToDekan: false,
        canApprovePtkDekan: false,
        canUploadMonevEvidence: false,
        canVerifyMonevClosed: false,
        canManageCycleStatus: false,
        canManageUsers: false,
        canSyncSupabase: false,
        canExportReports: true,
      };

    case 'admin':
      return {
        role,
        assignment,
        legacyMode: 'auditor',
        roleDisplayName: meta.title,
        badgeColorClass: meta.badgeClass,
        isExternalAssessor: false,
        isStrictReadOnly: false,
        readOnlyBanner: null,
        scopeLabel: 'Super Admin: Kontrol Penuh 118 Prodi, Siklus & Manajemen Pengguna',
        lockFakultas: false,
        lockProdi: false,
        allowedFakultas: 'all',
        allowedProdiIds: 'all',
        allowedCycleYears: 'all',
        allowedStandardIds: 'all',
        allowedTabs: [
          'dashboard',
          'identitas',
          'instrumen',
          'rekap',
          'laporan',
          'temuan',
          'ptk',
          'monev',
          'panduan',
          'perengkingan',
          'laporan_spmi',
          'manajemen',
        ],
        canCreateProdi: true,
        canEditIdentitas: true,
        canEditInstrumenEvidence: true,
        canScoreInstrumen: true,
        canCrudIndicators: true,
        canEditPlorCa: true,
        canEditPtkDraft: true,
        canSubmitPtkToDekan: true,
        canApprovePtkDekan: true,
        canUploadMonevEvidence: true,
        canVerifyMonevClosed: true,
        canManageCycleStatus: true,
        canManageUsers: true,
        canSyncSupabase: true,
        canExportReports: true,
      };
  }
}

export function getDefaultTabForPermissions(perms: RbacPermissions): AmiTabId {
  return perms.allowedTabs[0] ?? 'dashboard';
}

export function normalizeSsoRoleToRbacRole(rawRole: string): RbacRole {
  const norm = String(rawRole ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (norm === 'SUPER_ADMIN' || norm === 'ADMIN_LPMPP' || norm === 'ADMIN') {
    return 'admin';
  }
  if (norm === 'KAPRODI' || norm === 'AUDITEE') {
    return 'kaprodi';
  }
  if (norm === 'AUDITOR_AMI' || norm === 'AUDITOR') {
    return 'auditor';
  }
  if (norm === 'DEKANAT' || norm === 'DEKAN') {
    return 'dekanat';
  }
  if (norm === 'REKTORAT' || norm === 'REKTOR') {
    return 'rektorat';
  }
  if (norm === 'LEMBAGA' || norm === 'LPMPP' || norm === 'LPPM') {
    return 'lembaga';
  }
  if (norm === 'PUSAT') {
    return 'pusat';
  }
  if (norm === 'ASESOR_LAM' || norm === 'LAM') {
    return 'asesor_lam';
  }
  if (norm === 'ASESOR_BANPT' || norm === 'BANPT' || norm === 'ASESOR_BAN_PT') {
    return 'asesor_banpt';
  }
  return 'kaprodi';
}

export function findProgramByUnitKode(
  unitKode: string | null | undefined,
  allPrograms: StudyProgramIdentity[]
): StudyProgramIdentity | undefined {
  const norm = String(unitKode ?? '')
    .trim()
    .toLowerCase();
  if (!norm) return undefined;
  return allPrograms.find(
    (p) =>
      p.kode_ps.trim().toLowerCase() === norm ||
      p.id.trim().toLowerCase() === norm ||
      p.nama_prodi.trim().toLowerCase() === norm
  );
}

export function buildPermissionsFromSsoProfile(
  profile: SsoUserProfile,
  allPrograms: StudyProgramIdentity[]
): RbacPermissions {
  const rbacRole = normalizeSsoRoleToRbacRole(profile.role);
  const rawRoleUpper = String(profile.role ?? '')
    .trim()
    .toUpperCase();
  const unitTrim = String(profile.unit_kode ?? '').trim();

  if (rbacRole === 'admin') {
    const roleLabel =
      rawRoleUpper === 'ADMIN_LPMPP' ? 'Admin LPMPP' : 'Super Admin';
    const base = computeRbacPermissions(
      {
        id: profile.id,
        role: 'admin',
        label: roleLabel,
        unitName: profile.jabatan || 'LPMPP Universitas Pattimura',
      },
      allPrograms
    );
    return {
      ...base,
      roleDisplayName: roleLabel,
      scopeLabel: `${roleLabel}: Kontrol Penuh Semua Fakultas, Jenis Prodi & Program Studi`,
    };
  }

  if (rbacRole === 'kaprodi') {
    const matchedProdi = findProgramByUnitKode(unitTrim, allPrograms);
    const assignment: RoleAssignment = {
      id: profile.id,
      role: 'kaprodi',
      label: 'Kaprodi',
      unitName:
        matchedProdi?.nama_prodi || profile.jabatan || unitTrim || 'Program Studi',
      prodiId: matchedProdi?.id,
      fakultas: matchedProdi?.fakultas,
    };
    const base = computeRbacPermissions(assignment, allPrograms);
    // Strictly lock Fakultas, Jenis Prodi, and Prodi to user's unit_kode (no fallback to unrelated prodi if unmatched)
    return {
      ...base,
      roleDisplayName: 'Kaprodi',
      lockFakultas: true,
      lockProdi: true,
      allowedFakultas: matchedProdi ? [matchedProdi.fakultas] : [],
      allowedProdiIds: matchedProdi ? [matchedProdi.id] : [],
      scopeLabel: matchedProdi
        ? `Terkunci (${matchedProdi.kode_ps}): ${matchedProdi.nama_prodi} · ${matchedProdi.fakultas}`
        : `Terkunci Unit: ${unitTrim || 'Belum Ditautkan'}`,
      canCreateProdi: false,
      canCrudIndicators: false,
      canManageUsers: false,
      allowedTabs: base.allowedTabs.filter((t) => t !== 'manajemen'),
    };
  }

  if (rbacRole === 'auditor') {
    const tokens = unitTrim
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const isGlobalScope =
      tokens.length === 0 ||
      tokens.some((t) =>
        ['ALL', 'SEMUA', 'LPMPP', 'UNPATTI', '*'].includes(t.toUpperCase())
      );

    let assignedProdiIds: string[] = [];
    if (!isGlobalScope) {
      tokens.forEach((tok) => {
        const matched = findProgramByUnitKode(tok, allPrograms);
        if (matched) {
          assignedProdiIds.push(matched.id);
        } else {
          // Check if token matches a faculty name
          const facProdis = allPrograms.filter(
            (p) => p.fakultas.trim().toLowerCase() === tok.toLowerCase()
          );
          assignedProdiIds.push(...facProdis.map((p) => p.id));
        }
      });
      assignedProdiIds = Array.from(new Set(assignedProdiIds));
    }

    const effectiveAllowedProdis: string[] | 'all' =
      isGlobalScope || assignedProdiIds.length === 0 ? 'all' : assignedProdiIds;

    const allowedFakultas: string[] | 'all' =
      effectiveAllowedProdis === 'all'
        ? 'all'
        : Array.from(
            new Set(
              effectiveAllowedProdis
                .map((id) => allPrograms.find((p) => p.id === id)?.fakultas)
                .filter(Boolean) as string[]
            )
          );

    const base = computeRbacPermissions(
      {
        id: profile.id,
        role: 'auditor',
        label: 'Auditor AMI',
        unitName: profile.jabatan || 'Tim Auditor AMI UNPATTI',
        assignedProdiIds:
          effectiveAllowedProdis === 'all' ? undefined : effectiveAllowedProdis,
      },
      allPrograms
    );

    return {
      ...base,
      roleDisplayName: 'Auditor AMI',
      lockFakultas: false,
      lockProdi:
        effectiveAllowedProdis !== 'all' && effectiveAllowedProdis.length <= 1,
      allowedFakultas,
      allowedProdiIds: effectiveAllowedProdis,
      scopeLabel:
        effectiveAllowedProdis === 'all'
          ? 'Auditor AMI: Akses & Penilaian Program Studi Lintas Fakultas'
          : `Auditor AMI (${effectiveAllowedProdis.length} Prodi Binaan)`,
      canCreateProdi: false,
      canCrudIndicators: false,
      canManageUsers: false,
      canSyncSupabase: false,
      allowedTabs: base.allowedTabs.filter((t) => t !== 'manajemen'),
    };
  }

  if (rbacRole === 'dekanat') {
    const matchedFac =
      allPrograms.find(
        (p) => p.fakultas.trim().toLowerCase() === unitTrim.toLowerCase()
      )?.fakultas ??
      findProgramByUnitKode(unitTrim, allPrograms)?.fakultas ??
      unitTrim;
    return computeRbacPermissions(
      {
        id: profile.id,
        role: 'dekanat',
        label: 'Dekanat',
        unitName: profile.jabatan || matchedFac || 'Pimpinan Fakultas',
        fakultas: matchedFac,
      },
      allPrograms
    );
  }

  if (rbacRole === 'lembaga') {
    const entity = rawRoleUpper === 'LPPM' || unitTrim.toUpperCase() === 'LPPM' ? 'LPPM' : 'LPMPP';
    return computeRbacPermissions(
      {
        id: profile.id,
        role: 'lembaga',
        label: `Lembaga (${entity})`,
        unitName: profile.jabatan || entity,
        lembagaEntity: entity,
      },
      allPrograms
    );
  }

  if (rbacRole === 'pusat') {
    return computeRbacPermissions(
      {
        id: profile.id,
        role: 'pusat',
        label: 'Pusat',
        unitName: profile.jabatan || unitTrim || 'Unit Pusat LPMPP',
        pusatName: profile.jabatan || unitTrim || 'Unit Pusat LPMPP',
      },
      allPrograms
    );
  }

  if (rbacRole === 'asesor_lam') {
    const matched = findProgramByUnitKode(unitTrim, allPrograms);
    return computeRbacPermissions(
      {
        id: profile.id,
        role: 'asesor_lam',
        label: 'Asesor LAM',
        unitName: profile.jabatan || 'Asesor Eksternal LAM',
        assignedProdiIds: matched ? [matched.id] : allPrograms.map((p) => p.id),
      },
      allPrograms
    );
  }

  return computeRbacPermissions(
    {
      id: profile.id,
      role: rbacRole,
      label: RBAC_ROLE_META[rbacRole].shortLabel,
      unitName: profile.jabatan || 'Universitas Pattimura',
    },
    allPrograms
  );
}

