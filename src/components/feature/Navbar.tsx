import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoModeContext';
import { supabase } from '@/lib/supabase';
import { getDisplayName } from '@/lib/userDisplay';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dashboardDropdownOpen, setDashboardDropdownOpen] = useState(false);
  const dashboardDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, session, profile, activeRole, isAdmin, signOut, setActiveRole } = useAuth();
  const {
    isDemo,
    demoRole,
    demoWalletBalance,
    demoNotifications,
    startDemo,
    exitDemo,
    resetDemo,
    switchDemoRole,
    markDemoNotificationRead,
    markAllDemoNotificationsRead,
  } = useDemo();

  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifList, setNotifList] = useState<{ id: string; title: string; message: string; is_read: boolean; created_at: string; is_broadcast?: boolean; sender_type?: string; sender_name?: string }[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Reset avatar error when profile/avatar_url changes or demo mode toggles
  useEffect(() => {
    setAvatarError(false);
  }, [profile?.avatar_url, isDemo]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dashboardDropdownRef.current && !dashboardDropdownRef.current.contains(e.target as Node)) {
        setDashboardDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    if (dashboardDropdownOpen || showNotifDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dashboardDropdownOpen, showNotifDropdown]);

  // ---- LIVE notification fetching ----
  const fetchNotificationCount = useCallback(async () => {
    if (!user) return;
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .or(`user_id.eq.${user.id},is_broadcast.eq.true`)
        .eq('is_read', false);

      if (!error) {
        setNotificationCount(count || 0);
      }
    } catch {
      // silently fail
    }
  }, [user]);

  useEffect(() => {
    if (!isDemo) {
      fetchNotificationCount();
      const interval = setInterval(fetchNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchNotificationCount, isDemo]);

  useEffect(() => {
    if (isDemo) return;
    const handleNotificationsUpdated = () => fetchNotificationCount();
    window.addEventListener('notifications-updated', handleNotificationsUpdated);
    return () => window.removeEventListener('notifications-updated', handleNotificationsUpdated);
  }, [isDemo, fetchNotificationCount]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setNotifLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, message, is_read, created_at, sender_type, is_broadcast, sender_name')
        .or(`user_id.eq.${user.id},is_broadcast.eq.true`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setNotifList(data);
      }
    } catch {
      // silently fail
    } finally {
      setNotifLoading(false);
    }
  }, [user]);

  // ---- Unified notification data (demo vs live) ----
  const effectiveNotificationCount = useMemo(() => {
    if (isDemo) return demoNotifications.filter((n) => !n.is_read).length;
    return notificationCount;
  }, [isDemo, demoNotifications, notificationCount]);

  const effectiveNotifList = useMemo(() => {
    if (isDemo) return demoNotifications;
    return notifList;
  }, [isDemo, demoNotifications, notifList]);

  const handleBellClick = () => {
    if (!user && !isDemo) {
      navigate('/login');
      return;
    }
    if (showNotifDropdown) {
      setShowNotifDropdown(false);
    } else {
      if (isDemo) {
        // Demo notifications are already in memory
        setShowNotifDropdown(true);
      } else {
        fetchNotifications();
        setShowNotifDropdown(true);
      }
    }
  };

  const handleMarkAllNotifRead = async () => {
    if (isDemo) {
      markAllDemoNotificationsRead();
      return;
    }
    if (!user) return;
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setNotifList((prev) =>
        prev.map((n) => (n.is_broadcast ? n : { ...n, is_read: true }))
      );
      setNotificationCount(0);
    } catch {
      // silently fail
    }
  };

  const handleNotificationClick = async (notif: typeof notifList[0]) => {
    // Mark as read first
    if (isDemo) {
      markDemoNotificationRead(notif.id);
    } else {
      try {
        // Skip marking broadcast notifications
        if (!notif.is_broadcast) {
          await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notif.id);

          setNotifList((prev) =>
            prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
          );
          setNotificationCount((prev) => Math.max(0, prev - 1));
        }
      } catch {
        // silently fail
      }
    }

    // Close dropdown
    setShowNotifDropdown(false);

    // Smart routing based on notification content
    const title = (notif.title || '').toLowerCase();
    const message = (notif.message || '').toLowerCase();
    const combined = title + ' ' + message;

    // Check for job-related patterns
    if (combined.includes('job') || combined.includes('quote') || combined.includes('lead')) {
      // Navigate to the relevant dashboard
      if (combined.includes('tradesperson') || combined.includes('contractor') || combined.includes('quote submitted') || combined.includes('lead')) {
        navigate('/dashboard/tradesperson');
      } else if (combined.includes('project owner') || combined.includes('homeowner') || combined.includes('job posted')) {
        navigate('/dashboard/project-owner');
      } else {
        // Default jobs-related → tradesperson dashboard
        navigate('/dashboard/tradesperson');
      }
    } else if (combined.includes('verification') || combined.includes('verified') || combined.includes('document') || combined.includes('badge')) {
      navigate('/dashboard/tradesperson');
    } else if (combined.includes('top-up') || combined.includes('credit') || combined.includes('wallet') || combined.includes('payment')) {
      navigate('/dashboard/tradesperson');
    } else if (combined.includes('review') || combined.includes('testimonial') || combined.includes('rating')) {
      navigate('/testimonials');
    } else {
      // General / system notification → go to notifications page
      navigate('/notifications');
    }
  };

  // Browser notification permission prompt (live only)
  useEffect(() => {
    if (session && !isDemo && 'Notification' in window && Notification.permission === 'default') {
      const timer = setTimeout(() => {
        Notification.requestPermission().catch(() => {});
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [session, isDemo]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fixed navigation links — same for all roles
  const navLinks = useMemo(() => [
    { label: 'Home', href: '/' },
    { label: 'Find Tradespeople', href: '/contractors' },
    { label: 'Post a Job', href: '/post-job' },
  ], []);

  // Dashboard dropdown — Project Owner always shown, Tradesperson only if applicable
  const dashboardOptions = useMemo(() => {
    const options: { label: string; href: string }[] = [];
    if (isDemo) {
      // Demo mode: allow switching between both demo roles from the navbar
      options.push({ label: 'Project Owner', href: '/dashboard/project-owner' });
      options.push({ label: 'Tradesperson', href: '/dashboard/tradesperson' });
    } else if (isAdmin) {
      options.push({ label: 'Admin Dashboard', href: '/dashboard/admin' });
      options.push({ label: 'Project Owner', href: '/dashboard/project-owner' });
      options.push({ label: 'Tradesperson', href: '/dashboard/tradesperson' });
    } else if (profile) {
      // Always show Project Owner for logged-in users
      options.push({ label: 'Project Owner', href: '/dashboard/project-owner' });
      // Show Tradesperson only if user is a tradesperson
      if (profile.is_tradesperson) {
        options.push({ label: 'Tradesperson', href: '/dashboard/tradesperson' });
      }
    }
    return options;
  }, [isAdmin, profile, isDemo]);

  const showDashboardDropdown = dashboardOptions.length > 0;
  const showBecomeTradesperson = !isDemo && profile && !profile.is_tradesperson && !isAdmin;

  // Pages without hero images should always use dark text
  const isPlainPage = useMemo(() => {
    const path = location.pathname;
    return path.startsWith('/dashboard') ||
      path.startsWith('/profile') ||
      path.startsWith('/bg-ops') ||
      path.startsWith('/control-panel') ||
      path.startsWith('/post-job') ||
      path.startsWith('/submit-quote') ||
      path.startsWith('/jobs/') ||
      path.startsWith('/notifications') ||
      path.startsWith('/contractors') ||
      path.startsWith('/tradesperson') ||
      path.startsWith('/how-it-works') ||
      path.startsWith('/testimonials') ||
      path === '/login' ||
      path === '/register';
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const switchToRole = (targetRole: 'tradesperson' | 'project_owner' | 'admin') => {
    setDashboardDropdownOpen(false);
    if (isDemo) {
      if ((targetRole === 'tradesperson' && demoRole !== 'tradesperson') ||
          (targetRole === 'project_owner' && demoRole !== 'project_owner')) {
        switchDemoRole();
      }
      navigate(targetRole === 'tradesperson' ? '/dashboard/tradesperson' : '/dashboard/project-owner');
      return;
    }
    setActiveRole(targetRole);
    if (targetRole === 'tradesperson') navigate('/dashboard/tradesperson');
    else if (targetRole === 'project_owner') navigate('/dashboard/project-owner');
    else if (targetRole === 'admin') navigate('/dashboard/admin');
  };

  const effectiveActiveRole = isDemo
    ? (demoRole === 'tradesperson' ? 'tradesperson' : 'project_owner')
    : activeRole;

  // Dark styling applies on plain pages or when scrolled
  const forceDark = isPlainPage || scrolled;
  const navbarBg = forceDark ? 'bg-background-50/95 backdrop-blur-md border-b border-background-200/70' : 'bg-transparent';
  const linkTextColor = forceDark ? 'text-foreground-700' : 'text-background-50/90';
  const logoTextColor = forceDark ? 'text-foreground-900' : 'text-background-50';
  const brandButtonStyle = forceDark
    ? 'bg-primary-500 text-background-50 hover:bg-primary-600'
    : 'bg-background-50 text-foreground-900 hover:bg-background-100';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navbarBg}`}>
      {/* Demo Banner */}
      {isDemo && (
        <div className="bg-amber-400 border-b border-amber-500 px-4 py-2 flex items-center justify-center gap-2">
          <div className="w-4 h-4 flex items-center justify-center shrink-0">
            <i className="ri-gamepad-line text-amber-900 text-sm" />
          </div>
          <p className="text-amber-900 text-xs md:text-sm font-label font-medium text-center">
            DEMO MODE — Explore the full BuildGuyana.gy experience. No data is saved.
          </p>
        </div>
      )}

      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Left: Logo + Nav Links */}
          <div className="flex items-center gap-8 lg:gap-10">
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-primary-500 flex items-center justify-center">
                <i className="ri-hammer-fill text-background-50 text-sm md:text-base" />
              </div>
              <span className={`font-heading font-bold text-lg md:text-xl tracking-tight transition-colors ${logoTextColor}`}>
                BuildGuyana.gy
              </span>
              <span className="text-[10px] sm:text-xs font-label text-foreground-400 self-end mb-0.5 inline">v1.1.0</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {isDemo ? (
                <span className="font-label text-sm font-medium text-foreground-500 whitespace-nowrap">
                  Demo Mode — Links Disabled
                </span>
              ) : (
                navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`font-label text-sm font-medium transition-colors hover:text-primary-500 whitespace-nowrap ${linkTextColor}`}
                  >
                    {link.label}
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Right: Demo Controls + Dashboard Dropdown + Notifications + Username + Logout */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            {/* Demo Mode Controls */}
            {isDemo && (
              <div className="flex items-center gap-2 mr-2">
                {demoRole === 'tradesperson' && (
                  <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-md font-label font-medium whitespace-nowrap">
                    Demo Credits: {demoWalletBalance}
                  </span>
                )}
                <button
                  onClick={() => { exitDemo(); navigate('/'); }}
                  className="text-xs px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Exit Demo
                </button>
                <button
                  onClick={resetDemo}
                  className="text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Reset Demo Data
                </button>
              </div>
            )}

            {session || isDemo ? (
              <>
                {/* Notifications */}
                <div className="relative" ref={notifDropdownRef}>
                  <button
                    onClick={handleBellClick}
                    className={`relative font-label text-sm font-medium px-2 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                      forceDark
                        ? 'text-foreground-600 hover:text-primary-500'
                        : 'text-background-50/80 hover:text-background-50'
                    }`}
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      <i className="ri-notification-3-line text-lg" />
                    </div>
                    {effectiveNotificationCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-accent-500 text-background-50 text-[10px] font-bold flex items-center justify-center px-1">
                        {effectiveNotificationCount > 9 ? '9+' : effectiveNotificationCount}
                      </span>
                    )}
                  </button>

                  {showNotifDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-background-50 border border-background-200/70 rounded-lg shadow-lg py-2 z-50 max-h-96 overflow-y-auto">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-background-200/70">
                        <span className="font-label text-xs font-semibold text-foreground-900">Notifications</span>
                        {effectiveNotificationCount > 0 && (
                          <button
                            onClick={handleMarkAllNotifRead}
                            className="text-xs text-primary-600 hover:text-primary-700 font-label cursor-pointer whitespace-nowrap"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      {notifLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : effectiveNotifList.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center">
                            <i className="ri-notification-off-line text-foreground-400 text-lg" />
                          </div>
                          <p className="text-xs text-foreground-500">No notifications yet</p>
                        </div>
                      ) : (
                        <div>
                          {effectiveNotifList.map((n) => (
                            <div
                              key={n.id}
                              className={`px-4 py-3 border-b border-background-100 last:border-0 hover:bg-background-50 transition-colors cursor-pointer ${!n.is_read ? 'bg-primary-50/40' : ''}`}
                              onClick={() => handleNotificationClick(n)}
                            >
                              <div className="flex items-start gap-2">
                                {!n.is_read && (
                                  <span className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  {n.sender_name && (
                                    <p className="text-[10px] font-label font-medium text-foreground-400 mb-0.5">From: {n.sender_name}</p>
                                  )}
                                  <p className="text-xs font-label font-semibold text-foreground-900 truncate">{n.title}</p>
                                  <p className="text-xs text-foreground-600 mt-0.5 line-clamp-2">{n.message}</p>
                                  <p className="text-[10px] text-foreground-400 mt-1">
                                    {(() => {
                                      const diff = Date.now() - new Date(n.created_at).getTime();
                                      const mins = Math.floor(diff / 60000);
                                      if (mins < 1) return 'Just now';
                                      if (mins < 60) return `${mins}m ago`;
                                      const hours = Math.floor(mins / 60);
                                      if (hours < 24) return `${hours}h ago`;
                                      return new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                                    })()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                          <Link
                            to="/notifications"
                            onClick={() => setShowNotifDropdown(false)}
                            className="block text-center text-xs font-label text-primary-600 hover:text-primary-700 py-2 border-t border-background-200/70"
                          >
                            View all notifications
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Dashboard — dropdown */}
                {showDashboardDropdown && (
                  <div className="relative" ref={dashboardDropdownRef}>
                    <button
                      onClick={() => setDashboardDropdownOpen(!dashboardDropdownOpen)}
                      className={`font-label text-sm font-medium px-3 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        forceDark
                          ? 'text-foreground-700 hover:text-primary-500'
                          : 'text-background-50/90 hover:text-background-50'
                      }`}
                    >
                      Dashboard
                      <div className="w-3 h-3 flex items-center justify-center">
                        {dashboardDropdownOpen ? (
                          <i className="ri-arrow-up-s-line text-xs" />
                        ) : (
                          <i className="ri-arrow-down-s-line text-xs" />
                        )}
                      </div>
                    </button>
                    {dashboardDropdownOpen && (
                      <div className="absolute right-0 top-full mt-2 w-52 bg-background-50 border border-background-200/70 rounded-lg shadow-lg py-1.5 z-50">
                        {dashboardOptions.map((opt) => {
                          const role = opt.href.includes('tradesperson') ? 'tradesperson' as const
                            : opt.href.includes('admin') ? 'admin' as const
                            : 'project_owner' as const;
                          return (
                            <button
                              key={opt.href}
                              onClick={() => switchToRole(role)}
                              className={`block w-full text-left font-label text-sm px-4 py-2.5 transition-colors whitespace-nowrap cursor-pointer ${
                                effectiveActiveRole === role
                                  ? 'text-primary-600 bg-primary-50/50 font-medium'
                                  : 'text-foreground-700 hover:text-primary-500 hover:bg-background-100'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                        {showBecomeTradesperson && (
                          <>
                            <div className="border-t border-background-200/70 my-1" />
                            <Link
                              to="/register?role=tradesperson"
                              onClick={() => setDashboardDropdownOpen(false)}
                              className="block w-full text-left font-label text-xs text-foreground-500 hover:text-primary-500 hover:bg-background-100 px-4 py-2.5 transition-colors whitespace-nowrap cursor-pointer"
                            >
                              Become a Tradesperson
                            </Link>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Username — clickable to profile */}
                <Link
                  to="/profile"
                  className={`font-label text-sm font-medium px-2 py-1 rounded-md transition-all whitespace-nowrap flex items-center gap-2 ${
                    forceDark
                      ? 'text-foreground-600 hover:text-primary-500'
                      : 'text-background-50/80 hover:text-background-50'
                  }`}
                  title="Go to Profile"
                >
                  {isDemo ? (
                    <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-amber-700">
                        {demoRole === 'tradesperson' ? 'RS' : 'SW'}
                      </span>
                    </div>
                  ) : profile?.avatar_url && !avatarError ? (
                    <img
                      src={profile.avatar_url}
                      alt={getDisplayName(profile.full_name, user?.email)}
                      className="w-6 h-6 rounded-full object-cover border border-background-200/70"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-background-200 flex items-center justify-center border border-background-200/70">
                      <span className="text-[10px] font-bold text-foreground-500">
                        {profile?.full_name === 'Deleted User'
                          ? 'X'
                          : profile?.full_name
                            ? profile.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                            : user?.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <span className="max-w-[100px] truncate">
                    {isDemo
                      ? (demoRole === 'tradesperson' ? 'Rajesh Singh' : 'Sarah Williams')
                      : getDisplayName(profile?.full_name, user?.email)}
                  </span>
                </Link>

                {/* Logout */}
                {!isDemo && (
                  <button
                    onClick={handleSignOut}
                    className={`font-label text-sm font-medium px-3 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                      forceDark
                        ? 'text-foreground-600 hover:text-accent-600 border border-background-200/70 hover:border-accent-300/60'
                        : 'text-background-50/80 hover:text-background-50 border border-background-50/30 hover:border-background-50/60'
                    }`}
                  >
                    Log Out
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => { startDemo(); navigate('/dashboard/project-owner'); }}
                  className="font-label text-sm font-medium px-4 py-2 rounded-md transition-all whitespace-nowrap text-amber-600 hover:text-amber-700 border border-amber-300/60 hover:border-amber-400/60 cursor-pointer"
                >
                  Try Demo
                </button>
                <Link
                  to="/login"
                  className={`font-label text-sm font-medium px-4 py-2 rounded-md transition-all whitespace-nowrap ${
                    forceDark
                      ? 'text-foreground-700 hover:text-primary-500'
                      : 'text-background-50/90 hover:text-background-50'
                  }`}
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className={`font-label text-sm font-semibold px-5 py-2.5 rounded-md transition-all whitespace-nowrap ${brandButtonStyle}`}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden w-10 h-10 flex items-center justify-center rounded-md transition-colors ${
              forceDark ? 'text-foreground-900' : 'text-background-50'
            }`}
          >
            <i className={`ri-${mobileOpen ? 'close' : 'menu'}-line text-xl`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background-50/98 backdrop-blur-md border-b border-background-200/70">
          <div className="px-4 py-4 space-y-1">
            {isDemo ? (
              <p className="font-label text-sm font-medium text-foreground-500 px-3 py-2.5">
                Demo Mode — Links Disabled
              </p>
            ) : (
              navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block font-label text-sm font-medium text-foreground-700 hover:text-primary-500 px-3 py-2.5 rounded-md hover:bg-background-100 transition-colors"
                >
                  {link.label}
                </Link>
              ))
            )}

            {/* Demo mobile controls */}
            {isDemo && (
              <div className="space-y-2 px-3 py-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => { exitDemo(); navigate('/'); setMobileOpen(false); }}
                    className="flex-1 text-xs px-3 py-2 rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Exit Demo
                  </button>
                  <button
                    onClick={() => { resetDemo(); setMobileOpen(false); }}
                    className="flex-1 text-xs px-3 py-2 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Reset Demo Data
                  </button>
                </div>
              </div>
            )}

            {isDemo ? null : (
              <div className="pt-2 flex flex-col gap-2">
                {session ? (
                  <>
                    {/* Dashboard links in mobile */}
                    {dashboardOptions.map((opt) => {
                      const role = opt.href.includes('tradesperson') ? 'tradesperson' as const
                        : opt.href.includes('admin') ? 'admin' as const
                        : 'project_owner' as const;
                      return (
                        <button
                          key={opt.href}
                          onClick={() => { switchToRole(role); setMobileOpen(false); }}
                          className={`w-full font-label text-sm font-medium px-3 py-2.5 rounded-md border border-background-300/60 text-center cursor-pointer whitespace-nowrap ${
                            effectiveActiveRole === role ? 'text-primary-600 bg-primary-50/50' : 'text-foreground-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                    {showBecomeTradesperson && (
                      <Link
                        to="/register?role=tradesperson"
                        onClick={() => setMobileOpen(false)}
                        className="w-full font-label text-xs font-medium text-foreground-600 px-3 py-2.5 rounded-md border border-background-300/60 text-center cursor-pointer"
                      >
                        Become a Tradesperson
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="w-full font-label text-sm font-medium text-foreground-700 px-3 py-2.5 rounded-md hover:bg-background-100 transition-colors text-center flex items-center justify-center gap-2"
                    >
                      <div className="w-4 h-4 flex items-center justify-center">
                        <i className="ri-user-3-line" />
                      </div>
                      My Profile
                    </Link>
                    <Link
                      to="/notifications"
                      onClick={() => setMobileOpen(false)}
                      className="w-full font-label text-sm font-medium text-foreground-700 px-3 py-2.5 rounded-md hover:bg-background-100 transition-colors text-center flex items-center justify-center gap-2"
                    >
                      <div className="w-4 h-4 flex items-center justify-center">
                        <i className="ri-notification-3-line" />
                      </div>
                      Notifications
                      {effectiveNotificationCount > 0 && (
                        <span className="min-w-[18px] h-[18px] rounded-full bg-accent-500 text-background-50 text-[10px] font-bold flex items-center justify-center px-1">
                          {effectiveNotificationCount > 9 ? '9+' : effectiveNotificationCount}
                        </span>
                      )}
                    </Link>
                    <button
                      onClick={() => { handleSignOut(); setMobileOpen(false); }}
                      className="w-full font-label text-sm font-medium text-accent-700 px-3 py-2.5 rounded-md border border-accent-300/60 hover:bg-accent-50 transition-colors cursor-pointer"
                    >
                      Log Out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { startDemo(); navigate('/dashboard/project-owner'); setMobileOpen(false); }}
                      className="w-full font-label text-sm font-medium text-amber-600 px-3 py-2.5 rounded-md border border-amber-300/60 text-center cursor-pointer"
                    >
                      Try Demo (No Sign-up)
                    </button>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="w-full font-label text-sm font-medium text-foreground-700 px-3 py-2.5 rounded-md border border-background-300/60 text-center"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="w-full font-label text-sm font-semibold bg-primary-500 text-background-50 px-3 py-2.5 rounded-md hover:bg-primary-600 transition-colors text-center"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}