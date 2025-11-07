import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useAsyncError} from 'react-router-dom';
import Grid from './src/models/Grid';
import { GetMapFromBackend, saveMapToBackend, updateMapInBackend, deleteMapFromBackend } from './src/services/api';
import GridComponent from './src/components/GridComponent';
import SVGRoundButton from './src/components/SVGRoundButton';
import NotFound from './src/components/NotFound';
import './styles/App.css';

interface Algorithm {
  title: string;
  description: string;
}

const MapDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    if (!id) {
        return <div>ID карты не указан</div>;
    }

    const [grid, setGrid] = useState<Grid | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isNewMap, setIsNewMap] = useState(false);
    const [mapName, setMapName] = useState('');
    const [originalMapName, setOriginalMapName] = useState('');
    const [showNameInput, setShowNameInput] = useState(false);
    // const [mapId, setMapId] = useState<string | null>(null);
    const animationRef = useRef<any>(null);
    const [isLoadingMap, setIsLoadingMap] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const algorithmsSupported: Algorithm[] = [
        {title: "dense", description: "Считать с учётом пересечений"},
        {title: "simple", description: "Считать без учёта пересечений"},
        {title: "random", description: "Считать случайный маршрут"},
    ];

    const [selectedAlgo, setSelectedAlgo] = useState<Algorithm>(algorithmsSupported[0]);
    
    const objectTypes: string[] = ["border", "person", "goal"];
    const [currentObject, setCurrentObject] = useState("border");

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
                setOriginalMapName('Без названия');
            } else {
                setIsLoadingMap(true);
                const {grid: newGrid, name} = await GetMapFromBackend(mapId);
                setGrid(newGrid);
                setIsNewMap(false);
                setOriginalMapName(name);
                setMapName(name);
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

        const nameToSave = mapName.trim() || originalMapName;
        setOriginalMapName(nameToSave);

        setIsSaving(true);
        try {
            if (isNewMap) {
                const generatedMapId = await saveMapToBackend(grid, nameToSave);
                alert("Новая карта сохранена с именем: " + nameToSave);
                setIsNewMap(false);
                navigate(`/map/${generatedMapId}`);
            } else {
                await updateMapInBackend(id, grid, nameToSave);
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

        const nameToSave = mapName.trim() || originalMapName;
        setOriginalMapName(nameToSave);

        setIsSaving(true);
        try {
            const generatedMapId = await saveMapToBackend(grid, nameToSave);
            alert("Карта сохранена с именем: " + nameToSave);
            setIsNewMap(false);
            navigate(`/map/${generatedMapId}`);
        } catch (error) {
            console.error(error);
            alert("Ошибка при сохранении карты как новой");
        } finally {
            setIsSaving(false);
        }
    };

    const goToAnimation = async() => {
        const nameToSave = mapName.trim() || originalMapName;

        if (isNewMap) {
            setIsSaving(true);
            try {
                if (!grid) return;
                const generatedMapId = await saveMapToBackend(grid, nameToSave);
                alert("Карта сохранена с именем: " + nameToSave);
                navigate("/animation/new/" + generatedMapId + "/" + selectedAlgo.title);
            } catch (error) {
                console.error(error);
                alert("Ошибка сохранения карты");
            } finally {
                setIsSaving(false);
            }
        } else {
            await saveMap();
            navigate("/animation/new/" + String(id) + "/" + selectedAlgo.title);
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

    const onObjectClick = async(object: string) => {
        setCurrentObject(object);
    };

    useEffect(
        () => {
            loadMap(id as string);
            return () => {};
        }, [id]
    );

    const handleItemClick = (item: Algorithm) => {
        setSelectedAlgo(item);
    };
    if (error) {
        return <NotFound />;
    }

    return (
        <div className="App">
            <div className="controls">
                <div className="name-input-container">
                        <input
                            type="text"
                            value={mapName}
                            onChange={(e) => setMapName(e.target.value)}
                            placeholder="Введите название карты"
                            className="name-input"
                            disabled={isSaving}
                            maxLength={35}
                        />
                </div>
                <button onClick={saveMap} disabled={isSaving}>
                    {isSaving ? "Сохраняется..." : "Сохранить карту"}
                </button>
                <button onClick={saveMapAs} disabled={isSaving}>
                    {isSaving ? "Сохраняется..." : "Сохранить как"}
                </button>
                <button onClick={goToAnimation}>Начать анимацию</button>
                {objectTypes.map((type) =>
                    <button disabled={type == currentObject} key={type}>
                        <img src={"/" + type + ".png"} onClick={() => onObjectClick(type)} width="30" height="30"></img>
                    </button>
                )}
                {id !== 'new' && (
                    <button onClick={deleteMap} disabled={isDeleting || isSaving} style={{ marginLeft: 8, color: '#fff', background: '#d32f2f' }}>
                        Удалить карту
                    </button>
                )}
            </div>
            <div className="body">
                <div className="grid-wrapper">
                    {grid && <GridComponent grid={grid} isAnimating={false} currentSteps={{}} completedGoals={{}} editable={true} objectPlacing={currentObject} />}
                </div>
                <div className="algo-list-container">
                    <h2 className="algo-list-title">Выберите алгоритм:</h2>
                    <div className="algo-list">
                        {algorithmsSupported.map((item) => (
                        <div
                            className={`algo-item`}
                            onClick={() => handleItemClick(item)}>
                            <div className="algo-item-content">
                            <p className={selectedAlgo.title === item.title ? "algo-item-title-selected" : "algo-item-title"}>{item.description}</p>
                            </div>
                        </div>
                        ))}
                    </div>
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
