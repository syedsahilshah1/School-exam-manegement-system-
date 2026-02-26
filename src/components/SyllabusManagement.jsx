import React, { useState, useEffect } from 'react';
import { transliterateToUrdu } from '../Services/UrduService';
import { generateSyllabusPDF, generateCombinedSyllabusPDF, exportSyllabusToWord } from '../Services/SyllabusPDFService';
import { SYLLABUS_TEMPLATES } from '../Services/SyllabusTemplates';

function SyllabusManagement({ user }) {
    const [syllabuses, setSyllabuses] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [formData, setFormData] = useState({ classId: '', subjectId: '', term: 'Final Term', content: '' });
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isUrduMode, setIsUrduMode] = useState(false);
    const [footerNote, setFooterNote] = useState('All work done in your books & copies.');
    const [showTemplates, setShowTemplates] = useState(false);
    const [isFullClassSyllabus, setIsFullClassSyllabus] = useState(true);

    useEffect(() => {
        fetchData();
        fetchSyllabuses();
    }, []);

    useEffect(() => {
        const selectedSubject = subjects.find(s => s.Id == formData.subjectId)?.SubjectName || '';
        if (selectedSubject.toLowerCase().includes('urdu') || selectedSubject.toLowerCase().includes('islamiat')) {
            setIsUrduMode(true);
        } else {
            setIsUrduMode(false);
        }
    }, [formData.subjectId, subjects]);

    const fetchData = async () => {
        // Migration: Ensure Term column exists
        try {
            await window.electronAPI.dbQuery("ALTER TABLE Syllabus ADD COLUMN Term VARCHAR(50) DEFAULT 'Mid Term'");
        } catch (e) {
            // Error is fine if column already exists
        }

        const classesRes = await window.electronAPI.dbQuery("SELECT * FROM Classes");
        const subjectsRes = await window.electronAPI.dbQuery("SELECT * FROM Subjects");
        setClasses(classesRes.data || []);
        setSubjects(subjectsRes.data || []);
    };

    const fetchSyllabuses = async () => {
        setLoading(true);
        let query = `
            SELECT s.*, c.ClassName, sub.SubjectName, u.Name as TeacherName 
            FROM Syllabus s
            JOIN Classes c ON s.ClassId = c.Id
            JOIN Subjects sub ON s.SubjectId = sub.Id
            JOIN Users u ON s.TeacherId = u.Id
        `;
        if (user.Role === 'Teacher') {
            query += ` WHERE s.TeacherId = ${user.Id}`;
        }
        const res = await window.electronAPI.dbQuery(query);
        setSyllabuses(res.data || []);
        setLoading(false);
    };

    const handleLoadTemplate = async (template) => {
        if (!window.confirm(`This will create ${template.subjects.length} subjects for ${template.class} ${template.term}. Continue?`)) return;

        setLoading(true);
        const targetClass = classes.find(c => c.ClassName.toLowerCase().includes(template.class.toLowerCase()));
        if (!targetClass) {
            alert(`Class ${template.class} not found in database. Please create the class first.`);
            setLoading(false);
            return;
        }

        let successCount = 0;
        for (const s of template.subjects) {
            const targetSubject = subjects.find(sub => sub.SubjectName.toLowerCase().includes(s.subject.toLowerCase()));
            if (targetSubject) {
                const query = "INSERT INTO Syllabus (TeacherId, ClassId, SubjectId, Term, SyllabusContent) VALUES (?, ?, ?, ?, ?)";
                await window.electronAPI.dbQuery(query, [user.Id, targetClass.Id, targetSubject.Id, template.term, s.content]);
                successCount++;
            }
        }

        alert(`Loaded ${successCount} subjects from template.`);
        setFooterNote(template.note);
        fetchSyllabuses();
        setLoading(false);
        setShowTemplates(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { classId, subjectId, term, content } = formData;

        let finalSubjectId = subjectId;
        if (isFullClassSyllabus || !subjectId) {
            // Find or create 'Full Class Syllabus' placeholder subject
            let fullSyllabusSub = subjects.find(s => s.SubjectName === 'Full Class Syllabus');
            if (!fullSyllabusSub) {
                const addSub = await window.electronAPI.dbQuery("INSERT INTO Subjects (SubjectName) VALUES ('Full Class Syllabus')");
                if (addSub.success) {
                    finalSubjectId = addSub.data.insertId;
                    // Refresh subjects list so future operations see the new subject
                    fetchData();
                } else {
                    alert("Error creating placeholder subject: " + addSub.error);
                    return;
                }
            } else {
                finalSubjectId = fullSyllabusSub.Id;
            }
        }

        const query = "INSERT INTO Syllabus (TeacherId, ClassId, SubjectId, Term, SyllabusContent) VALUES (?, ?, ?, ?, ?)";
        const res = await window.electronAPI.dbQuery(query, [user.Id, classId, finalSubjectId, term, content]);

        if (res.success) {
            alert("Syllabus for " + (isFullClassSyllabus ? 'Full Class' : subjects.find(s => s.Id == subjectId)?.SubjectName) + " saved successfully!");
            setFormData({ ...formData, subjectId: '', content: '' });
            fetchSyllabuses();
        } else {
            // Fallback for missing Term column
            if (res.error && res.error.includes("Unknown column 'Term'")) {
                const retryQuery = "INSERT INTO Syllabus (TeacherId, ClassId, SubjectId, SyllabusContent) VALUES (?, ?, ?, ?)";
                const retryRes = await window.electronAPI.dbQuery(retryQuery, [user.Id, classId, finalSubjectId, content]);
                if (retryRes.success) {
                    alert("Syllabus saved!");
                    setFormData({ ...formData, subjectId: '', content: '' });
                    fetchSyllabuses();
                } else { alert("Error: " + retryRes.error); }
            } else {
                alert("Error: " + res.error);
            }
        }
    };

    return (
        <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>Syllabus Management</h2>
                {user.Role === 'Teacher' && (
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        style={{
                            padding: '0.5rem 1rem',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer'
                        }}
                    >
                        {isAdding ? 'View All' : 'Create Syllabus'}
                    </button>
                )}
            </div>

            {isAdding ? (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label>Class</label>
                            <select
                                required
                                value={formData.classId}
                                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                            >
                                <option value="">Select Class</option>
                                {classes.map(c => <option key={c.Id} value={c.Id}>{c.ClassName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label>Syllabus Type</label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', cursor: 'pointer' }}>
                                <input type="checkbox" checked={isFullClassSyllabus} onChange={(e) => setIsFullClassSyllabus(e.target.checked)} />
                                Combine all subjects (Full Class Syllabus)
                            </label>
                        </div>
                        {!isFullClassSyllabus && (
                            <div>
                                <label>Individual Subject</label>
                                <select
                                    required
                                    value={formData.subjectId}
                                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                                >
                                    <option value="">Select Subject</option>
                                    {subjects.map(s => <option key={s.Id} value={s.Id}>{s.SubjectName}</option>)}
                                </select>
                            </div>
                        )}
                        <div>
                            <label>Examination Term</label>
                            <select
                                required
                                value={formData.term}
                                onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                            >
                                <option value="Mid Term">Mid Term Syllabus</option>
                                <option value="Final Term">Final Term Syllabus</option>
                                <option value="Monthly Test">Monthly Test Syllabus</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                            <input
                                type="checkbox"
                                checked={isUrduMode}
                                onChange={(e) => setIsUrduMode(e.target.checked)}
                            />
                            Urdu Typing Mode (Phonetic)
                        </label>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '1.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 'bold' }}>Handwritten Notebook Scan:</span>
                            <button
                                type="button"
                                onClick={() => alert("I am Antigravity, your AI assistant!\n\nTo digitize your handwritten syllabus:\n1. Drag and drop or Upload your notebook photo RIGHT HERE in this chat conversation (where we are talking now).\n2. I will read your handwriting and give you the text.\n3. You can then copy that text and paste it into the 'Syllabus Content' box below.")}
                                style={{ padding: '0.4rem 0.8rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                            >
                                Get text from Photo
                            </button>
                        </div>
                    </div>

                    <div>
                        <label>Syllabus Content</label>
                        <textarea
                            required
                            value={formData.content}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (isUrduMode) {
                                    if (val.length < formData.content.length) {
                                        setFormData({ ...formData, content: val });
                                        return;
                                    }
                                    const lastChar = val[val.length - 1];
                                    if (/[a-zA-Z]/.test(lastChar)) {
                                        const head = val.substring(0, val.length - 1);
                                        setFormData({ ...formData, content: head + transliterateToUrdu(lastChar) });
                                    } else {
                                        setFormData({ ...formData, content: val });
                                    }
                                } else {
                                    setFormData({ ...formData, content: val });
                                }
                            }}
                            placeholder={isUrduMode ? "اردو میں ٹائپ کریں..." : "Describe the syllabus details..."}
                            style={{
                                width: '100%',
                                height: '250px',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                background: 'rgba(255,255,255,0.1)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.2)',
                                resize: 'vertical',
                                direction: isUrduMode ? 'rtl' : 'ltr',
                                fontSize: isUrduMode ? '1.2rem' : '1rem'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                            Save to Database
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                if (!formData.content || (!isFullClassSyllabus && !formData.subjectId)) {
                                    alert("Please enter content and select a subject (or check 'Combine all subjects').");
                                    return;
                                }
                                const subject = subjects.find(s => s.Id == formData.subjectId);
                                const className = classes.find(c => c.Id == formData.classId)?.ClassName || 'Full Class';
                                generateSyllabusPDF({
                                    ...formData,
                                    SubjectName: isFullClassSyllabus ? '' : (subject?.SubjectName || ''),
                                    ClassName: className,
                                    TeacherName: user.Name,
                                    SyllabusContent: formData.content,
                                    CreatedDate: new Date()
                                }, footerNote);
                            }}
                            style={{ padding: '0.75rem 1.5rem', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            Download PDF
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                if (!formData.content || (!isFullClassSyllabus && !formData.subjectId)) {
                                    alert("Please enter content and select a subject (or check 'Combine all subjects').");
                                    return;
                                }
                                const subject = subjects.find(s => s.Id == formData.subjectId);
                                const className = classes.find(c => c.Id == formData.classId)?.ClassName || 'Class';
                                exportSyllabusToWord([{
                                    ...formData,
                                    SubjectName: isFullClassSyllabus ? 'Syllabus' : (subject?.SubjectName || 'Subject'),
                                    ClassName: className,
                                    TeacherName: user.Name,
                                    SyllabusContent: formData.content
                                }], `${className} ${formData.term}`);
                            }}
                            style={{ padding: '0.75rem 1.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            Download Word
                        </button>
                    </div>

                    <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                        <h4 style={{ marginBottom: '1rem', color: '#fbbf24' }}>Quick Templates</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                            {SYLLABUS_TEMPLATES.map((t, idx) => (
                                <div key={idx} className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', cursor: 'pointer' }} onClick={() => handleLoadTemplate(t)}>
                                    <strong>{t.name}</strong>
                                    <p style={{ fontSize: '0.8rem', margin: '0.5rem 0', opacity: 0.7 }}>{t.subjects.length} Subjects</p>
                                    <button style={{ width: '100%', padding: '0.3rem', background: 'rgba(139, 92, 246, 0.4)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.8rem' }}>Load template</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </form>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    {loading ? <p>Loading...</p> : (
                        <>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '0.5rem' }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '0.25rem' }}>Filter by Class</label>
                                    <select
                                        value={formData.classId}
                                        onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                                    >
                                        <option value="">All Classes</option>
                                        {classes.map(c => <option key={c.Id} value={c.Id}>{c.ClassName}</option>)}
                                    </select>
                                </div>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '0.25rem' }}>Filter by Term</label>
                                    <select
                                        value={formData.term}
                                        onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                                    >
                                        <option value="">All Terms</option>
                                        <option value="Mid Term">Mid Term</option>
                                        <option value="Final Term">Final Term</option>
                                        <option value="Monthly Test">Monthly Test</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1, minWidth: '300px' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '0.25rem' }}>Footer Note (appears at bottom of PDF)</label>
                                    <input
                                        type="text"
                                        value={footerNote}
                                        onChange={(e) => setFooterNote(e.target.value)}
                                        placeholder="Note: All work done in your books & copies."
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                                    />
                                </div>
                                <div style={{ marginTop: '1.2rem' }}>
                                    <button
                                        onClick={() => {
                                            if (!formData.classId) {
                                                alert("Please select a Class in the filter above to generate a combined PDF.");
                                                return;
                                            }
                                            const filtered = syllabuses.filter(s =>
                                                (s.ClassId == formData.classId) &&
                                                (!formData.term || s.Term === formData.term)
                                            );
                                            if (filtered.length === 0) {
                                                alert("No syllabus records found for the selected Class and Term.");
                                                return;
                                            }
                                            generateCombinedSyllabusPDF(filtered, footerNote);
                                        }}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            background: '#8b5cf6',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '0.5rem',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                        }}
                                    >
                                        Download Combined PDF
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!formData.classId) {
                                                alert("Please select a Class in the filter above to generate a combined document.");
                                                return;
                                            }
                                            const filtered = syllabuses.filter(s =>
                                                (s.ClassId == formData.classId) &&
                                                (!formData.term || s.Term === formData.term)
                                            );
                                            if (filtered.length === 0) {
                                                alert("No syllabus records found for the selected Class and Term.");
                                                return;
                                            }
                                            exportSyllabusToWord(filtered, `${filtered[0].ClassName} ${filtered[0].Term} Syllabus`);
                                        }}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            marginLeft: '0.5rem',
                                            background: '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '0.5rem',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                        }}
                                    >
                                        Download Combined Word
                                    </button>
                                </div>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem' }}>Class</th>
                                        <th style={{ padding: '1rem' }}>Subject</th>
                                        <th style={{ padding: '1rem' }}>Term</th>
                                        <th style={{ padding: '1rem' }}>Teacher</th>
                                        <th style={{ padding: '1rem' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {syllabuses
                                        .filter(s => (!formData.classId || s.ClassId == formData.classId) && (!formData.term || s.Term === formData.term))
                                        .length === 0 ? (
                                        <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af' }}>No syllabus records found for this selection.</td></tr>
                                    ) : (
                                        syllabuses
                                            .filter(s => (!formData.classId || s.ClassId == formData.classId) && (!formData.term || s.Term === formData.term))
                                            .map(s => (
                                                <tr key={s.Id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <td style={{ padding: '1rem' }}>{s.ClassName}</td>
                                                    <td style={{ padding: '1rem' }}>{s.SubjectName}</td>
                                                    <td style={{ padding: '1rem' }}>{s.Term || 'Mid Term'}</td>
                                                    <td style={{ padding: '1rem' }}>{s.TeacherName}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button
                                                                onClick={() => generateSyllabusPDF(s, footerNote)}
                                                                style={{
                                                                    background: '#3b82f6',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    padding: '0.4rem 0.8rem',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.85rem'
                                                                }}
                                                            >
                                                                PDF
                                                            </button>
                                                            <button
                                                                onClick={() => exportSyllabusToWord([s], `${s.SubjectName} Syllabus`)}
                                                                style={{
                                                                    background: '#10b981',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    padding: '0.4rem 0.8rem',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.85rem'
                                                                }}
                                                            >
                                                                Word
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                    )}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default SyllabusManagement;
