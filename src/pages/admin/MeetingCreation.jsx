// --- /src/pages/admin/MeetingCreation.jsx ---
import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Spinner from '../../components/Spinner';
import Modal from '../../components/Modal';

const FormInput = ({ label, ...props }) => (
    <div className="form_group">
        <label>{label}</label>
        <input {...props} className="form_input"/>
    </div>
);

const ScheduleForm = ({ meetingData, setMeetingData, handleScheduleChange, handleAddSession, handleAddScheduleItem }) => (
    <div className="schedule_form">
        <h3 className="section_title">세부 일정표</h3>
        {meetingData.schedule.map((day, dayIndex) => (
            <div key={day.date} className="schedule_day_container">
                <h4>{dayIndex + 1}일차 ({day.date})</h4>
                {day.sessions.map((session, sessionIndex) => (
                    <div key={sessionIndex} className="schedule_session_container">
                        <input type="text" value={session.name} onChange={(e) => handleScheduleChange(e, dayIndex, sessionIndex, null, 'sessionName', meetingData, setMeetingData)} className="session_name_input" />
                        {session.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="schedule_item_container">
                                <input type="text" placeholder="10:00-11:00" value={item.time} onChange={e => handleScheduleChange(e, dayIndex, sessionIndex, itemIndex, 'time', meetingData, setMeetingData)} className="form_input" style={{width: '33.33%'}}/>
                                <input type="text" placeholder="일정 내용" value={item.content} onChange={e => handleScheduleChange(e, dayIndex, sessionIndex, itemIndex, 'content', meetingData, setMeetingData)} className="form_input" style={{width: '66.66%'}} />
                            </div>
                        ))}
                        <button type="button" onClick={() => handleAddScheduleItem(dayIndex, sessionIndex, meetingData, setMeetingData)} className="button_link_small">
                            + 시간 추가
                        </button>
                    </div>
                ))}
                <button type="button" onClick={() => handleAddSession(dayIndex, meetingData, setMeetingData)} className="button_link_small" style={{color: 'green'}}>
                    + 세션 추가
                </button>
            </div>
        ))}
    </div>
);

