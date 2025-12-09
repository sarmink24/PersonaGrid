import { useState } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  fetchOrganizations,
  toggleOrganizationStatus,
  fetchGlobalPersonas,
  createGlobalPersona,
  deleteGlobalPersona,
  updateGlobalPersona,
  togglePersonaStatus,
  previewAdminCommand,
  type GlobalPersonaPayload,
  type AdminCommandPayload
} from '../api/admin';
import toast from 'react-hot-toast';
import './AdminDashboardPage.css';

export const AdminDashboardPage = () => {
  const { admin, logout } = useAdmin();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showPersonaForm, setShowPersonaForm] = useState(false);
  const [editingPersona, setEditingPersona] = useState<string | null>(null);
  const [personaForm, setPersonaForm] = useState({
    displayName: '',
    bio: '',
    traits: '',
  });
  const [commandForm, setCommandForm] = useState({
    command: '',
    platform: 'twitter' as 'twitter' | 'instagram' | 'facebook',
    taskType: 'post' as 'like' | 'share' | 'post' | 'comment' | 'follow',
  });

  const organizationsQuery = useQuery({
    queryKey: ['admin-organizations'],
    queryFn: fetchOrganizations,
  });

  const personasQuery = useQuery({
    queryKey: ['global-personas'],
    queryFn: fetchGlobalPersonas,
  });

  const toggleMutation = useMutation({
    mutationFn: toggleOrganizationStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      toast.success('Organization status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const createPersonaMutation = useMutation({
    mutationFn: (payload: GlobalPersonaPayload) => createGlobalPersona(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-personas'] });
      setPersonaForm({ displayName: '', bio: '', traits: '' });
      setShowPersonaForm(false);
      toast.success('Global user created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create user');
    }
  });

  const deletePersonaMutation = useMutation({
    mutationFn: deleteGlobalPersona,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-personas'] });
      toast.success('Global user deleted');
    },
    onError: () => toast.error('Failed to delete user'),
  });

  const updatePersonaMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<GlobalPersonaPayload> }) =>
      updateGlobalPersona(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-personas'] });
      setPersonaForm({ displayName: '', bio: '', traits: '' });
      setEditingPersona(null);
      toast.success('Global user updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update user');
    }
  });

  const togglePersonaMutation = useMutation({
    mutationFn: togglePersonaStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-personas'] });
      toast.success('User status updated');
    },
    onError: () => toast.error('Failed to toggle status'),
  });

  const commandPreviewMutation = useMutation({
    mutationFn: (payload: AdminCommandPayload) => previewAdminCommand(payload),
    onSuccess: (data) => {
      navigate('/admin/command/preview', { state: data });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to analyze command');
    }
  });

  const submitPersona = (e: React.FormEvent) => {
    e.preventDefault();
    if (personaForm.traits.split(',').length < 1) {
      toast.error('Please add at least one personality trait');
      return;
    }

    const payload = {
      displayName: personaForm.displayName.trim(),
      bio: personaForm.bio || undefined,
      personalityTraits: personaForm.traits
        .split(',')
        .map((trait) => trait.trim())
        .filter(Boolean),
    };

    if (editingPersona) {
      updatePersonaMutation.mutate({ id: editingPersona, payload });
    } else {
      createPersonaMutation.mutate(payload);
    }
  };

  const handleEditPersona = (persona: any) => {
    setEditingPersona(persona.id);
    setPersonaForm({
      displayName: persona.displayName,
      bio: persona.bio || '',
      traits: persona.personalityTraits.join(', '),
    });
    setShowPersonaForm(true);
  };

  const handleCancelEdit = () => {
    setEditingPersona(null);
    setPersonaForm({ displayName: '', bio: '', traits: '' });
    setShowPersonaForm(false);
  };

  const handleViewProfile = (personaId: string) => {
    navigate(`/admin/personas/${personaId}`);
  };

  const handleTogglePersona = (id: string) => {
    togglePersonaMutation.mutate(id);
  };

  const handleDeletePersona = (id: string) => {
    toast((t) => (
      <div className="confirm-toast-content">
        <p>Delete this global user?</p>
        <div className="confirm-actions">
          <button
            className="confirm-btn cancel"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
          <button
            className="confirm-btn confirm delete"
            onClick={() => {
              deletePersonaMutation.mutate(id);
              toast.dismiss(t.id);
            }}
          >
            Delete
          </button>
        </div>
      </div>
    ), {
      style: {
        background: '#1a1a2e',
        color: '#fff',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '16px',
      },
      duration: 5000,
    });
  };

  const handleToggle = (organizationId: string) => {
    toast((t) => (
      <div className="confirm-toast-content">
        <p>Toggle organization status?</p>
        <div className="confirm-actions">
          <button
            className="confirm-btn cancel"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
          <button
            className="confirm-btn confirm"
            onClick={() => {
              toggleMutation.mutate(organizationId);
              toast.dismiss(t.id);
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    ), {
      style: {
        background: '#1a1a2e',
        color: '#fff',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '16px',
      },
      duration: 5000,
    });
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Manage Organizations</p>
        </div>
        <div className="admin-header-actions">
          <span className="admin-email">{admin?.email}</span>
          <button onClick={logout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <main className="admin-dashboard-main">
        <div className="admin-stats">
          <div className="stat-card">
            <h3>Total Organizations</h3>
            <p className="stat-number">{organizationsQuery.data?.length || 0}</p>
          </div>
          <div className="stat-card active">
            <h3>Active</h3>
            <p className="stat-number">
              {organizationsQuery.data?.filter((org) => org.isActive).length || 0}
            </p>
          </div>
          <div className="stat-card inactive">
            <h3>Deactivated</h3>
            <p className="stat-number">
              {organizationsQuery.data?.filter((org) => !org.isActive).length || 0}
            </p>
          </div>
        </div>

        <div className="organizations-table-container">
          <h2>Organizations</h2>
          {organizationsQuery.isLoading && <p>Loading organizations...</p>}
          {organizationsQuery.data && (
            <table className="organizations-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mission</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizationsQuery.data.map((org) => (
                  <tr key={org.id} className={org.isActive ? '' : 'deactivated'}>
                    <td>{org.name}</td>
                    <td>{org.email || 'N/A'}</td>
                    <td>{org.mission || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${org.isActive ? 'active' : 'inactive'}`}>
                        {org.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td>{new Date(org.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          onClick={() => navigate(`/admin/organizations/${org.id}`)}
                          className="view-button-small"
                          title="View Profile"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => handleToggle(org.id)}
                          className={`toggle-button-small ${org.isActive ? 'deactivate' : 'activate'}`}
                          disabled={toggleMutation.isPending}
                          title={org.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {org.isActive ? '✓' : '○'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!organizationsQuery.data?.length && !organizationsQuery.isLoading && (
            <p className="empty-state">No organizations found</p>
          )}
        </div>

        <div className="admin-section">
          <div className="section-header">
            <h2>Global AI Users</h2>
            <button
              onClick={() => setShowPersonaForm(!showPersonaForm)}
              className="create-button"
            >
              {showPersonaForm ? 'Cancel' : '+ Create Global User'}
            </button>
          </div>

          {showPersonaForm && (
            <form onSubmit={submitPersona} className="persona-form">
              <input
                type="text"
                placeholder="User name"
                value={personaForm.displayName}
                onChange={(e) => setPersonaForm({ ...personaForm, displayName: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Personality traits (comma separated)"
                value={personaForm.traits}
                onChange={(e) => setPersonaForm({ ...personaForm, traits: e.target.value })}
                required
              />
              <textarea
                placeholder="Bio (optional)"
                value={personaForm.bio}
                onChange={(e) => setPersonaForm({ ...personaForm, bio: e.target.value })}
              />
              <button type="submit" disabled={createPersonaMutation.isPending || updatePersonaMutation.isPending}>
                {editingPersona
                  ? (updatePersonaMutation.isPending ? 'Updating...' : 'Update')
                  : (createPersonaMutation.isPending ? 'Creating...' : 'Create')}
              </button>
              {editingPersona && (
                <button type="button" onClick={handleCancelEdit} className="cancel-button">
                  Cancel
                </button>
              )}
            </form>
          )}

          <div className="personas-grid">
            {personasQuery.isLoading && <p>Loading global users...</p>}
            {personasQuery.data?.map((persona) => (
              <div key={persona.id} className={`persona-card global ${!persona.isActive ? 'inactive' : ''}`}>
                <div className="persona-header">
                  <h3>
                    {persona.displayName}
                    {!persona.isActive && <span className="inactive-badge">Inactive</span>}
                  </h3>
                  <div className="persona-actions">
                    <button
                      className="view-button"
                      onClick={() => handleViewProfile(persona.id)}
                      title="View Profile"
                    >
                      👁️ View
                    </button>
                    <button
                      className="edit-button"
                      onClick={() => handleEditPersona(persona)}
                      title="Edit"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDeletePersona(persona.id)}
                      disabled={deletePersonaMutation.isPending}
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <p>{persona.bio}</p>
                <div className="traits">
                  {persona.personalityTraits.map((trait) => (
                    <span key={trait}>{trait}</span>
                  ))}
                </div>
                <div className="global-badge">Global</div>
              </div>
            ))}
            {!personasQuery.data?.length && !personasQuery.isLoading && (
              <p className="empty-state">No global users yet. Create one to be used by all organizations!</p>
            )}
          </div>
        </div>

        <div className="admin-section">
          <div className="section-header">
            <h2>🤖 AI Command Center</h2>
            <p className="section-subtitle">Give natural language commands to automate tasks for all global personas</p>
          </div>

          <div className="command-center">
            <form onSubmit={(e) => {
              e.preventDefault();
              if (commandForm.command.length < 10) {
                toast.error('Command must be at least 10 characters');
                return;
              }
              commandPreviewMutation.mutate(commandForm);
            }} className="command-form">
              <div className="command-input-group">
                <textarea
                  placeholder="Enter your command (e.g., 'Create a Twitter post announcing our new eco-friendly product launch')"
                  value={commandForm.command}
                  onChange={(e) => setCommandForm({ ...commandForm, command: e.target.value })}
                  rows={4}
                  required
                  minLength={10}
                />
              </div>

              <div className="command-options">
                <div className="option-group">
                  <label>Platform</label>
                  <select
                    value={commandForm.platform}
                    onChange={(e) => setCommandForm({ ...commandForm, platform: e.target.value as any })}
                  >
                    <option value="twitter">Twitter</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                  </select>
                </div>

                <div className="option-group">
                  <label>Task Type</label>
                  <select
                    value={commandForm.taskType}
                    onChange={(e) => setCommandForm({ ...commandForm, taskType: e.target.value as any })}
                  >
                    <option value="post">Post</option>
                    <option value="like">Like</option>
                    <option value="share">Share</option>
                    <option value="comment">Comment</option>
                    <option value="follow">Follow</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="analyze-button"
                  disabled={commandPreviewMutation.isPending || !commandForm.command}
                >
                  {commandPreviewMutation.isPending ? '🔄 Analyzing...' : '✨ Analyze & Preview'}
                </button>
              </div>
            </form>

            <div className="command-help">
              <h4>💡 Example Commands:</h4>
              <ul>
                <li>"Post about our new sustainable product line on Twitter"</li>
                <li>"Share motivational fitness content on Instagram"</li>
                <li>"Create a Facebook post about environmental conservation"</li>
                <li>"Announce our tech innovation breakthrough on all platforms"</li>
              </ul>
            </div>
          </div>
        </div>
      </main >
    </div >
  );
};


import './persona-actions.css';
