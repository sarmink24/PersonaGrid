import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAdmin } from '../contexts/AdminContext';
import { fetchOrganizations, toggleOrganizationStatus, updateOrganization, deleteOrganization } from '../api/admin';
import './OrganizationProfilePage.css';

export const OrganizationProfilePage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { admin } = useAdmin();

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mission: '',
    });

    const organizationsQuery = useQuery({
        queryKey: ['admin-organizations'],
        queryFn: fetchOrganizations,
        enabled: !!admin,
    });

    const organization = organizationsQuery.data?.data.find((org: any) => org.id === id);

    useEffect(() => {
        if (organization) {
            setFormData({
                name: organization.name,
                email: organization.email || '',
                mission: organization.mission || '',
            });
        }
    }, [organization]);

    const toggleMutation = useMutation({
        mutationFn: () => toggleOrganizationStatus(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
            toast.success('Organization status updated');
        },
        onError: () => toast.error('Failed to update status'),
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteOrganization(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
            toast.success('Organization deleted');
            navigate('/admin');
        },
        onError: () => toast.error('Failed to delete organization'),
    });

    const updateMutation = useMutation({
        mutationFn: (data: { name?: string; email?: string; mission?: string }) =>
            updateOrganization(id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
            setIsEditing(false);
            toast.success('Organization updated');
        },
        onError: () => toast.error('Failed to update organization'),
    });

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete ${organization?.name}? This action cannot be undone.`)) {
            deleteMutation.mutate();
        }
    };

    if (organizationsQuery.isLoading) {
        return (
            <div className="org-profile-page">
                <div className="org-profile-loading">Loading organization...</div>
            </div>
        );
    }

    if (!organization) {
        return (
            <div className="org-profile-page">
                <div className="org-profile-error">
                    <h2>Organization Not Found</h2>
                    <p>The requested organization could not be found.</p>
                    <button onClick={() => navigate('/admin')} className="back-button">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="org-profile-page">
            <div className="org-profile-container">
                {/* Header */}
                <div className="org-profile-header">
                    <button onClick={() => navigate('/admin')} className="back-button">
                        ← Back to Dashboard
                    </button>
                    <div className="org-profile-header-content">
                        <div className="org-profile-avatar">
                            {organization.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="org-profile-title">
                            <h1>{organization.name}</h1>
                            <span className={`status-badge ${organization.isActive ? 'active' : 'inactive'}`}>
                                {organization.isActive ? '● Active' : '○ Inactive'}
                            </span>
                        </div>
                    </div>
                    <div className="org-profile-actions">
                        {!isEditing ? (
                            <>
                                <button onClick={() => setIsEditing(true)} className="edit-button">
                                    ✏️ Edit
                                </button>
                                <button
                                    onClick={() => toggleMutation.mutate()}
                                    className={`toggle-button ${organization.isActive ? 'deactivate' : 'activate'}`}
                                    disabled={toggleMutation.isPending}
                                >
                                    {organization.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                                <button onClick={handleDelete} className="delete-button" disabled={deleteMutation.isPending}>
                                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                                </button>
                            </>
                        ) : (
                            <div className="edit-mode-indicator">
                                <span>✏️ Editing Mode</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Details Section */}
                <div className="org-profile-content">
                    <div className="org-profile-section">
                        <h2>Organization Details</h2>
                        <div className="detail-card">
                            <div className="detail-item">
                                <label>Organization Name</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="edit-input"
                                    />
                                ) : (
                                    <p>{organization.name}</p>
                                )}
                            </div>

                            <div className="detail-item">
                                <label>Email</label>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="edit-input"
                                    />
                                ) : (
                                    <p>{organization.email || 'Not provided'}</p>
                                )}
                            </div>

                            <div className="detail-item">
                                <label>Mission Statement</label>
                                {isEditing ? (
                                    <textarea
                                        value={formData.mission}
                                        onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                                        className="edit-textarea"
                                        rows={3}
                                    />
                                ) : (
                                    <p>{organization.mission || 'No mission statement provided'}</p>
                                )}
                            </div>

                            <div className="detail-item">
                                <label>Created</label>
                                <p>{new Date(organization.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</p>
                            </div>

                            {isEditing && (
                                <div className="form-actions">
                                    <button
                                        onClick={() => {
                                            updateMutation.mutate({
                                                name: formData.name,
                                                email: formData.email || undefined,
                                                mission: formData.mission || undefined,
                                            });
                                        }}
                                        className="save-button"
                                        disabled={updateMutation.isPending}
                                    >
                                        {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button onClick={() => {
                                        setIsEditing(false);
                                        setFormData({
                                            name: organization.name,
                                            email: organization.email || '',
                                            mission: organization.mission || '',
                                        });
                                    }} className="cancel-button">
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="org-profile-section">
                        <h2>Organization Stats</h2>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-value">--</div>
                                <div className="stat-label">Total Personas</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">--</div>
                                <div className="stat-label">Active Tasks</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">--</div>
                                <div className="stat-label">Completed Tasks</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">--</div>
                                <div className="stat-label">Success Rate</div>
                            </div>
                        </div>
                        <p className="coming-soon">📊 Detailed analytics coming soon...</p>
                    </div>

                    {/* Personas Section */}
                    <div className="org-profile-section">
                        <h2>Organization Personas</h2>
                        <div className="personas-placeholder">
                            <p className="coming-soon">👥 Persona management coming soon...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

import './persona-actions.css';
