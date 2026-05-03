import React, { useState } from 'react';
import { X, Calendar, User, Phone, Mail, MessageSquare, Briefcase, Users } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

export default function TenantDetailsModal({ isOpen, request, onClose }) {
    const [callModalOpen, setCallModalOpen] = useState(false);
    const [phoneNumberToCall, setPhoneNumberToCall] = useState('');

    if (!isOpen || !request) return null;

    // Format date as DD MMM YYYY, HH:MM
    let formattedDate = 'N/A';
    if (request?.createdAt?.seconds) {
        const date = new Date(request.createdAt.seconds * 1000);
        formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
        }}>
            <div className="fade-in" style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                position: 'relative'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    <X size={20} />
                </button>

                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
                        Submission Details
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} /> Submitted on {formattedDate}
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '16px', letterSpacing: '0.5px', fontWeight: 'bold' }}>
                            Tenant Information
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <User size={18} style={{ color: 'var(--text-secondary)', marginTop: '2px' }} />
                                <div>
                                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.85rem' }}>Name</span>
                                    <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                                        {request?.tenantDetails?.name || request?.userName || request?.name || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <Phone size={18} style={{ color: 'var(--text-secondary)', marginTop: '2px' }} />
                                <div>
                                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.85rem' }}>Phone</span>
                                    <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                                        <button 
                                            onClick={() => {
                                                const phone = request?.tenantDetails?.phone || request?.userPhone || request?.phone || '';
                                                if (phone) {
                                                    setPhoneNumberToCall(phone);
                                                    setCallModalOpen(true);
                                                } else {
                                                    alert("Phone number not available");
                                                }
                                            }}
                                            style={{ color: 'var(--primary-color)', textDecoration: 'none', background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', fontWeight: '500' }}
                                        >
                                            {request?.tenantDetails?.phone || request?.userPhone || request?.phone || 'N/A'}
                                        </button>
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <Mail size={18} style={{ color: 'var(--text-secondary)', marginTop: '2px' }} />
                                <div>
                                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.85rem' }}>Email</span>
                                    <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                                        <a href={`mailto:${request?.tenantDetails?.email || request?.userEmail || request?.email || ''}`} style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
                                            {request?.tenantDetails?.email || request?.userEmail || request?.email || 'N/A'}
                                        </a>
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <Briefcase size={18} style={{ color: 'var(--text-secondary)', marginTop: '2px' }} />
                                <div>
                                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.85rem' }}>Profession</span>
                                    <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                                        {request?.tenantDetails?.profession || 'Not provided'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <Users size={18} style={{ color: 'var(--text-secondary)', marginTop: '2px' }} />
                                <div>
                                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.85rem' }}>Total Occupants</span>
                                    <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                                        {request?.tenantDetails?.numberOfOccupants
                                            ? `${request.tenantDetails?.numberOfOccupants} ${Number(request.tenantDetails?.numberOfOccupants) === 1 ? 'person' : 'people'}`
                                            : 'Not provided'
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '16px', letterSpacing: '0.5px', fontWeight: 'bold' }}>
                            Request Context
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.95rem' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <Calendar size={18} style={{ color: 'var(--text-secondary)', marginTop: '2px' }} />
                                <div>
                                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.85rem' }}>Preferred Viewing Time</span>
                                    <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                                        {request?.tenantDetails?.preferredDate || request?.preferredDate || 'Not specified'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <MessageSquare size={18} style={{ color: 'var(--text-secondary)', marginTop: '2px', flexShrink: 0 }} />
                                <div style={{ width: '100%' }}>
                                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Message provided</span>
                                    <div style={{
                                        backgroundColor: 'white',
                                        padding: '12px',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0',
                                        color: 'var(--text-primary)',
                                        lineHeight: '1.5',
                                        whiteSpace: 'pre-wrap',
                                        fontSize: '0.95rem'
                                    }}>
                                        {request?.tenantDetails?.message || request?.message || 'No additional message provided by the tenant.'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                    <button
                        className="btn"
                        onClick={onClose}
                        style={{ padding: '0.6rem 1.2rem' }}
                    >
                        Close Details
                    </button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={callModalOpen}
                title="Make a Call to Tenant"
                message="Are you sure you want to call this tenant? Your phone dialer will be launched."
                confirmText="Call"
                confirmColor="#16a34a"
                onConfirm={() => {
                    window.location.href = `tel:${phoneNumberToCall}`;
                    setCallModalOpen(false);
                }}
                onCancel={() => setCallModalOpen(false)}
            />
        </div>
    );
}
