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
    <div className="card overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-[700px]">
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
                      <div className="flex items-center gap-2">
                        <div className="relative group/avatar">
                          <div className="relative w-6 h-6 rounded-md bg-gradient-to-br from-brand-accent/20 to-purple-500/20 border border-brand-primary flex items-center justify-center text-brand-accent group-hover:border-brand-accent/50 transition-colors">
                            {isLoading ? (
                              <Skeleton width="100%" height="100%" className="rounded-md" />
                            ) : (
                              <Mail size={12} />
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-0.5 overflow-hidden">
                          {isLoading ? (
                            <>
                              <SkeletonText width={140} className="h-3" />
                              <SkeletonText width={80} className="h-2 opacity-50" />
                            </>
                          ) : (
                            <>
                              <span className="text-xs font-semibold text-white group-hover:text-brand-accent transition-colors truncate">{user.email}</span>
                              <span className="text-xs text-brand-text-muted font-mono tracking-tight">ID: {user.id?.slice(0, 8)}...</span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {isLoading ? (
                        <SkeletonText width={80} className="h-5 rounded-full" />
                      ) : (
                        <span className={cn(
                          "badge",
                          user.tier === 'super_admin' ? "bg-indigo-500 text-white" :
                          user.tier === 'hero' ? "badge-accent bg-purple-500/10 text-purple-400 border-purple-500/20" :
                          user.tier === 'adventurer' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                          "badge-muted"
                        )}>
                          {user.tier === 'super_admin' && <ShieldCheck size={10} className="text-white" />}
                          {user.tier === 'super_admin' ? 'Super Admin' : user.tier.charAt(0).toUpperCase() + user.tier.slice(1)}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {isLoading ? (
                          <div className="flex items-center gap-2 w-full">
                             <div className="w-16 h-1 rounded-full shimmer opacity-30 overflow-hidden" />
                             <SkeletonText width={40} className="h-3" />
                          </div>
                        ) : (
                          <>
                             <div className="w-16 h-1 rounded-full bg-brand-primary/30 overflow-hidden">
                              <div 
                                className="h-full bg-brand-accent transition-all" 
                                style={{ width: `${Math.min(100, ((user.currentCredits || 0) / (user.maxCredits || 1000)) * 100)}%` }} 
                              />
                            </div>
                            <span className="text-xs font-semibold text-white">{user.currentCredits?.toLocaleString() || 0}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      {isLoading ? (
                        <SkeletonText width={80} className="h-3 opacity-50" />
                      ) : (
                        <span className="text-xs text-brand-text-muted">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </span>
                      )}
                    </td>
                    <td>
                      {isLoading ? (
                        <SkeletonText width={60} className="h-3 opacity-50" />
                      ) : (() => {
                        const lastSession = user.UserSession?.[0];
                        const isOnline = lastSession && 
                                         !lastSession.endTime && 
                                         (new Date().getTime() - new Date(lastSession.lastPing).getTime() < 5 * 60 * 1000);
                        
                        if (isOnline) {
                          return (
                            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Online
                            </span>
                          );
                        }
                        
                        if (lastSession) {
                          return (
                            <span className="text-xs text-brand-text-muted flex items-center gap-1">
                              <Calendar size={10} />
                              {new Date(lastSession.lastPing).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{' '}
                              {new Date(lastSession.lastPing).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          );
                        }
                        
                        return (
                          <span className="text-xs text-brand-text-muted/50 italic flex items-center gap-1">
                            Never
                          </span>
                        );
                      })()}
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
                          className="btn-icon"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {!isLoading && filteredUsers.length === 0 && (
          <div className="py-12 text-center text-xs text-brand-text-muted italic">
            No users found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
