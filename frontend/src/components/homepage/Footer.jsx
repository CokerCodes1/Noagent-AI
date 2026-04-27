import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebook, FaInstagram, FaTwitter, FaYoutube, FaTiktok } from "react-icons/fa";

const Footer = () => {
  const quickLinks = [
    { name: "Rent", href: "/auth?mode=signup" },
    { name: "Sell", href: "/auth?mode=signup" },
    { name: "Technicians", href: "/auth?mode=signup" }
  ];

  const socialLinks = [
    { icon: <FaFacebook />, href: "https://facebook.com/noagentnaija", label: "Facebook" },
    { icon: <FaInstagram />, href: "https://instagram.com/noagentnaija", label: "Instagram" },
    { icon: <FaTwitter />, href: "https://twitter.com/noagentnaija", label: "Twitter" },
    { icon: <FaYoutube />, href: "https://youtube.com/@noagentnaija", label: "YouTube" },
    { icon: <FaTiktok />, href: "https://tiktok.com/@noagentnaija", label: "TikTok" }
  ];

  return (
    <footer style={{
      backgroundColor: '#1a1a1a',
      color: '#f5f5f5',
      padding: '4rem 1.5rem'
    }}>
      <div style={{
        maxWidth: '80rem',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {/* Company Info */}
          <div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '1.5rem',
              background: 'linear-gradient(to right, #b85c38, #a05030)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              NoAgentNaija
            </h3>
            <p style={{
              color: 'rgba(245, 245, 245, 0.8)',
              marginBottom: '1.5rem',
              lineHeight: 1.6
            }}>
              Connecting Nigerians directly for property transactions and services.
              No agents, no commissions, just direct connections.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h4 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '1.5rem'
            }}>
              Contact Us
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FaMapMarkerAlt style={{ color: '#b85c38', flexShrink: 0 }} />
                <span style={{ color: 'rgba(245, 245, 245, 0.8)' }}>Lagos, Nigeria</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FaPhone style={{ color: '#b85c38', flexShrink: 0 }} />
                <span style={{ color: 'rgba(245, 245, 245, 0.8)' }}>+234 XXX XXX XXXX</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FaEnvelope style={{ color: '#b85c38', flexShrink: 0 }} />
                <span style={{ color: 'rgba(245, 245, 245, 0.8)' }}>hello@noagentnaija.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '1.5rem'
            }}>
              Quick Links
            </h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    style={{
                      color: 'rgba(245, 245, 245, 0.8)',
                      textDecoration: 'none',
                      transition: 'color 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.color = '#b85c38';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.color = 'rgba(245, 245, 245, 0.8)';
                    }}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '1.5rem'
            }}>
              Follow Us
            </h4>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(245, 245, 245, 0.8)',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    transform: 'scale(1)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#b85c38';
                    e.target.style.color = 'white';
                    e.target.style.transform = 'scale(1.1)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.color = 'rgba(245, 245, 245, 0.8)';
                    e.target.style.transform = 'scale(1)';
                  }}
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          paddingTop: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <p style={{
            color: 'rgba(245, 245, 245, 0.6)',
            fontSize: '0.875rem',
            margin: 0
          }}>
            © {new Date().getFullYear()} NoAgentNaija. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem' }}>
            <a
              href="#"
              style={{
                color: 'rgba(245, 245, 245, 0.6)',
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.color = '#b85c38';
              }}
              onMouseOut={(e) => {
                e.target.style.color = 'rgba(245, 245, 245, 0.6)';
              }}
            >
              Privacy Policy
            </a>
            <a
              href="#"
              style={{
                color: 'rgba(245, 245, 245, 0.6)',
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.color = '#b85c38';
              }}
              onMouseOut={(e) => {
                e.target.style.color = 'rgba(245, 245, 245, 0.6)';
              }}
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;