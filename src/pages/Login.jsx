// --- /src/pages/Login.jsx ---
import React, { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const Login = ({ setPage }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const loginEmail = (email.toLowerCase() === 'infra') ? 'infra@test.com' : email;
        try {
            const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
            if (loginEmail !== 'alsdnd8842@kalis.or.kr') {
                const userDocRef = doc(db, 'users', userCredential.user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (!userDocSnap.exists()) {
                    setError('가입 정보가 없습니다. 의원 등록을 먼저 진행해주세요.');
                    await signOut(auth);
                } else if (!userDocSnap.data().approved) {
                    setError('관리자 승인 대기 상태입니다. 승인 후 로그인할 수 있습니다.');
                    await signOut(auth);
                }
            }
        } catch (err) {
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('아이디 또는 비밀번호가 올바르지 않습니다.');
            } else {
                setError('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                console.error("Login error:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth_page_wrapper">
            <div className="auth_form_container">
                <h2 className="auth_title">지속가능 협의체 플랫폼</h2>
                <form onSubmit={handleLogin} className="auth_form">
                    <div className="form_group">
                        <label>아이디 (이메일)</label>
                        <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} className="form_input" placeholder="이메일을 입력하세요" required />
                    </div>
                    <div className="form_group">
                        <label>비밀번호</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form_input" placeholder="비밀번호를 입력하세요" required />
                    </div>
                    {error && <p className="form_error">{error}</p>}
                    <div className="form_group">
                        <button type="submit" disabled={loading} className="button button_primary" style={{width: '100%'}}>
                            {loading ? '로그인 중...' : '로그인'}
                        </button>
                    </div>
                </form>
                <div className="auth_link">
                    <button onClick={() => setPage('register')}>
                        협의체 의원 등록하기
                    </button>
                </div>
            </div>
             <footer className="auth_footer">
                <p>&copy; {new Date().getFullYear()} 지속가능 협의체. All Rights Reserved.</p>
            </footer>
        </div>
    );
};
export default Login;