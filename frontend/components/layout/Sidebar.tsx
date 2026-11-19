'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/context/SessionContext';
import {
  MessageSquare,
  Files,
  BarChart3,
  ShieldCheck,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Clock,
  FlaskConical,
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ isMobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    sessionId,
    sessions,
    isLoadingSessions,
    isSidebarCollapsed,
    toggleSidebar,
    startNewSession,
    switchSession,
  } = useSession();

  const handleNewChat = () => {
    startNewSession();
    if (pathname !== '/') {
      router.push('/');
    }
    if (onCloseMobile) onCloseMobile();
  };

  const handleSelectSession = (id: string) => {
    switchSession(id);
    if (pathname !== '/') {
      router.push('/');
    }
    if (onCloseMobile) onCloseMobile();
  };

  const navLinks = [
    {
      name: 'Chat Assistant',
      href: '/',
      icon: MessageSquare,
      badge: null,
    },
    {
      name: 'Documents',
      href: '/documents',
      icon: Files,
      badge: 'Admin',
    },
    {
      name: 'Staff Dashboard',
      href: '/dashboard',
      icon: BarChart3,
      badge: 'Admin',
    },
    {
      name: 'About & Safety',
      href: '/about',
      icon: ShieldCheck,
      badge: null,
    },
    {
      name: 'Evaluation Ready',
      href: '/evaluations',
      icon: FlaskConical,
      badge: 'Preview',
    },
  ];

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-neutral-200/90 bg-neutral-50/70 dark:border-neutral-800 dark:bg-neutral-950 transition-all duration-300 ease-in-out z-40',
        // Desktop sidebar width
        isSidebarCollapsed ? 'w-16' : 'w-72',
        // Mobile fixed drawer
        'fixed inset-y-0 left-0 md:static',
        isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
      )}
    >
      {/* App Header / Brand */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-neutral-200/80 dark:border-neutral-800">
        <Link
          href="/"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 overflow-hidden group focus-visible:outline-none"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-sm shadow-indigo-200 dark:shadow-none group-hover:scale-105 transition-transform">
            <Sparkles className="h-4 w-4" />
          </div>
          {!isSidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100 truncate">
                DocuRAG AI
              </span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium tracking-wide uppercase">
                Multilingual Assistant
              </span>
            </div>
          )}
        </Link>

        {/* Desktop collapse toggle */}
        <button
          onClick={toggleSidebar}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-200/70 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Primary Action: New Chat */}
      <div className="p-3">
        <Button
          onClick={handleNewChat}
          variant="primary"
          className={cn(
            'w-full justify-center transition-all',
            isSidebarCollapsed ? 'px-0 h-10 w-10 mx-auto' : 'h-10'
          )}
          title="Start a new conversation"
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!isSidebarCollapsed && <span className="font-medium text-sm">New Chat</span>}
        </Button>
      </div>

      {/* Main Navigation Links */}
      <div className="px-3 py-2 space-y-1">
        {navLinks.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              title={item.name}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors relative group',
                isActive
                  ? 'bg-neutral-200/80 text-neutral-900 font-semibold dark:bg-neutral-800/90 dark:text-neutral-100'
                  : 'text-neutral-600 hover:bg-neutral-200/50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-200',
                isSidebarCollapsed && 'justify-center px-0'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0',
                  isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-500'
                )}
              />
              {!isSidebarCollapsed && (
                <>
                  <span className="flex-1 truncate">{item.name}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        'text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded tracking-wider',
                        item.badge === 'Admin'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </div>

      {/* Conversation History / Sessions */}
      {!isSidebarCollapsed && (
        <div className="flex-1 flex flex-col min-h-0 px-3 py-2 mt-2 border-t border-neutral-200/80 dark:border-neutral-800">
          <div className="flex items-center justify-between pb-2 px-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Recent Conversations
            </span>
            <Clock className="h-3.5 w-3.5 text-neutral-400" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-xs">
            {isLoadingSessions ? (
              <div className="p-3 text-center text-neutral-400 animate-pulse text-xs">
                Loading history...
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-3 text-center text-neutral-400 text-xs">
                No saved conversations yet.
              </div>
            ) : (
              sessions.map((item) => {
                const isSelected = item.session_id === sessionId;
                return (
                  <button
                    key={item.session_id}
                    onClick={() => handleSelectSession(item.session_id)}
                    className={cn(
                      'w-full text-left rounded-lg px-2.5 py-2 transition-colors flex flex-col gap-0.5 group',
                      isSelected
                        ? 'bg-indigo-50 border border-indigo-200/80 text-indigo-950 font-medium dark:bg-indigo-950/30 dark:border-indigo-800 dark:text-indigo-200'
                        : 'hover:bg-neutral-200/50 text-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900'
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate font-mono text-[11px] font-medium">
                        {item.session_id.slice(0, 8)}...{item.session_id.slice(-4)}
                      </span>
                      {isSelected && (
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      {formatRelativeTime(item.last_activity_at || item.created_at)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Footer / Anonymous Session Info */}
      <div className="p-3 border-t border-neutral-200/80 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400">
        {!isSidebarCollapsed ? (
          <div className="flex items-center justify-between">
            <span className="truncate">Anonymous Session</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-800">
              {sessionId ? `${sessionId.slice(0, 4)}..` : 'New'}
            </span>
          </div>
        ) : (
          <div className="flex justify-center" title={`Active: ${sessionId}`}>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
        )}
      </div>
    </aside>
  );
}
