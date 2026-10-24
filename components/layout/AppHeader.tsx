'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type KeyboardEvent } from 'react';
import { signOut, type AuthUser } from '@/lib/auth';
import { BRAND_NAME } from '@/lib/brand';

const links = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Templates', href: '/dashboard#templates' },
  { label: 'My invitations', href: '/invitations' },
];

function subscribeHash(callback: () => void) {
  window.addEventListener('hashchange', callback);
  window.addEventListener('popstate', callback);
  return () => {
    window.removeEventListener('hashchange', callback);
    window.removeEventListener('popstate', callback);
  };
}

function SearchIcon() {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>;
}

export function AppHeader({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const router = useRouter();
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash, () => '');
  const [scrolled, setScrolled] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const [panel, setPanel] = useState<'menu' | 'search' | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const location = `${pathname}?${searchParams.toString()}`;
  const [previousLocation, setPreviousLocation] = useState(location);
  const userMenu = useRef<HTMLDivElement>(null);
  const avatar = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const initials = user.name.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U';

  // Reset overlays when history navigation changes the route, keeping this header mounted.
  if (location !== previousLocation) {
    setPreviousLocation(location);
    setDropdown(false);
    setPanel(null);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!dropdown) return;
    userMenu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const outside = (event: PointerEvent) => {
      if (!userMenu.current?.contains(event.target as Node)) setDropdown(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [dropdown]);

  useEffect(() => {
    if (!panel) return;
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    element?.querySelector<HTMLElement>(panel === 'search' ? 'input' : 'button')?.focus();
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [panel]);

  function closeOverlays() {
    setDropdown(false);
    setPanel(null);
  }

  async function logout() {
    setSigningOut(true);
    await signOut();
    closeOverlays();
    router.push('/');
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = String(new FormData(event.currentTarget).get('q') ?? '').trim();
    closeOverlays();
    router.push(`/dashboard?q=${encodeURIComponent(text)}`);
  }

  function isActive(label: string) {
    if (label === 'My invitations') return pathname === '/invitations' || pathname.startsWith('/invitations/');
    if (label === 'Templates') return pathname.startsWith('/templates/') || (pathname === '/dashboard' && hash === '#templates');
    return (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) && hash !== '#templates';
  }

  function navigation() {
    return links.map(({ label, href }) => <Link key={label} href={href} onClick={closeOverlays} className="iv-app-link" aria-current={isActive(label) ? 'page' : undefined}>{label}</Link>);
  }

  function searchForm(mobile = false) {
    return <form role="search" aria-label="Search templates" className="iv-app-search" onSubmit={submitSearch}>
      <input key={query} aria-label="Search templates" type="search" name="q" defaultValue={query} placeholder="Search templates…" autoComplete="off" />
      <button type="submit" aria-label="Submit search"><SearchIcon /></button>
      {mobile && <p className="iv-app-search-hint">Find a template for your next celebration.</p>}
    </form>;
  }

  function userBlock() {
    return <div className="iv-app-user-block"><strong>{user.name}</strong><span>{user.email || user.phone}</span></div>;
  }

  function menuKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      setDropdown(false);
      avatar.current?.focus();
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      if (!dropdown) { setDropdown(true); return; }
      const items = Array.from(userMenu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
      const current = items.indexOf(document.activeElement as HTMLElement);
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (current + (event.key === 'ArrowUp' ? -1 : 1) + items.length) % items.length;
      items[index]?.focus();
    }
  }

  function trapFocus(event: KeyboardEvent<HTMLDialogElement>) {
    // Search inputs may consume the browser's native Escape action to clear their value.
    if (event.key === 'Escape') {
      event.preventDefault();
      setPanel(null);
      return;
    }
    if (event.key !== 'Tab') return;
    const items = Array.from(dialog.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input') ?? []);
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }

  return <header data-app-header className={`iv-shared-header${scrolled ? ' iv-shared-header-scrolled' : ''}`}>
    <div className="iv-app-header-inner">
      <Link href="/dashboard" className="iv-app-brand" onClick={closeOverlays} aria-label={`${BRAND_NAME} dashboard`}>{BRAND_NAME}<span aria-hidden="true">✦</span></Link>
      <nav className="iv-app-desktop-nav" aria-label="Main">{navigation()}</nav>
      <div className="iv-app-desktop-search">{searchForm()}</div>
      <button className="iv-app-icon iv-app-mobile-only" type="button" aria-label="Open search" aria-haspopup="dialog" aria-controls="app-header-panel" aria-expanded={panel === 'search'} onClick={() => setPanel('search')}><SearchIcon /></button>
      <div className="iv-app-avatar-wrap" ref={userMenu} onKeyDown={menuKeys} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDropdown(false); }}>
        <button ref={avatar} className="iv-app-avatar" type="button" aria-label="Open user menu" aria-expanded={dropdown} aria-haspopup="menu" aria-controls="app-user-menu" onClick={() => setDropdown(!dropdown)}>{initials}</button>
        {dropdown && <div id="app-user-menu" role="menu" aria-label="User account" className="iv-app-dropdown">
          {userBlock()}
          <Link role="menuitem" href="/profile" onClick={closeOverlays}>Profile</Link>
          <Link role="menuitem" href="/invitations" onClick={closeOverlays}>My invitations</Link>
          <button role="menuitem" type="button" disabled={signingOut} onClick={() => void logout()}>{signingOut ? 'Signing out…' : 'Sign out'}</button>
        </div>}
      </div>
      <button className="iv-app-icon iv-app-mobile-only" type="button" aria-label="Open menu" aria-haspopup="dialog" aria-controls="app-header-panel" aria-expanded={panel === 'menu'} onClick={() => setPanel('menu')}><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /></svg></button>
    </div>
    <dialog ref={dialog} id="app-header-panel" className={`iv-app-panel iv-app-panel-${panel ?? 'menu'}`} aria-label={panel === 'search' ? 'Search templates' : 'Main menu'} onKeyDown={trapFocus} onCancel={() => setPanel(null)} onClose={() => setPanel(null)} onClick={(event) => { if (event.target === event.currentTarget && panel === 'search') setPanel(null); }}>
      <button className="iv-app-panel-close iv-app-icon" type="button" aria-label={panel === 'search' ? 'Close search' : 'Close menu'} onClick={() => setPanel(null)}>×</button>
      {panel === 'menu' && <><p className="iv-app-panel-brand">{BRAND_NAME}<span aria-hidden="true"> ✦</span></p><nav aria-label="Mobile main">{navigation()}</nav>{userBlock()}<div className="iv-app-mobile-account"><Link href="/profile" onClick={closeOverlays}>Profile</Link><button type="button" disabled={signingOut} onClick={() => void logout()}>{signingOut ? 'Signing out…' : 'Sign out'}</button></div></>}
      {panel === 'search' && searchForm(true)}
    </dialog>
  </header>;
}
