import React, { useState, useEffect } from 'react';
import { generateExamPDF } from '../Services/PDFService';

function PaperManagement({ user }) {
    const [papers, setPapers] = useState([]);
    const [selectedPaperIds, setSelectedPaperIds] = useState([]);
    const [viewingPaper, setViewingPaper] = useState(null);
    const [loading, setLoading] = useState(true);
    const [printing, setPrinting] = useState(false);

    useEffect(() => {
        fetchPapers();
    }, []);

    const fetchPapers = async () => {
        setLoading(true);
        let query = '';
        let params = [];

        if (user.Role === 'SuperAdmin') {
            // Admin sees all papers that are submitted or approved/rejected
            query = `
                SELECT p.*, u.Name as TeacherName, c.ClassName, s.SubjectName 
                FROM Papers p
                JOIN Users u ON p.TeacherId = u.Id
                JOIN Classes c ON p.ClassId = c.Id
                JOIN Subjects s ON p.SubjectId = s.Id
                ORDER BY p.CreatedDate DESC
            `;
        } else {
            // Teacher only sees their own papers
            query = `
                SELECT p.*, c.ClassName, s.SubjectName 
                FROM Papers p
                JOIN Classes c ON p.ClassId = c.Id
                JOIN Subjects s ON p.SubjectId = s.Id
                WHERE p.TeacherId = ?
                ORDER BY p.CreatedDate DESC
            `;
            params = [user.Id];
        }

        const res = await window.electronAPI.dbQuery(query, params);
        if (res.success) {
            setPapers(res.data);
        } else {
            console.error('Error fetching papers:', res.error);
        }
        setLoading(false);
    };

    const handleStatusUpdate = async (paperId, newStatus) => {
        const res = await window.electronAPI.dbQuery(
            "UPDATE Papers SET Status = ? WHERE Id = ?",
            [newStatus, paperId]
        );
        if (res.success) {
            alert(`Paper ${newStatus} successfully!`);
            fetchPapers();
        } else {
            alert('Error updating status: ' + res.error);
        }
    };

    const handleViewPaper = async (paper) => {
        const res = await window.electronAPI.dbQuery("SELECT * FROM Questions WHERE PaperId = ?", [paper.Id]);
        if (res.success) {
            setViewingPaper({ ...paper, questions: res.data });
        } else {
            alert("Error loading questions: " + res.error);
        }
    };

    const toggleSelect = (id) => {
        setSelectedPaperIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkPrint = async () => {
        if (selectedPaperIds.length === 0) return alert("Please select at least one paper");

        setPrinting(true);
        for (const id of selectedPaperIds) {
            const paper = papers.find(p => p.Id === id);
            const res = await window.electronAPI.dbQuery("SELECT * FROM Questions WHERE PaperId = ?", [id]);
            if (res.success) {
                generateExamPDF({
                    type: paper.ExamType,
                    subject: paper.SubjectName,
                    class: paper.ClassName,
                    duration: paper.Duration,
                    mcqInstruction: paper.McqInstruction,
                    shortInstruction: paper.ShortInstruction,
                    longInstruction: paper.LongInstruction
                }, res.data);
            }
        }
        setPrinting(false);
        setSelectedPaperIds([]);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return '#10b981';
            case 'Rejected': return '#ef4444';
            case 'Submitted': return '#f59e0b';
            default: return '#9ca3af';
        }
    };

    if (loading) return <div className="glass-card">Loading papers...</div>;

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>{user.Role === 'SuperAdmin' ? 'Paper Approval Requests' : 'My Examination Papers'}</h2>
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>{selectedPaperIds.length} papers selected</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {selectedPaperIds.length > 0 && (
                        <button onClick={handleBulkPrint} disabled={printing} className="btn-primary" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                            {printing ? 'Generating PDFs...' : `Download Selected (${selectedPaperIds.length})`}
                        </button>
                    )}
                    <button onClick={fetchPapers} className="btn-primary" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>Refresh</button>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                            <th style={{ padding: '1rem', width: '40px' }}>
                                <input
                                    type="checkbox"
                                    onChange={(e) => setSelectedPaperIds(e.target.checked ? papers.map(p => p.Id) : [])}
                                    checked={selectedPaperIds.length === papers.length && papers.length > 0}
                                />
                            </th>
                            <th style={{ padding: '1rem' }}>Subject</th>
                            <th style={{ padding: '1rem' }}>Class</th>
                            {user.Role === 'SuperAdmin' && <th style={{ padding: '1rem' }}>Teacher</th>}
                            <th style={{ padding: '1rem' }}>Type</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {papers.length === 0 ? (
                            <tr>
                                <td colSpan={user.Role === 'SuperAdmin' ? 7 : 6} style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                                    No papers found.
                                </td>
                            </tr>
                        ) : (
                            papers.map(paper => (
                                <tr key={paper.Id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: selectedPaperIds.includes(paper.Id) ? 'rgba(26, 86, 219, 0.05)' : 'transparent' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedPaperIds.includes(paper.Id)}
                                            onChange={() => toggleSelect(paper.Id)}
                                        />
                                    </td>
                                    <td style={{ padding: '1rem' }}>{paper.SubjectName}</td>
                                    <td style={{ padding: '1rem' }}>{paper.ClassName}</td>
                                    {user.Role === 'SuperAdmin' && <td style={{ padding: '1rem' }}>{paper.TeacherName}</td>}
                                    <td style={{ padding: '1rem' }}>{paper.ExamType}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.6rem',
                                            borderRadius: '1rem',
                                            fontSize: '0.75rem',
                                            background: `${getStatusColor(paper.Status)}22`,
                                            color: getStatusColor(paper.Status),
                                            border: `1px solid ${getStatusColor(paper.Status)}44`
                                        }}>
                                            {paper.Status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="btn-primary"
                                                style={{ background: 'rgba(255,255,255,0.1)', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                                onClick={() => handleViewPaper(paper)}
                                            >
                                                View
                                            </button>
                                            {user.Role === 'SuperAdmin' && paper.Status === 'Submitted' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusUpdate(paper.Id, 'Approved')}
                                                        style={{ background: '#10b981', border: 'none', color: 'white', padding: '0.3rem 0.6rem', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.8rem' }}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(paper.Id, 'Rejected')}
                                                        style={{ background: '#ef4444', border: 'none', color: 'white', padding: '0.3rem 0.6rem', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.8rem' }}
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* View Paper Modal */}
            {viewingPaper && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '2rem' }}>
                    <div className="glass-card" style={{ width: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <div>
                                <h2>{viewingPaper.SubjectName} - Class {viewingPaper.ClassName}</h2>
                                <p style={{ color: '#9ca3af' }}>{viewingPaper.ExamType} Paper | Status: {viewingPaper.Status}</p>
                            </div>
                            <button onClick={() => setViewingPaper(null)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem' }}>
                            <p><strong>Duration:</strong> {viewingPaper.Duration}</p>
                            <p><strong>Total Marks:</strong> {viewingPaper.questions.reduce((sum, q) => sum + parseFloat(q.Marks), 0)}</p>
                            <p><strong>Teacher:</strong> {viewingPaper.TeacherName || 'Self'}</p>
                            <p><strong>Date:</strong> {new Date(viewingPaper.CreatedDate).toLocaleDateString()}</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {viewingPaper.questions.map((q, i) => (
                                <div key={i} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <strong>Question {i + 1}</strong>
                                        <span style={{ fontSize: '0.8rem', color: '#10b981' }}>{q.Marks} Marks</span>
                                    </div>
                                    <p style={{ whiteSpace: 'pre-wrap' }}>{q.QuestionText}</p>

                                    {q.QuestionType === 'MCQ' && q.OptionsJSON && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
                                            {JSON.parse(q.OptionsJSON).map((opt, idx) => (
                                                <div key={idx} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.25rem', fontSize: '0.9rem' }}>
                                                    <strong>{String.fromCharCode(97 + idx)})</strong> {opt}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '1rem' }}>Type: {q.QuestionType}</p>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button onClick={() => setViewingPaper(null)} className="btn-primary" style={{ background: 'rgba(255,255,255,0.1)' }}>Close</button>
                            <button
                                onClick={() => generateExamPDF({
                                    type: viewingPaper.ExamType,
                                    subject: viewingPaper.SubjectName,
                                    class: viewingPaper.ClassName,
                                    duration: viewingPaper.Duration,
                                    mcqInstruction: viewingPaper.McqInstruction,
                                    shortInstruction: viewingPaper.ShortInstruction,
                                    longInstruction: viewingPaper.LongInstruction
                                }, viewingPaper.questions)}
                                className="btn-primary"
                            >
                                Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PaperManagement;
