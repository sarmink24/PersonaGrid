import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import {
    fetchPersonas,
    updatePersona,
    togglePersonaStatus,
    deletePersona,
    type PersonaPayload
} from '../api/organizations';
import {
    fetchGlobalPersonas,
    updateGlobalPersona,
    togglePersonaStatus as toggleGlobalPersonaStatus,
    deleteGlobalPersona,
    type GlobalPersonaPayload
} from '../api/admin';
import type { Persona } from '../types';
import type { GlobalPersona } from '../api/admin';
import './PersonaProfilePage.css';

interface PersonaProfilePageProps {
    isAdmin?: boolean;
}

export const PersonaProfilePage = ({ isAdmin = false }: PersonaProfilePageProps) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { organization } = useAuth();
    const { admin } = useAdmin();

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        displayName: '',
        bio: '',
        traits: '',
    });

    // Fetch personas based on admin or org context
    const personasQuery = useQuery({
        queryKey: isAdmin ? ['global-personas'] : ['personas'],
        queryFn: isAdmin ? fetchGlobalPersonas : fetchPersonas,
        enabled: isAdmin ? !!admin : !!organization,
    });

    const persona = personasQuery.data?.find((p: any) => p.id === id);

    useEffect(() => {
        if (persona) {
            setFormData({
                displayName: persona.displayName,
                bio: persona.bio || '',
                traits: persona.personalityTraits.join(', '),
            });
        }
    }, [persona]);

    const updateMutation = useMutation({
        mutationFn: (payload: Partial<PersonaPayload> | Partial<GlobalPersonaPayload>) =>
            isAdmin ? updateGlobalPersona(id!, payload) : updatePersona(id!, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: isAdmin ? ['global-personas'] : ['personas'] });
            setIsEditing(false);
            toast.success('Profile updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to update profile');
        },
    });

    const toggleMutation = useMutation({
        mutationFn: () =>
            isAdmin ? toggleGlobalPersonaStatus(id!) : togglePersonaStatus(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: isAdmin ? ['global-personas'] : ['personas'] });
            toast.success('Status updated');
        },
        onError: () => toast.error('Failed to update status'),
    });

    const deleteMutation = useMutation({
        mutationFn: () =>
            isAdmin ? deleteGlobalPersona(id!) : deletePersona(id!),
        onSuccess: () => {
            toast.success('User deleted');
            navigate(isAdmin ? '/admin' : '/dashboard');
        },
        onError: () => toast.error('Failed to delete user'),
    });

    const handleSave = () => {
        const payload = {
            displayName: formData.displayName.trim(),
            bio: formData.bio || undefined,
            personalityTraits: formData.traits
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
        };

        if (payload.personalityTraits.length < 3) {
            toast.error('Please add at least 3 personality traits');
            return;
        }

        updateMutation.mutate(payload);
    };

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete ${persona?.displayName}? This action cannot be undone.`)) {
            deleteMutation.mutate();
        }
    };

    if (personasQuery.isLoading) {
        return (
            <div className="profile-page">
                <div className="profile-loading">Loading profile...</div>
            </div>
        );
    }

    if (!persona) {
        return (
            <div className="profile-page">
                <div className="profile-error">
                    <h2>User Not Found</h2>
                    <p>The requested user profile could not be found.</p>
                    <button onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')} className="back-button">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="profile-container">
                {/* Header */}
                <div className="profile-header">
                    <button onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')} className="back-button">
                        ← Back
                    </button>
                    <div className="profile-header-content">
                        <div className="profile-avatar">
                            {persona.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="profile-title">
                            <h1>{persona.displayName}</h1>
                            <span className={`status-badge ${persona.isActive ? 'active' : 'inactive'}`}>
                                {persona.isActive ? '● Active' : '○ Inactive'}
                            </span>
                            {isAdmin && <span className="global-badge">Global User</span>}
                        </div>
                    </div>
                    <div className="profile-actions">
                        {!isEditing ? (
                            <>
                                <button onClick={() => setIsEditing(true)} className="edit-button">
                                    ✏️ Edit
                                </button>
                                <button
                                    onClick={() => toggleMutation.mutate()}
                                    className={`toggle-button ${persona.isActive ? 'deactivate' : 'activate'}`}
                                    disabled={toggleMutation.isPending}
                                >
                                    {persona.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                                <button onClick={handleDelete} className="delete-button" disabled={deleteMutation.isPending}>
                                    🗑️ Delete
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
                <div className="profile-content">
                    <div className="profile-section">
                        <h2>Profile Details</h2>
                        <div className="detail-card">
                            <div className="detail-item">
                                <label>Display Name</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.displayName}
                                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                        className="edit-input"
                                    />
                                ) : (
                                    <p>{persona.displayName}</p>
                                )}
                            </div>

                            <div className="detail-item">
                                <label>Bio</label>
                                {isEditing ? (
                                    <textarea
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        className="edit-textarea"
                                        rows={3}
                                    />
                                ) : (
                                    <p>{persona.bio || 'No bio provided'}</p>
                                )}
                            </div>

                            <div className="detail-item">
                                <label>Personality Traits</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.traits}
                                        onChange={(e) => setFormData({ ...formData, traits: e.target.value })}
                                        className="edit-input"
                                        placeholder="Comma separated traits"
                                    />
                                ) : (
                                    <div className="traits-display">
                                        {persona.personalityTraits.map((trait) => (
                                            <span key={trait} className="trait-badge">{trait}</span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="detail-item">
                                <label>Created</label>
                                <p>{new Date(persona.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</p>
                            </div>

                            {isEditing && (
                                <div className="form-actions">
                                    <button onClick={handleSave} className="save-button" disabled={updateMutation.isPending}>
                                        {updateMutation.isPending ? 'Saving...' : '✓ Save Changes'}
                                    </button>
                                    <button onClick={() => {
                                        setIsEditing(false);
                                        setFormData({
                                            displayName: persona.displayName,
                                            bio: persona.bio || '',
                                            traits: persona.personalityTraits.join(', '),
                                        });
                                    }} className="cancel-button">
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Placeholder sections for future features */}
                    <div className="profile-section">
                        <h2>Activity Stats</h2>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-value">--</div>
                                <div className="stat-label">Total Tasks</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">--</div>
                                <div className="stat-label">Completed</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">--</div>
                                <div className="stat-label">Success Rate</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">--</div>
                                <div className="stat-label">Engagement</div>
                            </div>
                        </div>
                        <p className="coming-soon">📊 Detailed analytics coming soon...</p>
                    </div>

                    <div className="profile-section">
                        <h2>Recent Activity</h2>
                        <div className="activity-placeholder">
                            <p className="coming-soon">📝 Activity timeline coming soon...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
