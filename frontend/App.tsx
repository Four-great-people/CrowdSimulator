import React from 'react';
import './styles/App.css';
import {
    Route,
    BrowserRouter as Router,
    Routes,
    Navigate,
    useLocation,
} from 'react-router-dom';
import Maps from './Maps';
import MapDetail from './MapDetail';
import AnimationDetail from './AnimationDetail';
import NotFound from './src/components/NotFound';
import AuthPage from './AuthPage';
import { isAuthenticated } from './src/services/api';

const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const location = useLocation();
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }
    return children;
};

const App: React.FC = () => {
    return (
        <Router>
            <div className="app">
                <main className="app-main">
                    <Routes>
                        <Route path="/login" element={<AuthPage />} />
                        <Route
                            path="/maps"
                            element={
                                <RequireAuth>
                                    <Maps />
                                </RequireAuth>
                            }
                        />
                        <Route
                            path="/map/:id"
                            element={
                                <RequireAuth>
                                    <MapDetail />
                                </RequireAuth>
                            }
                        />
                        <Route
                            path="/animation/new/:id/:algo"
                            element={
                                <RequireAuth>
                                    <AnimationDetail />
                                </RequireAuth>
                            }
                        />
                        <Route
                            path="/animation/saved/:id"
                            element={
                                <RequireAuth>
                                    <AnimationDetail />
                                </RequireAuth>
                            }
                        />
                        <Route
                            path="/"
                            element={
                                isAuthenticated()
                                    ? <Navigate to="/maps" replace />
                                    : <Navigate to="/login" replace />
                            }
                        />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
};

export default App;


