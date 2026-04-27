import { useNavigate } from "react-router-dom";
import { FaHome, FaMoneyBillWave, FaClock, FaShieldAlt } from "react-icons/fa";

const RentersSection = () => {
  const navigate = useNavigate();

  const handleFindHome = () => {
    navigate("/auth?mode=signup");
  };

  const benefits = [
    {
      icon: <FaHome style={{ fontSize: '1.5rem' }} />,
      title: "Direct Property Access",
      description: "Browse verified properties directly from landlords without agent fees."
    },
    {
      icon: <FaMoneyBillWave style={{ fontSize: '1.5rem' }} />,
      title: "Save Money",
      description: "Eliminate agent commissions and negotiate directly with property owners."
    },
    {
      icon: <FaClock style={{ fontSize: '1.5rem' }} />,
      title: "Quick Process",
      description: "Contact landlords instantly and complete transactions faster."
    },
    {
      icon: <FaShieldAlt style={{ fontSize: '1.5rem' }} />,
      title: "Verified Listings",
      description: "All properties are verified to ensure you get what you see."
    }
  ];

  return (
    <section style={{
      padding: '5rem 1.5rem',
      backgroundColor: 'var(--surface, #fff8ef)'
    }}>
      <div style={{
        maxWidth: '80rem',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '4rem',
          alignItems: 'center'
        }}>
          {/* Content */}
          <div>
            <h2 style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 'bold',
              marginBottom: '1.5rem',
              background: 'linear-gradient(to right, #b85c38, #8f4325)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Find Homes Without Agents
            </h2>
            <p style={{
              fontSize: '1.25rem',
              color: 'var(--muted, #5a4330)',
              marginBottom: '2rem',
              lineHeight: 1.6
            }}>
              Discover your perfect home directly from verified landlords across Nigeria.
              Skip the middleman, save thousands in agent fees, and connect directly with property owners.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2.5rem'
            }}>
              {benefits.map((benefit, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ color: '#b85c38', marginTop: '0.25rem' }}>
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 style={{
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      fontSize: '1.1rem'
                    }}>
                      {benefit.title}
                    </h3>
                    <p style={{
                      color: 'var(--muted, #5a4330)',
                      fontSize: '0.9rem',
                      lineHeight: 1.5
                    }}>
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleFindHome}
              style={{
                padding: '1rem 2rem',
                backgroundColor: '#b85c38',
                color: '#fff6f1',
                border: 'none',
                borderRadius: '50px',
                fontSize: '1.125rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(184, 92, 56, 0.3)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 6px 20px rgba(184, 92, 56, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 4px 12px rgba(184, 92, 56, 0.3)';
              }}
            >
              Find a Home
            </button>
          </div>

          {/* Image Placeholder */}
          <div style={{
            position: 'relative',
            aspectRatio: '1',
            borderRadius: '1rem',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(73, 42, 16, 0.12)',
            background: 'linear-gradient(135deg, rgba(184, 92, 56, 0.2), rgba(152, 67, 37, 0.3))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ textAlign: 'center', color: '#b85c38' }}>
              <FaHome style={{ fontSize: '4rem', marginBottom: '1rem' }} />
              <p style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Property Search
              </p>
              <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                Find your perfect home
              </p>
            </div>
            <div style={{
              position: 'absolute',
              bottom: '-1.5rem',
              left: '-1.5rem',
              backgroundColor: '#b85c38',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                50K+
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                Happy Renters
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RentersSection;