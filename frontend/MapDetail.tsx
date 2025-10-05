import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link, redirect } from 'react-router-dom';
import Grid from './src/models/Grid';
import { GetMapFromBackend, GetRoutesFromBackend, saveMapToBackend, updateMapInBackend } from './src/services/api';
import Person from './src/models/Person';
import GridComponent from './src/components/GridComponent';
import SVGRoundButton from './src/components/SVGRoundButton';
import './styles/App.css';

const MapDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    if (!id) {
        return <div>ID карты не указан</div>;
    }

    const [grid, setGrid] = useState<Grid | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    // const [mapId, setMapId] = useState<string | null>(null);
    const animationRef = useRef<any>(null);
    const [isLoadingMap, setIsLoadingMap] = useState(false);

    const loadMap = async (mapId: string) => {
        if (isSaving || isLoadingMap) return;
        try {
            setIsLoadingMap(true);
            let newGrid = await GetMapFromBackend(mapId);
            setGrid(newGrid);
        } finally {
            setIsLoadingMap(false);
        }
    }

    const saveMap = async () => {
        if (!grid || isSaving) return;

        setIsSaving(true);
        try {
            await updateMapInBackend(id, grid);
            alert("Карта обновлена");
        } catch (error) {
            console.error(error);
            alert("Ошибка сохранения карты");
        } finally {
            setIsSaving(false);
        }
    };

    const saveMapAs = async () => {
        if (!grid || isSaving) return;
        setIsSaving(true);
        try {
            const generatedMapId = await saveMapToBackend(grid);
            alert("Карта сохранена как новая с ID: " + generatedMapId);
            navigate(`/map/${generatedMapId}`);
        } catch (error) {
            console.error(error);
            alert("Ошибка при сохранении карты как новой");
        } finally {
            setIsSaving(false);
        }
    };

    const goToAnimation = async() => {
        await saveMap();
        navigate("/animation/" + String(id));
    }

    useEffect(
        () => {
            loadMap(id as string);
            return () => {};
        }, [id]
    );

    return (
        <div className="App">
            <div className="controls">
                <button onClick={saveMap} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Map"}
                </button>
                <button onClick={saveMapAs} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Map As"}
                </button>
                <button onClick={goToAnimation}>Start animation</button>
            </div>
            <div className="body">
                <div className="grid-wrapper">
                    {grid && <GridComponent grid={grid} isAnimating={false} currentSteps={{}} completedGoals={{}} />}
                </div>
            </div>
            <div className="back-button-container">
                <SVGRoundButton
                    direction="left"
                    onClick={() => navigate("/maps")}
                    className="svg-round-button"
                />
            </div>
        </div>
    );
};

export default MapDetail;