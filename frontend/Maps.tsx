import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GetMapsFromBackend, deleteMapFromBackend } from './src/services/api';
import './styles/App.css';
import Grid from './src/models/Grid';

const Maps: React.FC = () => {
    const [mapList, setMaps] = useState<string[]>([]);
    const [isLoadingMaps, setIsLoadingMaps] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const navigate = useNavigate();

    const loadMaps = async () => {
        try {
            setIsLoadingMaps(true);
            const maps = await GetMapsFromBackend();
            setMaps(maps);
        } catch (error) {
            alert("Ошибка при загрузке карт!")
        } finally {
            setIsLoadingMaps(false);
        }
    };

    const handleMapClick = (mapId: string) => {
        navigate(`/map/${mapId}`);
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

    useEffect(
        () => {
            loadMaps()
        }, []
    );

    return (
        <div className="maps">
            <div className="map-list-wrapper">
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
            </div>
        </div>
    );
};
export default Maps;
