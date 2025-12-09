import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { confirmSmartCommand, type SmartCommandPreview } from '../api/smartCommands';
import './SmartCommandPreviewPage.css';

export const SmartCommandPreviewPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const previewData = location.state as SmartCommandPreview;

    // If no state, redirect back to dashboard
    if (!previewData) {
        navigate('/dashboard');
        return null;
    }

    const [edits, setEdits] = useState<Record<string, string>>({});

    const confirmMutation = useMutation({
        mutationFn: () => confirmSmartCommand({
            platform: previewData.platform,
            taskType: previewData.taskType,
            scheduledFor: previewData.scheduledFor,
            confirmations: previewData.previews.map(p => ({
                personaId: p.personaId,
                content: edits[p.personaId] ?? p.generatedContent
            }))
        }),
        onSuccess: () => {
            navigate('/dashboard', { state: { success: true } });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to schedule tasks');
        }
    });

    const handleContentChange = (personaId: string, content: string) => {
        setEdits(prev => ({
            ...prev,
            [personaId]: content
        }));
    };

    return (
        <div className="preview-page">
            <header className="preview-header">
                <button onClick={() => navigate('/dashboard')} className="back-button">
                    ← Back
                </button>
                <h1>Review Generated Content</h1>
                <p>Review and edit the content generated for each persona before scheduling.</p>
            </header>

            <div className="original-prompt">
                <span className="label">Original Prompt:</span>
                <p>"{previewData.originalPrompt}"</p>
                <div className="meta">
                    <span className="badge">{previewData.platform}</span>
                    <span className="badge">{previewData.taskType}</span>
                    {previewData.scheduledFor && (
                        <span className="badge time">
                            Scheduled: {new Date(previewData.scheduledFor).toLocaleString()}
                        </span>
                    )}
                </div>
            </div>

            <div className="previews-grid">
                {previewData.previews.map(persona => (
                    <div key={persona.personaId} className="preview-card">
                        <div className="persona-info">
                            <h3>{persona.displayName}</h3>
                            <button
                                className="view-profile-btn"
                                onClick={() => navigate(`/personas/${persona.personaId}`)}
                            >
                                👁️ View Profile
                            </button>
                        </div>

                        <div className="content-editor">
                            <textarea
                                value={edits[persona.personaId] ?? persona.generatedContent}
                                onChange={(e) => handleContentChange(persona.personaId, e.target.value)}
                                rows={6}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="actions-bar">
                <button
                    className="cancel-button"
                    onClick={() => navigate('/dashboard')}
                >
                    Cancel
                </button>
                <button
                    className="confirm-button"
                    onClick={() => confirmMutation.mutate()}
                    disabled={confirmMutation.isPending}
                >
                    {confirmMutation.isPending ? 'Scheduling...' : 'Approve & Schedule Tasks'}
                </button>
            </div>
        </div>
    );
};
