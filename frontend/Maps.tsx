import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    GetMapsFromBackend,
    deleteMapFromBackend,
    GetAnimationsFromBackend,
    deleteAnimationFromBackend,
    MapAnimItem,
    logoutUser,
    getCurrentUser,
} from './src/services/api';

import './styles/App.css';
import Grid from './src/models/Grid';

const Maps: React.FC = () => {
    const [mapList, setMaps] = useState<MapAnimItem[]>([]);
    const [isLoadingMaps, setIsLoadingMaps] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [animationList, setAnimations] = useState<MapAnimItem[]>([]);
    const [busyAnimationId, setBusyAnimationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState<string>('');
    const navigate = useNavigate();
    const location = useLocation();

    const activeTab = location.state?.activeTab || 'maps';

    const setActiveTab = (tab: 'maps' | 'animations') => {
        navigate(location.pathname, { state: { activeTab: tab } });
    };

    const loadMaps = async () => {
        try {
            setIsLoading(true);
            const maps = await GetMapsFromBackend();
            setMaps(maps);
        } catch (error) {
            alert('Ошибка при загрузке карт!');
        } finally {
            setIsLoading(false);
        }
    };

    const loadAnimations = async () => {
        try {
            setIsLoading(true);
            const animations = await GetAnimationsFromBackend();
            setAnimations(animations);
        } catch (error) {
            console.error('Ошибка при загрузке анимаций!');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMapClick = (mapId: string) => {
        navigate(`/map/${mapId}`);
    };

    const handleAnimationClick = (animationId: string) => {
        navigate(`/animation/saved/${animationId}`);
    };

    const deleteAnimation = async (e: React.MouseEvent, animationId: string) => {
        e.stopPropagation();
        if (!confirm('Удалить эту анимацию безвозвратно?')) return;
        try {
            setBusyAnimationId(animationId);
            await deleteAnimationFromBackend(animationId);
            setAnimations(prev => prev.filter(animItem => animItem.id !== animationId));
        } catch (err) {
            console.error(err);
            alert('Не удалось удалить анимацию');
        } finally {
            setBusyAnimationId(null);
        }
    };

    const createNewMap = () => {
        const newGrid = new Grid(40, 22);
        navigate('/map/new', { state: { activeTab: 'maps' } });
    };

    const deleteMap = async (e: React.MouseEvent, mapId: string) => {
        e.stopPropagation();
        if (!confirm('Удалить эту карту безвозвратно?')) return;
        try {
            setBusyId(mapId);
            await deleteMapFromBackend(mapId);
            setMaps(prev => prev.filter(item => item.id !== mapId));
        } catch (err) {
            console.error(err);
            alert('Не удалось удалить карту');
        } finally {
            setBusyId(null);
        }
    };

    const handleLogout = () => {
        logoutUser();
        navigate('/login', { replace: true });
    };

    useEffect(() => {
        const user = getCurrentUser();
        if (user && user.username) {
            setUsername(user.username);
        }
        
        if (activeTab === 'maps') {
            loadMaps();
        } else {
            loadAnimations();
        }
    }, [activeTab]);

    return (
        <div className="maps">
            <div className="tabs">
                {username && (
                    <div className="username-top">
                        {username}
                    </div>
                )}
                <div className="tab-buttons-center">
                    <button
                        className={`tab-button ${activeTab === 'maps' ? 'active' : ''}`}
                        onClick={() => setActiveTab('maps')}
                    >
                        Карты
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'animations' ? 'active' : ''}`}
                        onClick={() => setActiveTab('animations')}
                    >
                        Анимации
                    </button>
                </div>
                <div className="logout-container">
                    <button className="logout-button" onClick={handleLogout}>
                        Выйти
                    </button>
                </div>
            </div>
            <div className="map-list-wrapper">
                {isLoading ? (
                    <div className="loading">Загрузка...</div>
                ) : activeTab === 'maps' ? (
                    <>
                        <div className="map-list">
                            {mapList.map(mapItem => (
                                <div
                                    key={mapItem.id}
                                    className="map-row"
                                >
                                    <button
                                        className="blue-button map-row__title"
                                        disabled={isLoadingMaps || !!busyId}
                                        title={mapItem.name}
                                        onClick={() => handleMapClick(mapItem.id)}
                                    >
                                        <span className="map-name">{mapItem.name}</span>

                                        <span 
                                            className="icon-button delete cross-icon"
                                            aria-label="Удалить карту"
                                            title="Удалить карту"
                                            onClick={e => {
                                                e.stopPropagation();
                                                deleteMap(e, mapItem.id);
                                            }}
                                            style={{
                                                display: 'inline-block',
                                                cursor: 'pointer'
                                            }}
                                        >
                                        </span>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="create-map-button-container">
                            <button
                                className="blue-button map-row__title create-map-button"
                                onClick={createNewMap}
                            >
                                Создать новую карту
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="animation-list">
                        {animationList.length === 0 ? (
                            <div className="empty">Нет сохранённых анимаций</div>
                        ) : (
                            animationList.map(animItem => (
                                <div
                                    key={animItem.id}
                                    className="map-row"
                                    onClick={() => handleAnimationClick(animItem.id)}
                                >
                                    <button
                                        className="blue-button map-row__title"
                                        disabled={!!busyAnimationId}
                                        title={animItem.name}
                                    >
                                        {animItem.name}
                                    </button>
                                    <button
                                        className="icon-button delete"
                                        aria-label="Удалить анимацию"
                                        title="Удалить анимацию"
                                        disabled={busyAnimationId === animItem.id}
                                        onClick={e => deleteAnimation(e, animItem.id)}
                                    >
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Maps;


