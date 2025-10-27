import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate} from 'react-router-dom';
import Grid from './src/models/Grid';
import { GetMapFromBackend, saveMapToBackend, updateMapInBackend, deleteMapFromBackend } from './src/services/api';
import GridComponent from './src/components/GridComponent';
import SVGRoundButton from './src/components/SVGRoundButton';
import NotFound from './src/components/NotFound';
import './styles/App.css';

const MapDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    if (!id) {
        return <div>ID карты не указан</div>;
    }

    const [grid, setGrid] = useState<Grid | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isNewMap, setIsNewMap] = useState(false);
    // const [mapId, setMapId] = useState<string | null>(null);
    const animationRef = useRef<any>(null);
    const [isLoadingMap, setIsLoadingMap] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createNewGrid = () => {
        return new Grid(40, 22);
    };

    const loadMap = async (mapId: string) => {
        if (isSaving || isLoadingMap) return;
        try {
            setError(null);
            if (mapId =='new') {
                setIsNewMap(true);
                setGrid(createNewGrid());
            } else {
                setIsLoadingMap(true);
                let newGrid = await GetMapFromBackend(mapId);
                setGrid(newGrid);
            }
        } catch (error) {
            setError('Карта не найдена');
            console.log(error);
        } finally {
            setIsLoadingMap(false);
        }
    }

    const saveMap = async () => {
        if (!grid || isSaving) return;

        setIsSaving(true);
        try {
            if (isNewMap) {
                const generatedMapId = await saveMapToBackend(grid);
                alert("Новая карта сохранена с ID: " + generatedMapId);
                setIsNewMap(false);
                navigate(`/map/${generatedMapId}`);
            } else {
                await updateMapInBackend(id, grid);
                alert("Карта обновлена");
            }
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
        if (isNewMap) {
            setIsSaving(true);
            try {
                if (!grid) return;
                const generatedMapId = await saveMapToBackend(grid);
                alert("Карта сохранена с ID: " + generatedMapId);
                navigate("/animation/new/" + generatedMapId);
            } catch (error) {
                console.error(error);
                alert("Ошибка сохранения карты");
            } finally {
                setIsSaving(false);
            }
        } else {
            await saveMap();
            navigate("/animation/new/" + String(id));
        }
    }
    
    const deleteMap = async () => {
        if (!id || id === 'new') return;
        if (!confirm('Удалить эту карту? Это действие необратимо.')) return;

        try {
            setIsDeleting(true);
            await deleteMapFromBackend(id);
            alert('Карта удалена');
            navigate('/maps');
        } catch (err) {
            console.error(err);
            alert('Ошибка удаления карты');
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(
        () => {
            loadMap(id as string);
            return () => {};
        }, [id]
    );

    if (error) {
        return <NotFound />;
    }

    return (
        <div className="App">
            <div className="controls">
                <button onClick={saveMap} disabled={isSaving}>
                    {isSaving ? "Сохраняется..." : "Сохранить карту"}
                </button>
                <button onClick={saveMapAs} disabled={isSaving}>
                    {isSaving ? "Сохраняется..." : "Сохранить как"}
                </button>
                <button onClick={goToAnimation}>Начать анимацию</button>

                {id !== 'new' && (
                    <button onClick={deleteMap} disabled={isDeleting || isSaving} style={{ marginLeft: 8, color: '#fff', background: '#d32f2f' }}>
                        Удалить карту
                    </button>
                )}
            </div>
            <div className="body">
                <div className="grid-wrapper">
                    {grid && <GridComponent grid={grid} isAnimating={false} currentSteps={{}} completedGoals={{}} editable={true} />}
                </div>
            </div>
            <div className="back-button-container">
                <SVGRoundButton
                    direction="left"
                    onClick={() => navigate("/maps", { state: { activeTab: "maps" } })}
                    className="svg-round-button"
                />
            </div>
        </div>
    );
};

export default MapDetail;
