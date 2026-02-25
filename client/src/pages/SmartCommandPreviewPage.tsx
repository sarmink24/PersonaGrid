import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { confirmSmartCommand } from '../api/smartCommands';
import type { Platform } from '../types';
import './SmartCommandPreviewPage.css';

interface MultiPlatformPreview {
    originalPrompt: string;
    platforms: Platform[];
    taskType: string;
    scheduledFor?: string;
    previews: Array<{
        personaId: string;
        displayName: string;
        personalityTraits: string[];
        generatedContent: string;
        platform: Platform;
    }>;
}

export const SmartCommandPreviewPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const previewData = location.state as MultiPlatformPreview;

    if (!previewData) {
        navigate('/dashboard');
        return null;
    }

    const [edits, setEdits] = useState<Record<string, string>>({});
    const [filterPlatform, setFilterPlatform] = useState<Platform | 'all'>('all');

    const confirmMutation = useMutation({
        mutationFn: async () => {
            // Group previews by platform and send separate confirm calls
            const byPlatform = new Map<Platform, { personaId: string; content: string }[]>();
            for (const p of previewData.previews) {
                const key = `${p.personaId}-${p.platform}`;
                const content = edits[key] ?? p.generatedContent;
                if (!byPlatform.has(p.platform)) {
                    byPlatform.set(p.platform, []);
                }
                byPlatform.get(p.platform)!.push({ personaId: p.personaId, content });
            }

            await Promise.all(
                Array.from(byPlatform.entries()).map(([platform, confirmations]) =>
                    confirmSmartCommand({
                        platform,
                        taskType: previewData.taskType as any,
                        scheduledFor: previewData.scheduledFor,
                        confirmations,
                    })
                )
            );
        },
        onSuccess: () => {
            navigate('/dashboard', { state: { success: true } });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to schedule tasks');
        }
    });

    const handleContentChange = (personaId: string, platform: Platform, content: string) => {
        setEdits(prev => ({
            ...prev,
            [`${personaId}-${platform}`]: content
        }));
    };

    const filteredPreviews = filterPlatform === 'all'
        ? previewData.previews
        : previewData.previews.filter(p => p.platform === filterPlatform);

    const platformIcons: Record<Platform, string> = {
        twitter: 'X',
        instagram: 'IG',
        facebook: 'FB',
        linkedin: 'LI',
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
                    {previewData.platforms.map(p => (
                        <span key={p} className="badge">{p}</span>
                    ))}
                    <span className="badge">{previewData.taskType}</span>
                    {previewData.scheduledFor && (
                        <span className="badge time">
                            Scheduled: {new Date(previewData.scheduledFor).toLocaleString()}
                        </span>
                    )}
                </div>
            </div>

            {previewData.platforms.length > 1 && (
                <div className="platform-filter">
                    <button
                        className={`filter-btn ${filterPlatform === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterPlatform('all')}
                    >
                        All ({previewData.previews.length})
                    </button>
                    {previewData.platforms.map(p => {
                        const count = previewData.previews.filter(pr => pr.platform === p).length;
                        return (
                            <button
                                key={p}
                                className={`filter-btn ${filterPlatform === p ? 'active' : ''}`}
                                onClick={() => setFilterPlatform(p)}
                            >
                                {p} ({count})
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="previews-grid">
                {filteredPreviews.map(persona => {
                    const editKey = `${persona.personaId}-${persona.platform}`;
                    return (
                        <div key={editKey} className="preview-card">
                            <div className="persona-info">
                                <div className="persona-name-row">
                                    <h3>{persona.displayName}</h3>
                                    <span className={`platform-tag ${persona.platform}`}>
                                        {platformIcons[persona.platform]}
                                    </span>
                                </div>
                                <button
                                    className="view-profile-btn"
                                    onClick={() => navigate(`/personas/${persona.personaId}`)}
                                >
                                    View Profile
                                </button>
                            </div>

                            <div className="content-editor">
                                <textarea
                                    value={edits[editKey] ?? persona.generatedContent}
                                    onChange={(e) => handleContentChange(persona.personaId, persona.platform, e.target.value)}
                                    rows={6}
                                />
                            </div>
                        </div>
                    );
                })}
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
                    {confirmMutation.isPending ? 'Scheduling...' : `Approve & Schedule ${previewData.previews.length} Tasks`}
                </button>
            </div>
        </div>
    );
};
