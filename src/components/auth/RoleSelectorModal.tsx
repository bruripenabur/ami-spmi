import React from 'react';
import { ArrowRight, LogOut, ShieldCheck, UserCheck } from 'lucide-react';
import { RbacUserAccount, RoleAssignment } from '../../types/ami';
import { RBAC_ROLE_META } from '../../utils/rbacEngine';

interface RoleSelectorModalProps {
  user: RbacUserAccount;
  onSelectRole: (assignment: RoleAssignment) => void;
  onLogout: () => void;
}

export const RoleSelectorModal: React.FC<RoleSelectorModalProps> = ({
  user,
  onSelectRole,
  onLogout,
}) => {
  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-5 sm:px-7 py-5 text-white flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/unpatti-logo.png"
              alt="Logo UNPATTI"
              className="h-10 w-10 shrink-0 object-contain"
            />
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Akun Multi-Peran (Multi-Role RBAC)
              </div>
              <h1 className="text-base sm:text-lg font-bold text-white truncate">
                Pilih Peran Aktif untuk Sesi Kerja
              </h1>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Keluar
          </button>
        </div>

        <div className="p-5 sm:p-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-900 text-white font-bold text-sm">
                <UserCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate">
                  {user.nama}
                </div>
                <div className="text-xs text-slate-600 truncate">
                  NIP/ID: <span className="font-mono">{user.nip}</span> &bull; {user.gelarUnit}
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-900">
              <ShieldCheck className="h-3.5 w-3.5" />
              {user.roles.length} Peran Tersedia
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {user.roles.map((assignment) => {
              const meta = RBAC_ROLE_META[assignment.role];
              return (
                <button
                  key={assignment.id}
                  type="button"
                  onClick={() => onSelectRole(assignment)}
                  className="min-h-[64px] w-full text-left rounded-xl border-2 border-slate-200 bg-white hover:border-[#1D4ED8] hover:bg-blue-50/50 p-4 transition-all flex items-center justify-between gap-4 group"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#1D4ED8]">
                        {assignment.label}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[11px] font-semibold border ${meta.badgeClass}`}
                      >
                        {meta.title}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-700">
                      Cakupan Unit: {assignment.unitName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {meta.summary}
                    </div>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-[#1D4ED8] group-hover:text-white transition-colors">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
