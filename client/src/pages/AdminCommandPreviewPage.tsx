import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { confirmAdminCommand, type AdminCommandPreview } from '../api/admin';
import './AdminCommandPreviewPage.css';

export const AdminCommandPreviewPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const previewData = location.state as AdminCommandPreview;

    // If no state, redirect back to admin dashboard
    if (!previewData) {
        navigate('/admin/dashboard');
        return null;
    }

    const [edits, setEdits] = useState<Record<string, string>>({});

    const confirmMutation = useMutation({
        mutationFn: () => confirmAdminCommand({
            platform: previewData.platform,
            taskType: previewData.taskType,
            scheduledFor: previewData.scheduledFor,
            confirmations: previewData.previews.map(p => ({
                personaId: p.personaId,
                content: edits[p.personaId] ?? p.generatedContent
            }))
        }),
        onSuccess: () => {
            toast.success('Tasks created successfully for all global personas!');
            navigate('/admin/dashboard');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to create tasks');
        }
    });

    const handleContentChange = (personaId: string, content: string) => {
        setEdits(prev => ({
            ...prev,
            [personaId]: content
        }));
    };

    return (
        <div className="admin-preview-page">
            <header className="preview-header">
                <button onClick={() => navigate('/admin/dashboard')} className="back-button">
                    ← Back to Dashboard
                </button>
                <h1>🤖 AI Command Preview</h1>
                <p>Review and edit AI-generated content before creating tasks for global personas</p>
            </header>

            <div className="command-summary">
                <div className="summary-card">
                    <h3>📝 Original Command</h3>
                    <p className="command-text">"{previewData.originalCommand}"</p>
                </div>

                <div className="summary-card">
                    <h3>🎯 Analyzed Intent</h3>
                    <p className="intent-text">{previewData.analyzedIntent}</p>
                </div>

                <div className="meta-info">
                    <span className="badge platform">{previewData.platform}</span>
                    <span className="badge task-type">{previewData.taskType}</span>
                    {previewData.scheduledFor && (
                        <span className="badge scheduled">
                            📅 {new Date(previewData.scheduledFor).toLocaleString()}
                        </span>
                    )}
                    <span className="badge count">
                        {previewData.previews.length} Global Personas
                    </span>
                </div>
            </div>

            <div className="previews-section">
                <h2>Generated Content for Global Personas</h2>
                <p className="section-subtitle">Edit any content below before confirming</p>

                <div className="previews-grid">
                    {previewData.previews.map(persona => (
                        <div key={persona.personaId} className="preview-card">
                            <div className="persona-info">
                                <h3>{persona.displayName}</h3>
                                <div className="global-badge">Global</div>
                            </div>

                            <div className="traits">
                                {persona.personalityTraits.map(t => (
                                    <span key={t} className="trait-tag">{t}</span>
                                ))}
                            </div>

                            <div className="content-editor">
                                <label>Generated Content:</label>
                                <textarea
                                    value={edits[persona.personaId] ?? persona.generatedContent}
                                    onChange={(e) => handleContentChange(persona.personaId, e.target.value)}
                                    rows={6}
                                />
                                <div className="char-count">
                                    {(edits[persona.personaId] ?? persona.generatedContent).length} characters
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="actions-bar">
                <button
                    className="cancel-button"
                    onClick={() => navigate('/admin/dashboard')}
                    disabled={confirmMutation.isPending}
                >
                    Cancel
                </button>
                <button
                    className="confirm-button"
                    onClick={() => confirmMutation.mutate()}
                    disabled={confirmMutation.isPending}
                >
                    {confirmMutation.isPending ? '⏳ Creating Tasks...' : '✅ Confirm & Create Tasks'}
                </button>
            </div>
        </div>
    );
};
