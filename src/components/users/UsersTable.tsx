import React from 'react';
import { Mail, ShieldCheck, Calendar, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Skeleton, SkeletonText } from '../Skeleton';

interface UsersTableProps {
  filteredUsers: any[];
  setSelectedUser: (user: any) => void;
  setShowManageAccess: (show: boolean) => void;
  setShowSuspendConfirm: (show: boolean) => void;
  isLoading?: boolean;
}

export default function UsersTable({ 
  filteredUsers, 
  setSelectedUser, 
  setShowManageAccess, 
  setShowSuspendConfirm,
  isLoading = false
}: UsersTableProps) {
  const displayUsers = isLoading ? Array.from({ length: 8 }) : filteredUsers;

  return (
    <div className="glass-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>User Identity</th>
              <th>Access Level</th>
              <th>Credit Balance</th>
              <th>Registration</th>
              <th>Last Seen</th>
              <th className="text-right">Manage</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {displayUsers.map((user: any, i: number) => (
                <motion.tr 
                  key={isLoading ? i : user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "group transition-all duration-300",
                    !isLoading && "hover:bg-brand-primary/10 cursor-pointer"
                  )}
                  onClick={() => !isLoading && setSelectedUser(user)}
                >
                  <td>
                    <div className="flex items-center gap-4">
                      <div className="relative group/avatar">
                        <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-md opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
                        <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-brand-primary flex items-center justify-center text-indigo-400 group-hover:border-indigo-500/50 transition-colors">
                          {isLoading ? (
                            <Skeleton width="100%" height="100%" className="rounded-xl" />
                          ) : (
                            <Mail size={18} />
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        {isLoading ? (
                          <>
                            <SkeletonText width={140} className="h-4" />
                            <SkeletonText width={80} className="h-2 opacity-50" />
                          </>
                        ) : (
                          <>
                            <span className="text-body font-bold text-white group-hover:text-brand-accent transition-colors">{user.email}</span>
                            <span className="text-xs text-brand-text-muted font-mono tracking-tight">ID: {user.id?.slice(0, 8)}...</span>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    {isLoading ? (
                      <SkeletonText width={80} className="h-6 rounded-full" />
                    ) : (
                      <span className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all shadow-sm",
                        user.tier === 'super_admin' ? "bg-indigo-500 text-white shadow-indigo-500/20" :
                        user.tier === 'hero' ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-purple-500/5" :
                        user.tier === 'adventurer' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-blue-500/5" :
                        "bg-brand-primary/20 text-brand-text-muted border border-brand-primary/30"
                      )}>
                        {user.tier === 'super_admin' && <ShieldCheck size={10} className="text-white" />}
                        {user.tier === 'super_admin' ? 'Super Admin' : user.tier.charAt(0).toUpperCase() + user.tier.slice(1)}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      {isLoading ? (
                        <div className="flex items-center gap-2 w-full">
                           <div className="w-20 h-1.5 rounded-full shimmer opacity-30 overflow-hidden" />
                           <SkeletonText width={40} className="h-3" />
                        </div>
                      ) : (
                        <>
                           <div className="w-20 h-1.5 rounded-full bg-brand-primary/30 overflow-hidden">
                            <div 
                              className="h-full bg-brand-accent transition-all shadow-[0_0_8px_rgba(0,178,255,0.4)]" 
                              style={{ width: `${Math.min(100, ((user.currentCredits || 0) / (user.maxCredits || 1000)) * 100)}%` }} 
                            />
                          </div>
                          <span className="text-xs font-bold text-white">{user.currentCredits?.toLocaleString() || 0}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td>
                    {isLoading ? (
                      <SkeletonText width={80} className="h-3 opacity-50" />
                    ) : (
                      <div className="flex flex-col">
                         <span className="text-xs font-medium text-brand-text-muted">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </span>
                      </div>
                    )}
                  </td>
                  <td>
                    {isLoading ? (
                      <SkeletonText width={60} className="h-3 opacity-50" />
                    ) : (
                      <span className="text-xs font-bold text-brand-text-muted flex items-center gap-1">
                        <Calendar size={10} />
                        {user.updatedAt ? new Date(user.updatedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : 'Online'}
                      </span>
                    )}
                  </td>
                  <td className="text-right">
                    {!isLoading && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(user);
                          setShowManageAccess(false);
                          setShowSuspendConfirm(false);
                        }}
                        className="rounded-lg p-2 text-brand-text-muted transition-all hover:bg-brand-primary/50 hover:text-white"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {!isLoading && filteredUsers.length === 0 && (
          <div className="py-20 text-center text-brand-text-muted italic">
            No users found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
