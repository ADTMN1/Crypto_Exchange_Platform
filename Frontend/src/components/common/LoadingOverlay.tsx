interface LoadingOverlayProps {
  message?: string;
  fullPage?: boolean;
}

export default function LoadingOverlay({ 
  message = "Loading...", 
  fullPage = true 
}: LoadingOverlayProps) {
  return (
    <div className={`loading-overlay ${fullPage ? '' : 'container-only'}`}>
      <div className="loading-overlay-content">
        <div className="loading-spinner-professional">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p className="loading-overlay-message">{message}</p>
      </div>
    </div>
  );
}
