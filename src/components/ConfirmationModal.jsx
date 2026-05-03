import React, { useEffect, useState } from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({
    isOpen,
    title,
    message,
    confirmText = 'Proceed',
    confirmColor = '#ef4444',
    onConfirm,
    onCancel,
    isSuccess = false,
    isLoading = false
}) => {
    const [isRendered, setIsRendered] = useState(isOpen);

    useEffect(() => {
        if (isOpen) setIsRendered(true);
    }, [isOpen]);

    const handleAnimationEnd = () => {
        if (!isOpen) setIsRendered(false);
    };

    if (!isRendered) return null;

    return (
        <div
            className={`confirmation-modal-overlay ${isOpen ? 'open' : 'closed'}`}
            onClick={(!isSuccess && !isLoading) ? onCancel : undefined}
            onAnimationEnd={handleAnimationEnd}
            onMouseMove={(e) => e.stopPropagation()}
            onMouseEnter={(e) => e.stopPropagation()}
            onMouseLeave={(e) => e.stopPropagation()}
        >
            <div
                className={`confirmation-modal-card ${isOpen ? 'open' : 'closed'}`}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={(e) => e.stopPropagation()}
                onMouseMove={(e) => e.stopPropagation()}
                style={{ textAlign: isSuccess ? 'center' : 'left', padding: isSuccess ? '2rem' : '0' }}
            >
                {isSuccess ? (
                    <div className="success-animation-container">
                        <div className="success-checkmark">
                            <div className="check-icon">
                                <span className="icon-line line-tip"></span>
                                <span className="icon-line line-long"></span>
                                <div className="icon-circle"></div>
                                <div className="icon-fix"></div>
                            </div>
                        </div>
                        <h3 style={{ marginTop: '1rem', color: '#16a34a', fontSize: '1.25rem' }}>Success!</h3>
                    </div>
                ) : (
                    <>
                        <div className="confirmation-header">
                            <h3>{title}</h3>
                        </div>

                        <div className="confirmation-body">
                            <p>{message}</p>
                        </div>

                        <div className="confirmation-footer">
                            <button
                                className="btn btn-outline"
                                onClick={onCancel}
                                disabled={isLoading}
                                style={{
                                    padding: '0.6rem 1.2rem',
                                    opacity: isLoading ? 0.5 : 1,
                                    cursor: isLoading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn"
                                onClick={onConfirm}
                                disabled={isLoading}
                                style={{
                                    backgroundColor: confirmColor,
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.6rem 1.2rem',
                                    opacity: isLoading ? 0.7 : 1,
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="spinner-border" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} role="status"></div>
                                        Processing...
                                    </>
                                ) : (
                                    confirmText
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ConfirmationModal;
