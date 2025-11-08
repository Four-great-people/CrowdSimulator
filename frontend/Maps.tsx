import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  GetMapsFromBackend, 
  deleteMapFromBackend, 
  GetAnimationsFromBackend,
  deleteAnimationFromBackend
} from './src/services/api';

import './styles/App.css';
import Grid from './src/models/Grid';

const Maps: React.FC = () => {
    const [mapList, setMaps] = useState<string[]>([]);
    const [isLoadingMaps, setIsLoadingMaps] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [busyAnimationId, setBusyAnimationId] = useState<string | null>(null);
    const [animationList, setAnimations] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
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
            alert("Ошибка при загрузке карт!")
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
            console.error("Ошибка при загрузке анимаций!");
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
            setAnimations(prev => prev.filter(id => id !== animationId));
        } catch (err) {
            console.error(err);
            alert('Не удалось удалить анимацию');
        } finally {
            setBusyAnimationId(null);
        }
    };

    const createNewMap = () => {
        const newGrid = new Grid(40, 22);
        navigate('/map/new', { state: { activeTab: "maps" } });       
    };
      
    const deleteMap = async (e: React.MouseEvent, mapId: string) => {
        e.stopPropagation(); 
        if (!confirm('Удалить эту карту безвозвратно?')) return;
        try {
            setBusyId(mapId);
            await deleteMapFromBackend(mapId);
            setMaps(prev => prev.filter(id => id !== mapId));
        } catch (err) {
          console.error(err);
          alert('Не удалось удалить карту');
        } finally {
          setBusyId(null);
        }
    };

    useEffect(() => {
        if (activeTab === 'maps') {
            loadMaps();
        } else {
            loadAnimations();
        }
    }, [activeTab]);

    return (
        <div className="maps">
            <div className="tabs">
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
            <div className="map-list-wrapper">
                {isLoading ? (
                    <div className="loading">Загрузка...</div>
                ) : activeTab === 'maps' ? (
                    <>
                        <div className="create-map-button-container">
                            <button 
                                className="blue-button create-map-button"
                                onClick={createNewMap}
                            >
                                + Создать новую карту
                            </button>
                        </div>
                        <div className="map-list">
                            {mapList.map(mapId => (
                                <div key={mapId} className="map-row" onClick={() => handleMapClick(mapId)}>
                                    <button
                                        className="blue-button map-row__title"
                                        disabled={isLoadingMaps || !!busyId}
                                        title={mapId}
                                    >
                                        {mapId}
                                    </button>

                                    <button
                                        className="icon-button delete"
                                        aria-label="Удалить карту"
                                        title="Удалить карту"
                                        disabled={busyId === mapId}
                                        onClick={e => deleteMap(e, mapId)}
                                    >
                                        🗑
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="animation-list">
                        {animationList.length === 0 ? (
                            <div className="empty-state">
                                Нет сохраненных анимаций
                            </div>
                        ) : (
                            animationList.map(animationId => ( 
                                <div key={animationId} className="map-row" onClick={() => handleAnimationClick(animationId)}>
                                    <button
                                        className="blue-button map-row__title"
                                        disabled={isLoading || !!busyAnimationId}
                                        title={animationId}
                                    >
                                        Анимация {animationId}
                                    </button>
                                    <button
                                        className="icon-button delete"
                                        aria-label="Удалить анимацию"
                                        title="Удалить анимацию"
                                        disabled={busyAnimationId === animationId}
                                        onClick={e => deleteAnimation(e, animationId)}
                                    >
                                        🗑
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
