// --- /src/App.jsx ---
import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLayout from './pages/admin/AdminLayout';
import MemberLayout from './pages/member/MemberLayout';
import Spinner from './components/Spinner';

const App = () => {
    const [page, setPage] = useState('login');
    const { user, isAdmin, loading } = useAuth();

    useEffect(() => {
        // Don't change page state until authentication check is complete
        if (loading) return;

        if (user) {
            // If user is logged in, show the appropriate layout
            setPage(isAdmin ? 'admin' : 'member');
        } else {
            // If user is not logged in, show login/register page
            // Preserve 'register' page if user is currently on it
            if (page !== 'register') {
                setPage('login');
            }
        }
    }, [user, isAdmin, loading]); // `page` is removed from deps to prevent loops

    const renderPage = () => {
        if (user) {
            return isAdmin ? <AdminLayout /> : <MemberLayout />;
        }
        
        switch (page) {
            case 'register':
                return <Register setPage={setPage} />;
            case 'login':
            default:
                return <Login setPage={setPage} />;
        }
    };
    
    // Show a global spinner during the initial authentication check
    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-slate-50">
                <Spinner />
            </div>
        );
    }

    return renderPage();
};
export default App;