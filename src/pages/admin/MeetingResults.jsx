// --- /src/pages/admin/MeetingResults.jsx ---
import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import Spinner from '../../components/Spinner';
import Modal from '../../components/Modal';

const MeetingResults = () => {
    const [mode, setMode] = useState('list');
    const [meetings, setMeetings] = useState([]);
    const [users, setUsers] = useState([]);
    const [savedResults, setSavedResults] = useState([]);
    const [currentResult, setCurrentResult] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAttendeeModalOpen, setIsAttendeeModalOpen] = useState(false);
    const [confirmDeleteModal, setConfirmDeleteModal] = useState({ isOpen: false, result: null });
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        const today = new Date().toISOString().slice(0, 10);
        const meetingsQuery = query(collection(db, 'meetings'), where("endDate", "<", today), where("status", "in", ["upcoming", "postponed"]));
        const unsubMeetings = onSnapshot(meetingsQuery, snapshot => setMeetings(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
        const usersQuery = query(collection(db, 'users'), where("approved", "==", true));
        const unsubUsers = onSnapshot(usersQuery, snapshot => setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
        const resultsQuery = query(collection(db, 'meeting_results'), orderBy("createdAt", "desc"));
        const unsubResults = onSnapshot(resultsQuery, snapshot => {
            const resultsList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setSavedResults(resultsList);
            setLoading(false);
        }, () => setLoading(false)); // 오류 발생 시에도 로딩 종료
        return () => { unsubMeetings(); unsubUsers(); unsubResults(); };
    }, []);

    const handleCreateNew = (meeting) => {
        setError('');
        setCurrentResult({
            meetingId: meeting.id,
            meetingTitle: meeting.title,
            meetingDate: meeting.startDate,
            meetingLocation: meeting.location,
            attendees: meeting.attendees || [],
            discussion: '',
            imageUrl: '',
        });
        setImageFile(null);
        setMode('create');
    };

    const handleEdit = (result) => {
        setError('');
        setCurrentResult(result);
        setImageFile(null);
        setMode('edit');
    };

    // ✅ 무한 로딩 방지를 위한 try-catch-finally 구문
    const handleSave = async () => {
        if (!currentResult) return;
        setLoading(true);
        setError('');
        let imageUrl = currentResult.imageUrl || '';

        try {
            if (imageFile) {
                const imageRef = ref(storage, `meeting_results/${currentResult.meetingId || currentResult.id}/${Date.now()}_${imageFile.name}`);
                const snapshot = await uploadBytes(imageRef, imageFile);
                imageUrl = await getDownloadURL(snapshot.ref);
            }
            const attendeesData = users.filter(u => currentResult.attendees.includes(u.id))
                                       .map(u => ({ id: u.id, name: u.name, affiliation: u.affiliation, division: u.division }));
            const resultData = { ...currentResult, imageUrl, attendeesData };

            if (mode === 'create') {
                await addDoc(collection(db, 'meeting_results'), { ...resultData, createdAt: serverTimestamp() });
                await updateDoc(doc(db, 'meetings', currentResult.meetingId), { status: 'finished' });
            } else {
                const { id, ...dataToUpdate } = resultData;
                await updateDoc(doc(db, 'meeting_results', id), dataToUpdate);
            }
            setMode('list');
            setCurrentResult(null);
        } catch (error) {
            console.error("회의 결과 저장/업로드 오류:", error);
            setError(`오류: ${error.code}. Firebase 규칙을 확인해주세요.`);
        } finally {
            setLoading(false); // 성공/실패 여부와 관계없이 로딩 종료
        }
    };

    const handleDelete = async () => {
        // ... (이하 코드는 이전과 동일)
        if (!confirmDeleteModal.result) return;
        setLoading(true);
        try {
            await deleteDoc(doc(db, 'meeting_results', confirmDeleteModal.result.id));
        } catch (error) {
            console.error("Error deleting result: ", error);
        }
        setConfirmDeleteModal({ isOpen: false, result: null });
        setLoading(false);
    };

    const handleAttendeeToggle = (userId) => {
        setCurrentResult(prev => ({
            ...prev,
            attendees: prev.attendees.includes(userId) ? prev.attendees.filter(id => id !== userId) : [...prev.attendees, userId]
        }));
    };

    const groupedUsers = useMemo(() => users.reduce((acc, user) => {
        const division = user.division || '기타';
        if (!acc[division]) acc[division] = [];
        acc[division].push(user);
        return acc;
    }, {}), [users]);

    const attendeeSummary = useMemo(() => {
        if (!currentResult) return '전체 0명';
        const total = currentResult.attendees.length;
        const summary = users.filter(u => currentResult.attendees.includes(u.id)).reduce((acc, user) => {
            const division = user.division || '기타';
            acc[division] = (acc[division] || 0) + 1;
            return acc;
        }, {});
        return `전체 ${total}명 (${Object.entries(summary).map(([key, value]) => `${key} ${value}명`).join(', ')})`;
    }, [currentResult, users]);


    if (mode === 'list') {
        return (
            <div className="page_container">
                <div className="page_header">
                    <h2 className="page_title">회의 결과 관리</h2>
                    <button onClick={() => setMode('selectMeeting')} className="button button_primary">새 결과 작성</button>
                </div>
                <div className="table_wrapper">
                    <table className="table">
                         <thead><tr><th>회의명</th><th>회의일자</th><th>관리</th></tr></thead>
                        <tbody>
                            {savedResults.map(r => (
                                <tr key={r.id}>
                                    <td>{r.meetingTitle}</td>
                                    <td>{r.meetingDate}</td>
                                    <td className="table_actions">
                                        <button onClick={() => handleEdit(r)} className="button_link">상세/수정</button>
                                        <button onClick={() => setConfirmDeleteModal({ isOpen: true, result: r })} className="button_link text_danger">삭제</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
    
    if (mode === 'selectMeeting') {
        return (
            <div className="page_container">
                 <div className="page_header">
                    <h2 className="page_title">결과를 작성할 회의 선택</h2>
                    <button onClick={() => setMode('list')} className="button button_secondary">목록으로</button>
                </div>
                <div className="list_container">
                    {meetings.length > 0 ? meetings.map(m => (
                        <button key={m.id} onClick={() => handleCreateNew(m)} className="list_item_button">
                            <span>{m.title}</span>
                            <span style={{marginLeft: '1rem', fontSize: '0.875rem', color: '#64748b'}}>({m.startDate})</span>
                        </button>
                    )) : <p className="empty_message">결과를 작성할 회의가 없습니다.</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="page_container">
            <div className="page_header">
                <h2 className="page_title">{mode === 'create' ? '회의 결과 작성' : '회의 결과 수정'}</h2>
                <button onClick={() => setMode('list')} className="button button_secondary">목록으로</button>
            </div>
            {loading ? <Spinner /> : currentResult && (
                <div className="form_layout">
                    <div className="card_light">
                        <h3 className="section_title" style={{marginBottom: '0.5rem'}}>{currentResult.meetingTitle}</h3>
                        <p><strong>일시:</strong> {currentResult.meetingDate}</p>
                        <p><strong>장소:</strong> {currentResult.meetingLocation}</p>
                    </div>
                    <div className="form_group">
                        <label>주요 논의 내용</label>
                        <textarea value={currentResult.discussion} onChange={e => setCurrentResult(p => ({...p, discussion: e.target.value}))} rows="10" className="form_textarea"></textarea>
                    </div>
                    <div className="form_group">
                        <label>관련 사진 업로드</label>
                        <input type="file" onChange={(e) => setImageFile(e.target.files[0])} className="form_input_file" accept="image/*" />
                        {(currentResult.imageUrl && !imageFile) && <img src={currentResult.imageUrl} alt="회의 사진" className="image_preview" />}
                         {imageFile && <img src={URL.createObjectURL(imageFile)} alt="업로드 미리보기" className="image_preview" />}
                    </div>
                    <div className="form_group">
                        <label>참석자 명단</label>
                        <div className="card_light" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <span>{attendeeSummary}</span>
                            <button onClick={() => setIsAttendeeModalOpen(true)} className="button_link">명단 수정</button>
                        </div>
                    </div>
                    {error && <p className="form_error">{error}</p>}
                    <button onClick={handleSave} disabled={loading} className="button button_primary" style={{width: '100%'}}>
                        {loading ? '저장 중...' : (mode === 'create' ? '결과 저장' : '수정 완료')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default MeetingResults;