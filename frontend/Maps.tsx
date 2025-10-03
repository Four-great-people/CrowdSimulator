import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GetMapsFromBackend } from './src/services/api';
import './styles/App.css';

const Maps: React.FC = () => {
    const [mapList, setMaps] = useState<string[]>([]);
    const [isLoadingMaps, setIsLoadingMaps] = useState(false);
    const navigate = useNavigate();

    const loadMaps = async () => {
        try {
            setIsLoadingMaps(true);
            const maps = await GetMapsFromBackend();
            setMaps(maps);
        } finally {
            setIsLoadingMaps(false);
        }
    };

    const handleMapClick = (mapId: string) => {
        navigate(`/map/${mapId}`);
    };

    useEffect(
        () => {
            loadMaps()
        }, []
    );

    return (
        <div className="maps">
            <div className="map-list-wrapper">
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
