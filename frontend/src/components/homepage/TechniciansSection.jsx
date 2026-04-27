import { useNavigate } from "react-router-dom";
import { FaTools, FaHandshake, FaStar, FaClock } from "react-icons/fa";
import { technicianCategories } from "../../utils/technicianCategories";

const TechniciansSection = () => {
  const navigate = useNavigate();

  const handleJoinTechnician = () => {
    navigate("/auth?mode=signup");
  };

  const benefits = [
    {
      icon: <FaHandshake style={{ fontSize: '1.5rem' }} />,
      title: "Direct Client Connections",
      description: "Connect directly with customers without platform fees or commissions."
    },
    {
      icon: <FaStar style={{ fontSize: '1.5rem' }} />,
      title: "Build Your Reputation",
      description: "Earn reviews and ratings that help you attract more clients."
    },
    {
      icon: <FaClock style={{ fontSize: '1.5rem' }} />,
      title: "Flexible Schedule",
      description: "Work on your own terms and manage your availability."
    },
    {
      icon: <FaTools style={{ fontSize: '1.5rem' }} />,
      title: "Showcase Your Skills",
      description: "Create detailed profiles with photos, videos, and service descriptions."
    }
  ];

  return (
    <section style={{
      padding: '5rem 1.5rem',
      background: 'var(--surface, #fff8ef)'
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
              Turn Your Skill Into Daily Income
            </h2>
            <p style={{
              fontSize: '1.25rem',
              color: 'var(--muted, #5a4330)',
              marginBottom: '2rem',
              lineHeight: 1.6
            }}>
              Join thousands of skilled professionals earning steady income.
              Connect directly with customers and build your business on Nigeria's largest service marketplace.
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
              onClick={handleJoinTechnician}
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
              Join as Technician
            </button>
          </div>

          {/* Categories Showcase */}
          <div style={{
            position: 'relative'
          }}>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '1rem',
              padding: '2rem',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                Popular Categories
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '1rem'
              }}>
                {technicianCategories.slice(0, 12).map((category, index) => (
                  <div key={category} style={{
                    backgroundColor: 'rgba(184, 92, 56, 0.1)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = 'rgba(184, 92, 56, 0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'rgba(184, 92, 56, 0.1)';
                  }}>
                    <div style={{
                      color: '#b85c38',
                      fontWeight: '500',
                      fontSize: '0.875rem'
                    }}>
                      {category}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <span style={{
                  color: 'var(--muted, #5a4330)',
                  fontSize: '0.875rem'
                }}>
                  And 50+ more categories...
                </span>
              </div>
            </div>

            <div style={{
              position: 'absolute',
              bottom: '-1.5rem',
              left: '-1.5rem',
              backgroundColor: '#2f7a53',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                15K+
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                Active Technicians
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechniciansSection;