import { Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import {
  MessageCircle,
  CirclePlay,
  Instagram,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react'

const footerLinks = [
  { to: '/', label: 'Home' },
  { to: '/music', label: 'Music' },
  { to: '/market', label: 'Market' },
  { to: '/cart', label: 'Cart' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/about', label: 'About' },
  { to: '/invite-us', label: 'Invite Us' },
] as const

export default function Footer() {
  const year = new Date().getFullYear()
  const footerData = useQuery(api.setfooter.getSetFooter)

  return (
    <footer className="site-footer px-4 pb-10 pt-14">
      <div className="page-wrap site-footer__grid">
        <div>
          <h2 className="site-footer__brand">Baah Prosper Music</h2>
          <p className="site-footer__copy">
            Spreading the message of faith, hope, and love through the power of
            Ghanaian gospel music. A digital sanctuary for the soul.
          </p>
        </div>

        <div>
          <p className="site-footer__heading">Navigation</p>
          <div className="site-footer__nav">
            {footerLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="site-footer__nav-link"
                preload="intent"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="site-footer__heading">Contact</p>
          <div className="site-footer__contact-list">
            <p className="site-footer__contact-item">
              <Mail size={14} />
              <span>josephnok088@gmail.com</span>
            </p>
            <p className="site-footer__contact-item">
              <Phone size={14} />
              <span>+233 25 765 2446 | 0249795069</span>
            </p>
            <p className="site-footer__contact-item">
              <MapPin size={14} />
              <span>Suyani-Fiapre, Ghana</span>
            </p>
          </div>
        </div>

        <div>
          <p className="site-footer__heading">Follow Us / Contact Us</p>
          <div className="site-footer__socials">
            {(!footerData || footerData.whatsapp) && (
              <a href={footerData?.whatsapp || "#"} className="site-footer__social" aria-label="WhatsApp" target="_blank" rel="noreferrer">
                <MessageCircle size={15} />
              </a>
            )}
            {(!footerData || footerData.youtube) && (
              <a
                href={footerData?.youtube || "https://www.youtube.com/@Prosper_Baah"}
                className="site-footer__social"
                aria-label="YouTube"
                target="_blank" rel="noreferrer"
              >
                <CirclePlay size={15} />
              </a>
            )}
            {(!footerData || footerData.instagram) && (
              <a href={footerData?.instagram || "#"} className="site-footer__social" aria-label="Instagram" target="_blank" rel="noreferrer">
                <Instagram size={15} />
              </a>
            )}
            {(!footerData || footerData.tiktok) && (
              <a href={footerData?.tiktok || "#"} className="site-footer__social" aria-label="TikTok" target="_blank" rel="noreferrer">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="page-wrap site-footer__bottom">
        <p className="m-0">
          &copy; {year} Baah Prosper Music. All rights reserved.
        </p>
        <div className="site-footer__legal">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
        </div>
      </div>
    </footer>
  )
}
