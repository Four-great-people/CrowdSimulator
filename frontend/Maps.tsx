import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GetMapsFromBackend } from './src/services/api';
import './styles/App.css';
import Grid from './src/models/Grid';

const Maps: React.FC = () => {
    const [mapList, setMaps] = useState<string[]>([]);
    const [isLoadingMaps, setIsLoadingMaps] = useState(false);
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
                    {
                        mapList.map(
                            (mapName) => <button className="blue-button"
                                onClick={() => { handleMapClick(mapName) }}
                                disabled={isLoadingMaps}>{mapName}</button>
                        )
                    }
                </div>
            </div>
        </div>
    );
};

export default Maps;
