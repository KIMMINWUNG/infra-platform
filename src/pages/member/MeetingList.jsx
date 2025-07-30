// --- /src/pages/member/MeetingList.jsx ---
import React, { useState, useEffect } from 'react';
import { collection, query, where, doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';

const MeetingList = () => {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { userData } = useAuth();

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, 'meetings'), where("status", "in", ["upcoming", "postponed"]));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const meetingList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            meetingList.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
            setMeetings(meetingList);
            setLoading(false);
        }, (error) => {
            console.error("회의 목록 로딩 오류: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // ✅ 수정된 부분: alert 메시지 추가 및 모달 닫기 기능
    const handleRsvp = async (meetingId, attendees) => {
        if (!userData || !userData.id) return;
        
        const meetingRef = doc(db, 'meetings', meetingId);
        const isAttending = attendees.includes(userData.id);

        try {
            if (isAttending) {
                // 참석 취소
                await updateDoc(meetingRef, { attendees: arrayRemove(userData.id) });
                alert('참석 신청이 취소되었습니다.');
            } else {
                // 참석 신청
                await updateDoc(meetingRef, { attendees: arrayUnion(userData.id) });
                alert('참석 신청이 완료되었습니다.');
            }
            // 작업 완료 후 모달을 닫습니다.
            closeModal();
        } catch (error) {
            console.error("참석 신청 처리 오류:", error);
            alert("작업 처리 중 오류가 발생했습니다.");
        }
    };

    const openModal = (meeting) => { setSelectedMeeting(meeting); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setSelectedMeeting(null); };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const StatusBadge = ({ status }) => {
        let statusClass = 'status_badge';
        if (status === 'upcoming') statusClass += ' status_blue';
        else if (status === 'postponed') statusClass += ' status_yellow';
        else return null;
        
        const statusText = { upcoming: '참석신청', postponed: '연기됨' }[status];

        return <span className={statusClass}>{statusText}</span>;
    };

    if (loading) return <Spinner />;

    return (
        <div className="page_container">
            <h2 className="page_title">회의 참석 신청</h2>
            <div className="list_container">
                {meetings.length > 0 ? meetings.map(m => {
                    const isExpiredInList = new Date(m.endDate) < today;
                    const isAttending = m.attendees?.includes(userData?.id);
                    return (
                        <div key={m.id} className={`list_item_card ${isExpiredInList || m.status !== 'upcoming' ? 'disabled' : ''}`}>
                            <div>
                                <h3 className="list_item_title">{m.title}</h3>
                                <p className="list_item_subtitle">{m.startDate} ~ {m.endDate} | {m.location}</p>
                            </div>
                            <div className="list_item_actions">
                                {isAttending && <span className="status_badge status_green">참석 예정</span>}
                                <StatusBadge status={m.status} />
                                <button onClick={() => openModal(m)} className="button button_secondary">상세보기</button>
                            </div>
                        </div>
                    );
                }) : <p className="empty_message">예정된 회의가 없습니다.</p>}
            </div>
            
            <Modal isOpen={isModalOpen} onClose={closeModal} title="회의 상세 정보" size="2xl">
                {selectedMeeting && (
                    <div className="form_layout">
                        <h3 className="section_title" style={{fontSize: '1.5rem'}}>{selectedMeeting.title}</h3>
                        <div className="detail_view">
                            <p><strong>기간:</strong> {selectedMeeting.startDate} ~ {selectedMeeting.endDate}</p>
                            <p><strong>장소:</strong> {selectedMeeting.location}</p>
                             <p><strong>참석 예정 인원:</strong> {selectedMeeting.attendees?.length || 0} 명</p>
                        </div>
                        <div className="schedule_form" style={{borderTop: '1px solid #e2e8f0', paddingTop: '1rem'}}>
                            <h4 className="section_subtitle">세부 일정표</h4>
                            {selectedMeeting.schedule.map((day, dayIndex) => (
                                <div key={day.date} className="schedule_day_container">
                                    <h5>{dayIndex + 1}일차 ({day.date})</h5>
                                    {day.sessions.map((session, sessionIndex) => (
                                        <div key={sessionIndex} className="schedule_session_container" style={{paddingLeft: '1rem', marginTop: '0.5rem'}}>
                                            <p style={{fontWeight: '600'}}>{session.name}</p>
                                            <ul style={{listStyle: 'disc', paddingLeft: '1.5rem'}}>
                                                {session.items.map((item, itemIndex) => (<li key={itemIndex}><strong>{item.time}:</strong> {item.content}</li>))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                        
                        <div style={{borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', marginTop: '1.25rem'}}>
                            {(() => {
                                const isExpired = new Date(selectedMeeting.endDate) < today;
                                const isAttending = selectedMeeting.attendees.includes(userData?.id);

                                if (isExpired) return <button disabled className="button" style={{width: '100%'}}>신청 기간 만료</button>;
                                if (selectedMeeting.status === 'postponed') return <button disabled className="button button_yellow" style={{width: '100%'}}>연기된 회의입니다</button>;
                                if (selectedMeeting.status === 'cancelled') return <button disabled className="button button_danger" style={{width: '100%'}}>취소된 회의입니다</button>;
                                
                                return (
                                    <button 
                                        onClick={() => handleRsvp(selectedMeeting.id, selectedMeeting.attendees)} 
                                        className={`button ${isAttending ? 'button_danger' : 'button_green'}`}
                                        style={{width: '100%'}}
                                    >
                                        {isAttending ? '참석 신청 취소' : '참석 신청'}
                                    </button>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
export default MeetingList;