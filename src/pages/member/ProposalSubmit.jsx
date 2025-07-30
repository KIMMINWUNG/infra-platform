// --- /src/pages/member/ProposalSubmit.jsx ---
import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';

// ✅ FormTextarea 컴포넌트를 ProposalSubmit 바깥으로 이동시켰습니다.
const FormTextarea = ({ label, ...props }) => (
    <div className="form_group">
        <label>{label}</label>
        <textarea {...props} className="form_textarea" required></textarea>
    </div>
);

const ProposalSubmit = () => {
    const [title, setTitle] = useState('');
    const [background, setBackground] = useState('');
    const [content, setContent] = useState('');
    const [effects, setEffects] = useState('');
    const { user, userData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user || !userData) { 
            setNotification("로그인이 필요합니다.");
            return; 
        }
        setLoading(true);
        setNotification('');

        try {
            await addDoc(collection(db, 'proposals'), { 
                title, 
                background, 
                content, 
                effects, 
                proposerId: user.uid, 
                proposerName: userData.name, 
                division: userData.division,
                status: 'pending', 
                score: null, 
                evaluationDetails: null,
                createdAt: serverTimestamp() 
            });
            setNotification('안건이 성공적으로 제출되었습니다.');
            setTitle(''); 
            setBackground(''); 
            setContent(''); 
            setEffects('');
            setTimeout(() => setNotification(''), 3000);
        } catch (error) {
            console.error("안건 제출 오류: ", error);
            setNotification('안건 제출 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return ( 
        <div className="page_container" style={{maxWidth: '56rem', margin: '0 auto'}}>
            <h2 className="page_title">협의체 안건 제안</h2>
            <form onSubmit={handleSubmit} className="form_layout">
                <div className="form_group">
                    <label>안건 제목</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="form_input" required />
                </div>
                
                {/* 이제 이 컴포넌트들은 더 이상 새로고침되지 않습니다. */}
                <FormTextarea label="제안 배경" value={background} onChange={e => setBackground(e.target.value)} rows="4" />
                <FormTextarea label="주요 내용" value={content} onChange={e => setContent(e.target.value)} rows="8" />
                <FormTextarea label="기대 효과" value={effects} onChange={e => setEffects(e.target.value)} rows="4" />
                
                {notification && <p className="form_success" style={{height: '1.25rem'}}>{notification}</p>}

                <button type="submit" disabled={loading} className="button button_primary" style={{width: '100%', marginTop: '1rem'}}>
                    {loading ? '제출 중...' : '제출하기'}
                </button>
            </form>
        </div>
    );
};
export default ProposalSubmit;