const MeetingCreation = () => {
    const [newMeeting, setNewMeeting] = useState({ title: '', startDate: '', endDate: '', location: '', schedule: [] });
    const [notification, setNotification] = useState('');
    const [loading, setLoading] = useState(false);
    const [meetings, setMeetings] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState(null);
    const [confirmDeleteModal, setConfirmDeleteModal] = useState({ isOpen: false, meeting: null });
    const [users, setUsers] = useState([]);
    const [isAttendeeModalOpen, setIsAttendeeModalOpen] = useState(false);
    const [selectedMeetingAttendees, setSelectedMeetingAttendees] = useState([]);

    useEffect(() => {
        const usersQuery = query(collection(db, 'users'));
        const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
            const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(userList);
        });
        
        setListLoading(true);
        const meetingsQuery = query(collection(db, 'meetings'));
        // ✅ onSnapshot에 오류 처리 콜백을 추가하여 무한 로딩을 방지합니다.
        const unsubscribeMeetings = onSnapshot(meetingsQuery, (snapshot) => {
            const meetingList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            meetingList.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
            setMeetings(meetingList);
            setListLoading(false);
        }, (error) => {
            console.error("회의 목록 로딩 오류 (규칙 확인 필요): ", error);
            setListLoading(false); // 오류 발생 시에도 로딩 종료
        });

        return () => {
            unsubscribeUsers();
            unsubscribeMeetings();
        };
    }, []);

    const handleViewAttendees = (attendeeIds) => {
        if (!attendeeIds || attendeeIds.length === 0) {
            setSelectedMeetingAttendees([]);
        } else {
            const attendeeDetails = users.filter(user => attendeeIds.includes(user.id));
            setSelectedMeetingAttendees(attendeeDetails);
        }
        setIsAttendeeModalOpen(true);
    };

    const handleScheduleChange = (e, dayIndex, sessionIndex, itemIndex, field, targetMeeting, setTargetMeeting) => {
        const newSchedule = JSON.parse(JSON.stringify(targetMeeting.schedule));
        if (field === 'sessionName') {
            newSchedule[dayIndex].sessions[sessionIndex].name = e.target.value;
        } else {
            newSchedule[dayIndex].sessions[sessionIndex].items[itemIndex][field] = e.target.value;
        }
        setTargetMeeting({ ...targetMeeting, schedule: newSchedule });
    };

    const handleAddSession = (dayIndex, targetMeeting, setTargetMeeting) => {
        const newSchedule = JSON.parse(JSON.stringify(targetMeeting.schedule));
        newSchedule[dayIndex].sessions.push({ name: `Session ${newSchedule[dayIndex].sessions.length + 1}`, items: [] });
        setTargetMeeting({ ...targetMeeting, schedule: newSchedule });
    };

    const handleAddScheduleItem = (dayIndex, sessionIndex, targetMeeting, setTargetMeeting) => {
        const newSchedule = JSON.parse(JSON.stringify(targetMeeting.schedule));
        newSchedule[dayIndex].sessions[sessionIndex].items.push({ time: '', content: '' });
        setTargetMeeting({ ...targetMeeting, schedule: newSchedule });
    };
    
    const handleDateChange = (e, targetMeeting, setTargetMeeting) => {
        const { name, value } = e.target;
        const updatedMeeting = { ...targetMeeting, [name]: value };
        const startValue = name === 'startDate' ? value : targetMeeting.startDate;
        const endValue = name === 'endDate' ? value : targetMeeting.endDate;
        if (startValue && endValue) {
            const start = new Date(startValue);
            const end = new Date(endValue);
            if (start <= end) {
                const newSchedule = [];
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    newSchedule.push({ date: new Date(d).toISOString().slice(0, 10), sessions: [{ name: 'Session 1', items: [] }] });
                }
                updatedMeeting.schedule = newSchedule;
            } else {
                updatedMeeting.schedule = [];
            }
        }
        setTargetMeeting(updatedMeeting);
    };

    const handleNewMeetingSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setNotification('');
        try {
            await addDoc(collection(db, 'meetings'), { ...newMeeting, status: 'upcoming', attendees: [], createdAt: serverTimestamp() });
            setNotification('회의가 성공적으로 생성되었습니다.');
            setNewMeeting({ title: '', startDate: '', endDate: '', location: '', schedule: [] });
            setTimeout(() => setNotification(''), 3000);
        } catch (error) {
            console.error("회의 생성 오류:", error);
            setNotification('회의 생성 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (meeting) => {
        setEditingMeeting(JSON.parse(JSON.stringify(meeting)));
        setIsEditModalOpen(true);
    };

    const handleUpdateMeeting = async () => {
        if (!editingMeeting) return;
        setLoading(true);
        const { id, ...meetingData } = editingMeeting;
        const meetingRef = doc(db, 'meetings', id);
        try {
            await updateDoc(meetingRef, meetingData);
        } catch (error) {
            console.error("회의 수정 오류:", error);
        } finally {
            setIsEditModalOpen(false);
            setEditingMeeting(null);
            setLoading(false);
        }
    };

    const handleDeleteMeeting = async () => {
        if (!confirmDeleteModal.meeting) return;
        setLoading(true);
        try {
            await deleteDoc(doc(db, 'meetings', confirmDeleteModal.meeting.id));
        } catch (error) {
            console.error("회의 삭제 오류:", error);
        } finally {
            setConfirmDeleteModal({ isOpen: false, meeting: null });
            setIsEditModalOpen(false);
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        const meetingRef = doc(db, 'meetings', id);
        try {
            await updateDoc(meetingRef, { status: newStatus });
        } catch (error) {
            console.error("상태 업데이트 오류:", error);
        }
    };

    const StatusBadge = ({ status }) => {
        let statusClass = 'status_badge';
        if (status === 'upcoming') statusClass += ' status_blue';
        else if (status === 'postponed') statusClass += ' status_yellow';
        else if (status === 'cancelled') statusClass += ' status_red';
        else if (status === 'finished') statusClass += ' status_gray';
        
        const statusText = { upcoming: '예정', postponed: '연기', cancelled: '취소', finished: '완료' }[status] || status;

        return <span className={statusClass}>{statusText}</span>;
    };

    return (
        <div className="page_wrapper">
            <div className="page_container">
                <h2 className="page_title">회의 개최하기</h2>
                <form onSubmit={handleNewMeetingSubmit} className="form_layout">
                    <div className="form_grid_2_cols">
                        <FormInput label="회의 주제" type="text" value={newMeeting.title} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} required />
                        <FormInput label="장소" type="text" value={newMeeting.location} onChange={e => setNewMeeting({...newMeeting, location: e.target.value})} required />
                        <FormInput label="시작일" type="date" name="startDate" value={newMeeting.startDate} onChange={(e) => handleDateChange(e, newMeeting, setNewMeeting)} required />
                        <FormInput label="종료일" type="date" name="endDate" value={newMeeting.endDate} onChange={(e) => handleDateChange(e, newMeeting, setNewMeeting)} required />
                    </div>
                    {newMeeting.schedule.length > 0 && (
                        <ScheduleForm
                            meetingData={newMeeting}
                            setMeetingData={setNewMeeting}
                            handleScheduleChange={handleScheduleChange}
                            handleAddSession={handleAddSession}
                            handleAddScheduleItem={handleAddScheduleItem}
                        />
                    )}
                    {notification && <p className="form_success">{notification}</p>}
                    <button type="submit" disabled={loading} className="button button_primary" style={{width: '100%', marginTop: '1rem'}}>
                        {loading ? '생성 중...' : '회의 생성하기'}
                    </button>
                </form>
            </div>

            <div className="page_container">
                <h2 className="page_title">협의체 회의 목록</h2>
                {listLoading ? <Spinner /> : (
                    <div className="table_wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>상태</th>
                                    <th>회의 주제</th>
                                    <th>기간</th>
                                    <th>참석 예정</th>
                                    <th>상태 변경</th>
                                    <th>관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {meetings.map(m => (
                                    <tr key={m.id}>
                                        <td><StatusBadge status={m.status} /></td>
                                        <td>{m.title}</td>
                                        <td>{m.startDate} ~ {m.endDate}</td>
                                        <td>
                                            <span>{m.attendees?.length || 0}명 </span>
                                            <button onClick={() => handleViewAttendees(m.attendees)} className="button_link" style={{marginLeft: '0.5rem'}}>
                                                보기
                                            </button>
                                        </td>
                                        <td>
                                            {m.status !== 'finished' && m.status !== 'cancelled' && (
                                                <select value={m.status} onChange={(e) => handleStatusChange(m.id, e.target.value)} className="select_input">
                                                    <option value="upcoming">예정</option>
                                                    <option value="postponed">연기</option>
                                                    <option value="cancelled">취소</option>
                                                    <option value="finished">완료</option>
                                                </select>
                                            )}
                                        </td>
                                        <td>
                                            <button onClick={() => openEditModal(m)} className="button_link">상세/수정</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="회의 상세 정보 수정" size="4xl">
                {editingMeeting && (
                    <div className="form_layout">
                         <div className="form_grid_2_cols">
                            <FormInput label="회의 주제" type="text" value={editingMeeting.title} onChange={e => setEditingMeeting({...editingMeeting, title: e.target.value})} required />
                            <FormInput label="장소" type="text" value={editingMeeting.location} onChange={e => setEditingMeeting({...editingMeeting, location: e.target.value})} required />
                            <FormInput label="시작일" type="date" name="startDate" value={editingMeeting.startDate} onChange={(e) => handleDateChange(e, editingMeeting, setEditingMeeting)} required />
                            <FormInput label="종료일" type="date" name="endDate" value={editingMeeting.endDate} onChange={(e) => handleDateChange(e, editingMeeting, setEditingMeeting)} required />
                        </div>
                        {editingMeeting.schedule.length > 0 && (
                            <ScheduleForm
                                meetingData={editingMeeting}
                                setMeetingData={setEditingMeeting}
                                handleScheduleChange={handleScheduleChange}
                                handleAddSession={handleAddSession}
                                handleAddScheduleItem={handleAddScheduleItem}
                            />
                        )}
                        <div className="modal_footer">
                            <button onClick={() => setConfirmDeleteModal({isOpen: true, meeting: editingMeeting})} disabled={loading} className="button button_danger">회의 삭제</button>
                            <button onClick={handleUpdateMeeting} disabled={loading} className="button button_primary">
                                {loading ? '저장 중...' : '수정 완료'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
            <Modal isOpen={confirmDeleteModal.isOpen} onClose={() => setConfirmDeleteModal({isOpen: false, meeting: null})} title="회의 삭제 확인" size="md">
                {confirmDeleteModal.meeting && (
                    <div>
                        <p>정말로 <strong>{confirmDeleteModal.meeting.title}</strong> 회의를 삭제하시겠습니까?</p>
                        <p className="text_danger">이 작업은 되돌릴 수 없습니다.</p>
                        <div className="modal_footer">
                            <button onClick={() => setConfirmDeleteModal({isOpen: false, meeting: null})} className="button button_secondary">취소</button>
                            <button onClick={handleDeleteMeeting} className="button button_danger">삭제</button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={isAttendeeModalOpen} onClose={() => setIsAttendeeModalOpen(false)} title="참석 예정 의원 명단">
                {selectedMeetingAttendees.length > 0 ? (
                    <ul className="list_container" style={{gap: '0.5rem'}}>
                        {selectedMeetingAttendees.map(attendee => (
                            <li key={attendee.id} className="list_item_card">
                                <strong>{attendee.name}</strong>
                                <span>({attendee.affiliation})</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="empty_message">참석을 신청한 의원이 없습니다.</p>
                )}
            </Modal>
        </div>
    );
};
export default MeetingCreation;