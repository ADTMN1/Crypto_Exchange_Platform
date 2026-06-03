interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({ message = "Loading..." }: LoadingOverlayProps) {
  return (
    <div className="loading-overlay">
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
