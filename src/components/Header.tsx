import { Link } from '@tanstack/react-router'
import { Menu, ShoppingCart, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { loadCart } from '../lib/cart'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/music', label: 'Music' },
  { to: '/market', label: 'Market' },
  { to: '/invite-us', label: 'Invite Us' },
] as const
const menuItems = [
  { to: '/cart', label: 'Cart' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/about', label: 'About' },
] as const

export default function Header() {
  const [cartCount, setCartCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const headerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const syncCart = () => {
      setCartCount(loadCart().reduce((sum, item) => sum + item.quantity, 0))
    }
    syncCart()
    window.addEventListener('storage', syncCart)
    window.addEventListener('cart-updated', syncCart as EventListener)
    return () => {
      window.removeEventListener('storage', syncCart)
      window.removeEventListener('cart-updated', syncCart as EventListener)
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (!headerRef.current) return
      if (!headerRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [menuOpen])

  return (
    <header ref={headerRef} className="site-header px-4">
      <nav className="page-wrap site-header__nav">
        <Link to="/" className="brand-mark no-underline">
          Baah Prosper Music
        </Link>

        <div className="site-header__links">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="nav-link"
              activeProps={{ className: 'nav-link is-active' }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="site-header__actions">
          <Link
            to="/cart"
            className="site-header__icon relative"
            aria-label="Cart"
          >
            <ShoppingCart size={16} strokeWidth={2} />
            {cartCount > 0 ? (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-(--color-primary) px-1 text-[10px] font-bold text-black">
                {cartCount}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            className="site-header__icon menu-trigger"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {menuOpen ? (
              <X size={16} strokeWidth={2} />
            ) : (
              <Menu size={16} strokeWidth={2} />
            )}
          </button>
        </div>
      </nav>

      {menuOpen ? (
        <div className="site-header__menu-panel">
          <div className="site-header__mobile">
            {[...navItems, ...menuItems].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="site-header__mobile-link"
                activeProps={{
                  className: 'site-header__mobile-link is-active',
                }}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  )
}
