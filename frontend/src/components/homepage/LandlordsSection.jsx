import { useNavigate } from "react-router-dom";
import { FaChartLine, FaUsers, FaCalendarAlt, FaPiggyBank } from "react-icons/fa";

const LandlordsSection = () => {
  const navigate = useNavigate();

  const handleListProperty = () => {
    navigate("/auth?mode=signup");
  };

  const features = [
    {
      icon: <FaUsers style={{ fontSize: '1.5rem' }} />,
      title: "Tenant Management",
      description: "Easily track rent payments, manage tenant information, and handle renewals."
    },
    {
      icon: <FaPiggyBank style={{ fontSize: '1.5rem' }} />,
      title: "Rent Tracking",
      description: "Monitor rent collection, track payment history, and manage arrears."
    },
    {
      icon: <FaChartLine style={{ fontSize: '1.5rem' }} />,
      title: "Sales Analytics",
      description: "Get insights into property performance and market trends."
    },
    {
      icon: <FaCalendarAlt style={{ fontSize: '1.5rem' }} />,
      title: "Maintenance Scheduling",
      description: "Schedule repairs and connect with verified technicians instantly."
    }
  ];

  return (
    <section style={{
      padding: '5rem 1.5rem',
      background: 'linear-gradient(135deg, var(--surface, #fff8ef) 0%, var(--surface-strong, #ead6b7) 100%)'
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
            justifyContent: 'center',
            order: '2'
          }}>
            <div style={{ textAlign: 'center', color: '#b85c38' }}>
              <FaChartLine style={{ fontSize: '4rem', marginBottom: '1rem' }} />
              <p style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Property Management
              </p>
              <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                Manage with ease
              </p>
            </div>
            <div style={{
              position: 'absolute',
              top: '-1.5rem',
              right: '-1.5rem',
              backgroundColor: '#2f7a53',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                ₦2.5M+
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                Monthly Revenue
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ order: '1' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 'bold',
              marginBottom: '1.5rem',
              background: 'linear-gradient(to right, #b85c38, #8f4325)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Manage Properties Like a Pro
            </h2>
            <p style={{
              fontSize: '1.25rem',
              color: 'var(--muted, #5a4330)',
              marginBottom: '2rem',
              lineHeight: 1.6
            }}>
              Take control of your property portfolio with powerful management tools.
              Track income, manage tenants, and grow your real estate business effortlessly.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2.5rem'
            }}>
              {features.map((feature, index) => (
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
                    {feature.icon}
                  </div>
                  <div>
                    <h3 style={{
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      fontSize: '1.1rem'
                    }}>
                      {feature.title}
                    </h3>
                    <p style={{
                      color: 'var(--muted, #5a4330)',
                      fontSize: '0.9rem',
                      lineHeight: 1.5
                    }}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleListProperty}
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
              List Property
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandlordsSection;