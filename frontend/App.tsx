import React, { useState, useEffect, useRef } from 'react';
import './styles/App.css';
import GridComponent from './src/components/GridComponent';
import Grid from './src/models/Grid';
import Person from './src/models/Person';
import { saveMapToBackend, updateMapInBackend, GetRoutesFromBackend, GetMapsFromBackend, GetMapFromBackend } from './src/services/api';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Maps from './Maps';
import MapDetail from './MapDetail';


const App: React.FC = () => {
    return (
        <Router>
            <div className="app">
                <main className="app-main">
                    <Routes>
                        <Route path="/maps" element={<Maps />} />
                        <Route path="/map/:id" element={<MapDetail />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
};

export default App;
