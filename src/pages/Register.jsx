// --- /src/pages/Register.jsx ---
import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

// FormInput 컴포넌트는 Register 컴포넌트 바깥에 유지합니다.
const FormInput = ({ label, required, children }) => (
    <div className="form_group">
        <label>{label}{required && '*'}</label>
        {children}
    </div>
);

const Register = ({ setPage }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', companyPhone: '', affiliation: '', division: '', expertise: [] });
    const [isAgreed, setIsAgreed] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isFormValid, setIsFormValid] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [loading, setLoading] = useState(false);
    const divisions = { '교통': ['도로', '철도', '항만', '어항', '공항'], '유통공급': ['수도', '전기', '가스', '열', '통신', '공동구', '송유'], '방재': ['하천', '저수지', '댐'], '환경기초': ['하수도'] };

    useEffect(() => {
        const { name, email, password, confirmPassword, phone, affiliation, division, expertise } = formData;
        if (password && confirmPassword && password !== confirmPassword) {
            setPasswordError('비밀번호가 일치하지 않습니다.');
        } else {
            setPasswordError('');
        }
        const passwordsMatch = password && password.length >= 6 && password === confirmPassword;
        const requiredFieldsFilled = name && email && password && phone && affiliation && division && expertise.length > 0;
        setIsFormValid(requiredFieldsFilled && passwordsMatch && isAgreed);
    }, [formData, isAgreed]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'division') setFormData(prev => ({ ...prev, expertise: [] }));
    };

    // ✅ 이름, 소속 등 한글만 입력받는 함수 (재추가)
    const handleKoreanChange = (e) => {
        const { name, value } = e.target;
        // 한글과 띄어쓰기만 허용
        const koreanOnly = value.replace(/[^ㄱ-ㅎ|ㅏ-ㅣ|가-힣\s]/g, '');
        setFormData(prev => ({ ...prev, [name]: koreanOnly }));
    };

    // ✅ 전화번호에 하이픈을 추가하고 숫자만 입력받는 함수 (재추가)
    const handlePhoneChange = (e) => {
        const { name, value } = e.target;
        // 숫자 이외의 문자는 모두 제거
        const digitsOnly = value.replace(/\D/g, '');
        
        let formattedPhone = digitsOnly;
        // 길이에 따라 하이픈 자동 추가
        if (digitsOnly.length > 3 && digitsOnly.length <= 7) {
            formattedPhone = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`;
        } else if (digitsOnly.length > 7) {
            formattedPhone = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 7)}-${digitsOnly.slice(7, 11)}`;
        }
        
        setFormData(prev => ({ ...prev, [name]: formattedPhone }));
    };
    
    const handleExpertiseChange = (e) => {
        const { value, checked } = e.target;
        setFormData(prev => ({ ...prev, expertise: checked ? [...prev.expertise, value] : prev.expertise.filter(item => item !== value) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (passwordError) { setError('비밀번호를 확인해주세요.'); return; }
        if (!isFormValid) { setError('모든 필수 항목을 입력하고 개인정보 수집에 동의해주세요. 비밀번호는 6자리 이상이어야 합니다.'); return; }
        
        setError('');
        setSuccess('');
        setLoading(true);
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const { password, confirmPassword, ...userData } = formData;
            await setDoc(doc(db, "users", userCredential.user.uid), { ...userData, approved: false, createdAt: serverTimestamp() });
            
            await signOut(auth);
            
            setSuccess('가입 신청이 완료되었습니다. 관리자 승인 후 로그인 가능합니다. 잠시 후 로그인 페이지로 이동합니다.');
            setLoading(false);

            setTimeout(() => {
                setPage('login');
            }, 3000);

        } catch (err) {
            if (err.code === 'auth/email-already-in-use') {
                setError('이미 사용 중인 이메일입니다.');
            } else if (err.code === 'auth/weak-password') {
                setError('비밀번호는 6자리 이상이어야 합니다.');
            } else {
                setError('가입 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            }
            setLoading(false);
        }
    };
    
    const PrivacyPolicy = () => ( <div className="privacy_policy"><h4 style={{fontWeight: '700'}}>개인정보 수집 및 이용 동의</h4><p><strong>1. 수집 항목:</strong> 성명, 이메일, 비밀번호, 휴대폰번호, 회사번호, 소속, 분과, 전문 분야</p><p><strong>2. 처리 목적:</strong> 플랫폼 회원 관리, 안건 제안/평가, 회의 관리</p><p><strong>3. 보유 기간:</strong> 회원 탈퇴 시까지</p></div> );
    
    return (
        <div className="auth_page_wrapper">
            <div className="auth_form_container" style={{maxWidth: '42rem'}}>
                <h2 className="auth_title">협의체 의원 등록</h2>
                <form onSubmit={handleSubmit} className="auth_form">
                    <div className="register_grid">
                        {/* ✅ onChange 핸들러를 조건에 맞게 변경 */}
                        <div className="register_grid_col_span_2"><FormInput label="성명 (한글)" required><input type="text" name="name" value={formData.name} onChange={handleKoreanChange} className="form_input" required /></FormInput></div>
                        <div className="register_grid_col_span_2"><FormInput label="이메일" required><input type="email" name="email" value={formData.email} onChange={handleChange} className="form_input" required /></FormInput></div>
                        
                        <FormInput label="비밀번호 (6자리 이상)" required>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} className="form_input" required />
                        </FormInput>
                        <FormInput label="비밀번호 확인" required>
                            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="form_input" required />
                            {passwordError && <p className="form_error" style={{textAlign: 'left', marginTop: '0.25rem'}}>{passwordError}</p>}
                        </FormInput>
                        
                        <FormInput label="휴대폰번호" required><input type="tel" name="phone" value={formData.phone} onChange={handlePhoneChange} maxLength="13" className="form_input" placeholder="010-1234-5678" required /></FormInput>
                        <FormInput label="회사번호"><input type="tel" name="companyPhone" value={formData.companyPhone} onChange={handlePhoneChange} maxLength="13" className="form_input" /></FormInput>
                        
                        <div className="register_grid_col_span_2"><FormInput label="소속 (기관/회사명, 한글)" required><input type="text" name="affiliation" value={formData.affiliation} onChange={handleKoreanChange} className="form_input" required /></FormInput></div>
                        <div className="register_grid_col_span_2"><FormInput label="참여 희망 분과" required><select name="division" value={formData.division} onChange={handleChange} className="form_input" required><option value="">분과 선택</option>{Object.keys(divisions).map(div => <option key={div} value={div}>{div}</option>)}</select></FormInput></div>
                        
                        {formData.division && (<div className="register_grid_col_span_2"><FormInput label="전문 분야 (1개 이상 선택)" required><div className="checkbox_group">{divisions[formData.division].map(exp => (<label key={exp} className="checkbox_label"><input type="checkbox" value={exp} checked={formData.expertise.includes(exp)} onChange={handleExpertiseChange} className="form_checkbox" /><span>{exp}</span></label>))}</div></FormInput></div>)}
                        
                        <div className="register_grid_col_span_2" style={{marginTop: '1rem'}}><PrivacyPolicy /><div style={{display: 'flex', alignItems: 'center', marginTop: '0.5rem'}}><input type="checkbox" id="agree" checked={isAgreed} onChange={(e) => setIsAgreed(e.target.checked)} className="form_checkbox" /><label htmlFor="agree" style={{marginLeft: '0.5rem'}}>개인정보 수집 및 이용에 동의합니다.</label></div></div>
                    </div>
                    
                    <div className="form_error">
                        {error && <p>{error}</p>}
                        {success && <p className="form_success">{success}</p>}
                    </div>

                    <div className="form_group">
                        <button type="submit" disabled={!isFormValid || loading || success} className="button button_primary" style={{width: '100%'}}>
                            {loading ? '신청 중...' : '가입 신청하기'}
                        </button>
                    </div>
                </form>
                <div className="auth_link"><button onClick={() => setPage('login')}>로그인 페이지로 돌아가기</button></div>
            </div>
        </div>
    );
};
export default Register;