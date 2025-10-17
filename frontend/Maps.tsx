import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
<<<<<<< HEAD
import { GetMapsFromBackend, deleteMapFromBackend } from './src/services/api';
=======
import { GetMapsFromBackend, GetAnimationsFromBackend } from './src/services/api';
>>>>>>> e56f862 (valid frontend and db animation saving)
import './styles/App.css';
import Grid from './src/models/Grid';

const Maps: React.FC = () => {
    const [mapList, setMaps] = useState<string[]>([]);
<<<<<<< HEAD
    const [isLoadingMaps, setIsLoadingMaps] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
=======
    const [animationList, setAnimations] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'maps' | 'animations'>('maps');
    const [isLoading, setIsLoading] = useState(false);
>>>>>>> e56f862 (valid frontend and db animation saving)
    const navigate = useNavigate();

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

    const createNewMap = () => {
        const newGrid = new Grid(40, 22);
        navigate('/map/new');       
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
<<<<<<< HEAD
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
=======
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
                            {mapList.map((mapId) => (
                                <button 
                                    key={mapId}
                                    className="blue-button"
                                    onClick={() => handleMapClick(mapId)}
                                    disabled={isLoading}
                                >
                                    Карта {mapId}
                                </button>
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
                            animationList.map((animationId) => (
                                <button 
                                    key={animationId}
                                    className="blue-button"
                                    onClick={() => handleAnimationClick(animationId)}
                                    disabled={isLoading}
                                >
                                    Анимация {animationId}
                                </button>
                            ))
                        )}
                    </div>
                )}
>>>>>>> e56f862 (valid frontend and db animation saving)
            </div>
        </div>
    );
};
export default Maps;
