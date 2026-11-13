const LoadingSpinner = ({ fullPage = true }) => {
  if (fullPage) {
    return (
      <div className="spinner-container" style={{ minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--white-50)', fontSize: '0.875rem' }}>Loading...</p>
        </div>
      </div>
    );
  }
  return <div className="spinner spinner-sm" />;
};

export default LoadingSpinner;
