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
    const [newWidth, setNewWidth] = useState(40);
    const [newHeight, setNewHeight] = useState(22);

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
                const newGrid = createNewGrid();
                setGrid(newGrid);
                setOriginalMapName('Без названия');
                setNewWidth(newGrid.width);
                setNewHeight(newGrid.height);
            } else {
                setIsLoadingMap(true);
                const {grid: newGrid, name} = await GetMapFromBackend(mapId);
                setGrid(newGrid);
                setIsNewMap(false);
                setOriginalMapName(name);
                setMapName(name);
                setNewWidth(newGrid.width);
                setNewHeight(newGrid.height);
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

    const handleResize = () => {
        if (!grid) return;
        
        if (newWidth <= 0 || newHeight <= 0) {
            alert("Размеры должны быть положительными числами");
            return;
        }

        if (newWidth > 150 || newHeight > 150) {
            alert("Максимальный размер 150x150");
            return;
        }

        try {
            const resizedGrid = grid.resize(newWidth, newHeight);
            setGrid(resizedGrid);
        } catch (error) {
            alert("Ошибка при изменении размера сетки");
            console.error(error);
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

    const shouldShowScroll = () => {
        return grid && (grid.width > 40 || grid.height > 22);
    };
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
                <div className={`grid-wrapper ${shouldShowScroll() ? 'scrollable' : ''}`}>
                    {grid && <GridComponent grid={grid} isAnimating={false} currentSteps={{}} completedGoals={{}} editable={true} objectPlacing={currentObject} />}
                </div>
                <div className="side-panel">
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
                    <div className="resize-controls">
                        <h3 className="resize-title">Изменение размера сетки</h3>
                        <div className="size-inputs">
                            <label>
                                Ширина:
                                <input
                                    type='text'
                                    value={newWidth === 0 ? '' : newWidth.toString()}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (/^\d*$/.test(value)) {
                                            if (value === '') {
                                                setNewWidth(0);
                                            } else {
                                                const numValue = parseInt(value, 10);
                                                if (numValue >= 1 && numValue <= 150) {
                                                    setNewWidth(numValue);
                                                }
                                            }
                                        }
                                    }}
                                    placeholder='40'
                                />
                            </label>
                            <label>
                                Высота:
                                <input
                                    type="text"
                                    value={newHeight === 0 ? '' : newHeight.toString()}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (/^\d*$/.test(value)) {
                                            if (value === '') {
                                                setNewHeight(0);
                                            } else {
                                                const numValue = parseInt(value, 10);
                                                if (numValue >= 1 && numValue <= 150) {
                                                    setNewHeight(numValue);
                                                }
                                            }
                                        }
                                    }}
                                    min="0"
                                    max="150"
                                    placeholder='22'
                                />
                            </label>
                        </div>
                        <div className="current-size-info">
                            Текущий размер: {grid?.width} × {grid?.height}
                        </div>
                        <button onClick={handleResize} className="resize-button">
                            Применить новый размер
                        </button>
                        <div className="size-warning">
                            Внимание: При уменьшении размера объекты за пределами новой сетки будут удалены!
                        </div>
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
