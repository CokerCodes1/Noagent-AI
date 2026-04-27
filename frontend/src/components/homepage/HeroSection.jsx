import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/auth?mode=signup");
  };

  const handleLogin = () => {
    navigate("/auth?mode=login");
  };

  const handleJoinTechnician = () => {
    navigate("/auth?mode=signup");
  };

  return (
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, rgba(184, 92, 56, 0.2) 0%, rgba(152, 67, 37, 0.3) 100%)'
    }}>
      {/* Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)'
      }}></div>

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        textAlign: 'center',
        padding: '0 1.5rem',
        maxWidth: '64rem',
        margin: '0 auto',
        color: 'white'
      }}>
        <h1 style={{
          fontSize: 'clamp(3rem, 8vw, 7rem)',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          background: 'linear-gradient(to right, white, #ffd4b8, white)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          No Agents. Just Direct Connections.
        </h1>

        <p style={{
          fontSize: 'clamp(1.25rem, 4vw, 2rem)',
          marginBottom: '2rem',
          maxWidth: '42rem',
          margin: '0 auto 2rem'
        }}>
          Connect directly with landlords, renters, and skilled technicians in Nigeria.
          Skip the middleman and save time & money.
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '3rem'
        }}>
          <button
            onClick={handleGetStarted}
            style={{
              padding: '1rem 2rem',
              backgroundColor: '#b85c38',
              color: '#fff6f1',
              border: 'none',
              borderRadius: '50px',
              fontSize: '1.125rem',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            Get Started
          </button>
          <button
            onClick={handleLogin}
            style={{
              padding: '1rem 2rem',
              backgroundColor: 'transparent',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '50px',
              fontSize: '1.125rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.transform = 'scale(1)';
            }}
          >
            Login
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;