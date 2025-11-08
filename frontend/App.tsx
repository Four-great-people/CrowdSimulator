import React, { useState, useEffect, useRef } from 'react';
import './styles/App.css';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Maps from './Maps';
import MapDetail from './MapDetail';
import AnimationDetail from './AnimationDetail';
import NotFound from './src/components/NotFound';


const App: React.FC = () => {
    return (
        <Router>
            <div className="app">
                <main className="app-main">
                    <Routes>
                        <Route path="/maps" element={<Maps />} />
                        <Route path="/map/:id" element={<MapDetail />} />
                        <Route path="/animation/new/:id/:algo" element={<AnimationDetail />} />
                        <Route path="/animation/saved/:id" element={<AnimationDetail />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
};

export default App;
