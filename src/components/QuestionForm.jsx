import React, { useState, useEffect } from 'react';
import { generateExamPDF } from '../Services/PDFService';
import { transliterateToUrdu, urduKeyboardLayout } from '../Services/UrduService';

function QuestionForm({ user, onBack }) {
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [paperDetails, setPaperDetails] = useState({
        title: '',
        classId: '',
        subjectId: '',
        type: 'Mid Term',
        duration: '3 Hours',
        mcqInstruction: 'Attempt all questions.',
        shortInstruction: 'Attempt any 5 questions.',
        longInstruction: 'Attempt any 3 questions.'
    });

    const [isUrduMode, setIsUrduMode] = useState(false);
    const [showKeyboard, setShowKeyboard] = useState(false);

    useEffect(() => {
        const selectedSubject = subjects.find(s => s.Id == paperDetails.subjectId)?.SubjectName || '';
        if (selectedSubject.toLowerCase().includes('urdu') || selectedSubject.toLowerCase().includes('islamiat')) {
            setIsUrduMode(true);
        } else {
            setIsUrduMode(false);
        }
    }, [paperDetails.subjectId, subjects]);

    useEffect(() => {
        const fetchMetadata = async () => {
            const classRes = await window.electronAPI.dbQuery('SELECT * FROM Classes');
            const subjectRes = await window.electronAPI.dbQuery('SELECT * FROM Subjects');
            if (classRes.success) setClasses(classRes.data);
            if (subjectRes.success) setSubjects(subjectRes.data);

            if (classRes.data?.length > 0) setPaperDetails(prev => ({ ...prev, classId: classRes.data[0].Id }));
            if (subjectRes.data?.length > 0) setPaperDetails(prev => ({ ...prev, subjectId: subjectRes.data[0].Id }));
        };
        fetchMetadata();
    }, []);

    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState({
        text: '',
        type: 'MCQ',
        marks: 5,
        options: ['', '', '', '']
    });

    const addQuestion = () => {
        if (!currentQuestion.text) return alert('Please enter question text');
        setQuestions([...questions, currentQuestion]);
        // Reset text but keep type, marks, and options structure
        setCurrentQuestion({
            ...currentQuestion,
            text: '',
            options: ['', '', '', '']
        });
    };

    const removeQuestion = (index) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const submitPaper = async () => {
        if (questions.length === 0) return alert('Please add at least one question');
        if (!paperDetails.classId || !paperDetails.subjectId) return alert('Please select a class and subject');

        // Save Paper and Questions to DB
        const paperQuery = 'INSERT INTO Papers (TeacherId, ClassId, SubjectId, ExamType, Duration, Status, McqInstruction, ShortInstruction, LongInstruction) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const paperResult = await window.electronAPI.dbQuery(paperQuery, [
            user.Id,
            paperDetails.classId,
            paperDetails.subjectId,
            paperDetails.type,
            paperDetails.duration,
            'Submitted',
            paperDetails.mcqInstruction,
            paperDetails.shortInstruction,
            paperDetails.longInstruction
        ]);

        if (paperResult.success) {
            const paperId = paperResult.data.insertId;
            for (const q of questions) {
                const optionsStr = q.type === 'MCQ' ? JSON.stringify(q.options) : null;
                const qQuery = 'INSERT INTO Questions (PaperId, QuestionText, QuestionType, Marks, OptionsJSON) VALUES (?, ?, ?, ?, ?)';
                await window.electronAPI.dbQuery(qQuery, [paperId, q.text, q.type, q.marks, optionsStr]);
            }
            alert('Paper submitted successfully for approval!');
            onBack();
        } else {
            alert('Error saving paper: ' + paperResult.error);
        }
    };

    return (
        <div className="glass-card" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2>Create Exam Paper</h2>
                <button onClick={onBack} style={{ background: 'transparent', color: '#9ca3af', border: 'none', cursor: 'pointer' }}>← Back</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <select
                    className="input-field"
                    value={paperDetails.classId}
                    onChange={(e) => setPaperDetails({ ...paperDetails, classId: e.target.value })}
                >
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.Id} value={c.Id}>{c.ClassName}</option>)}
                </select>
                <select
                    className="input-field"
                    value={paperDetails.subjectId}
                    onChange={(e) => setPaperDetails({ ...paperDetails, subjectId: e.target.value })}
                >
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.Id} value={s.Id}>{s.SubjectName}</option>)}
                </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                    <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Exam Type (e.g. Mid Term, Final)</label>
                    <input
                        className="input-field"
                        placeholder="e.g. Mid Term"
                        value={paperDetails.type}
                        onChange={(e) => {
                            const val = e.target.value;
                            setPaperDetails({
                                ...paperDetails,
                                type: isUrduMode ? (val.length > paperDetails.type.length ? paperDetails.type + transliterateToUrdu(val[val.length - 1]) : val) : val
                            });
                        }}
                        style={{ direction: isUrduMode ? 'rtl' : 'ltr' }}
                    />
                </div>
                <div>
                    <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Duration (e.g. 3 Hours)</label>
                    <input
                        className="input-field"
                        placeholder="e.g. 3 Hours"
                        value={paperDetails.duration}
                        onChange={(e) => {
                            const val = e.target.value;
                            setPaperDetails({
                                ...paperDetails,
                                duration: isUrduMode ? (val.length > paperDetails.duration.length ? paperDetails.duration + transliterateToUrdu(val[val.length - 1]) : val) : val
                            });
                        }}
                        style={{ direction: isUrduMode ? 'rtl' : 'ltr' }}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                    <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>MCQ Instruction</label>
                    <input
                        className="input-field"
                        value={paperDetails.mcqInstruction}
                        placeholder="e.g. Attempt all"
                        onChange={(e) => setPaperDetails({ ...paperDetails, mcqInstruction: e.target.value })}
                    />
                </div>
                <div>
                    <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Short Q Instruction</label>
                    <input
                        className="input-field"
                        value={paperDetails.shortInstruction}
                        placeholder="e.g. Solve any 5"
                        onChange={(e) => setPaperDetails({ ...paperDetails, shortInstruction: e.target.value })}
                    />
                </div>
                <div>
                    <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Long Q Instruction</label>
                    <input
                        className="input-field"
                        value={paperDetails.longInstruction}
                        placeholder="e.g. Solve any 3"
                        onChange={(e) => setPaperDetails({ ...paperDetails, longInstruction: e.target.value })}
                    />
                </div>
            </div>

            <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Add Question</h3>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                            <input
                                type="checkbox"
                                checked={isUrduMode}
                                onChange={(e) => setIsUrduMode(e.target.checked)}
                            />
                            Urdu Typing Mode (Phonetic)
                        </label>
                        <button
                            onClick={() => setShowKeyboard(!showKeyboard)}
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '0.3rem', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                            {showKeyboard ? 'Hide' : 'Show'} Urdu Keys
                        </button>
                    </div>
                </div>

                {showKeyboard && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', marginBottom: '1rem', justifyContent: 'center' }}>
                        {urduKeyboardLayout.flat().map(key => (
                            <button
                                key={key}
                                onClick={() => setCurrentQuestion({ ...currentQuestion, text: currentQuestion.text + key })}
                                style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '0.25rem', cursor: 'pointer' }}
                            >
                                {key}
                            </button>
                        ))}
                    </div>
                )}

                <select
                    className="input-field"
                    style={{ marginTop: '1rem' }}
                    value={currentQuestion.type}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, type: e.target.value })}
                >
                    <option value="MCQ">Multiple Choice (MCQ)</option>
                    <option value="Short">Short Question</option>
                    <option value="Long">Long Question</option>
                </select>

                <textarea
                    className="input-field"
                    placeholder={isUrduMode ? "Type in English phonetically (e.g. 'salaam' becomes 'سلام')" : "Enter question text here..."}
                    style={{ height: '100px', resize: 'none', direction: isUrduMode ? 'rtl' : 'ltr', fontFamily: isUrduMode ? 'initial' : 'inherit', fontSize: isUrduMode ? '1.2rem' : '1rem' }}
                    value={currentQuestion.text}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (isUrduMode) {
                            // If user is deleting, just let them delete
                            if (val.length < currentQuestion.text.length) {
                                setCurrentQuestion({ ...currentQuestion, text: val });
                                return;
                            }
                            // Otherwise, transliterate the last word/character
                            const lastChar = val[val.length - 1];
                            if (/[a-zA-Z]/.test(lastChar)) {
                                const head = val.substring(0, val.length - 1);
                                setCurrentQuestion({ ...currentQuestion, text: head + transliterateToUrdu(lastChar) });
                            } else {
                                setCurrentQuestion({ ...currentQuestion, text: val });
                            }
                        } else {
                            setCurrentQuestion({ ...currentQuestion, text: val });
                        }
                    }}
                />

                {currentQuestion.type === 'MCQ' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                        {currentQuestion.options.map((opt, idx) => (
                            <input
                                key={idx}
                                className="input-field"
                                style={{ marginBottom: 0 }}
                                placeholder={`Option ${idx + 1}`}
                                value={opt}
                                onChange={(e) => {
                                    const newOpts = [...currentQuestion.options];
                                    newOpts[idx] = e.target.value;
                                    setCurrentQuestion({ ...currentQuestion, options: newOpts });
                                }}
                            />
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label>Marks:</label>
                    <input
                        type="number"
                        className="input-field"
                        style={{ width: '80px', marginBottom: 0 }}
                        value={currentQuestion.marks}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, marks: parseInt(e.target.value) })}
                    />
                    <button onClick={addQuestion} className="btn-primary">Add to List</button>
                </div>
            </div>

            <div>
                <h3>Paper Preview ({questions.length} questions)</h3>
                <div style={{ marginTop: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                    {questions.map((q, i) => (
                        <div key={i} style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <strong>Q{i + 1}:</strong> {q.text} ({q.marks} Marks)
                                <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Type: {q.type}</p>
                            </div>
                            <button onClick={() => removeQuestion(i)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}>Remove</button>
                        </div>
                    ))}
                </div>
            </div>

            {questions.length > 0 && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    <button
                        onClick={() => {
                            const selectedClass = classes.find(c => c.Id == paperDetails.classId)?.ClassName || '';
                            const selectedSubject = subjects.find(s => s.Id == paperDetails.subjectId)?.SubjectName || '';
                            generateExamPDF({ ...paperDetails, class: selectedClass, subject: selectedSubject }, questions);
                        }}
                        className="btn-primary"
                        style={{ flex: 1, background: 'linear-gradient(135deg, #10b981, #059669)' }}
                    >
                        Preview & Download PDF
                    </button>
                    <button onClick={submitPaper} className="btn-primary" style={{ flex: 1 }}>
                        Submit Paper for Approval
                    </button>
                </div>
            )}
        </div>
    );
}

export default QuestionForm;
