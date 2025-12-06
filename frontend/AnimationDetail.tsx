import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Grid from './src/models/Grid';
import { 
  GetMapFromBackend, 
  GetStatisticsFromBackend, 
  GetAnimationFromBackend, 
  saveAnimationToBackend, 
  deleteAnimationFromBackend,
  updateAnimationInBackend
} from './src/services/api';
import NamedPoint from './src/models/NamedPoint';
import GridComponent from './src/components/GridComponent';
import SVGRoundButton from './src/components/SVGRoundButton';
import NotFound from './src/components/NotFound';
import './styles/App.css';
import GistComponent from './src/components/GistComponent';

const AnimationDetail: React.FC = () => {
    const { id, algo } = useParams<{ id: string, algo: string }>();
    const navigate = useNavigate();
    const isSavedAnimation = window.location.pathname.includes('/animation/saved/');
    if (!id || !algo && !isSavedAnimation) {
        return <div>ID карты или алгоритм не указан</div>;
    }
    const [grid, setGrid] = useState<Grid | null>(null);
    const [originalGrid, setOriginalGrid] = useState<Grid | null>(null);
    const [currentSteps, setCurrentSteps] = useState<{ [id: number]: number }>({});
    const [completedGoals, setCompletedGoals] = useState<{ [id: number]: boolean }>({});
    const [isAnimating, setIsAnimating] = useState(false);
    const isAnimatingRef = useRef(isAnimating);
    const [animationCompleted, setAnimationCompleted] = useState(false);
    const [animationPaused, setAnimationPaused] = useState(false);
    const animationPausedRef = useRef(animationPaused);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const animationRef = useRef<any>(null);
    const [isLoadingMap, setIsLoadingMap] = useState(false);
    const [isLoadedMap, setIsLoadedMap] = useState(false);
    const [idealTime, setIdealTime] = useState(undefined);
    const [validTime, setValidTime] = useState(undefined);
    const [participantsNumber, setParticipantsNumber] = useState<number>(0);
    const [routes, setRoutes] = useState<any[]>([]);
    const [showStatistics, setShowStatistics] = useState(false);
    const [isAnimationSaved, setIsAnimationSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [animationName, setAnimationName] = useState('');
    const [originalAnimationName, setOriginalAnimationName] = useState('');
    const [savedAnimationId, setSavedAnimationId] = useState<string | null>(null);

    useEffect(() => {
        loadContent(id);
    }, [id]);

    useEffect(() => {
        animationPausedRef.current = animationPaused;
    }, [animationPaused]);

    useEffect(() => {
        isAnimatingRef.current = isAnimating;
    }, [isAnimating]);

    const loadContent = async (contentId: string) => {
        if (isAnimating || isLoadingMap) return;
        try {
            setIsLoadingMap(true);
            setError(null);
            
            if (isSavedAnimation) {
                const { grid: animationGrid, routes: animationRoutes, statistics: animationStats, name: name } = await GetAnimationFromBackend(contentId);
                setGrid(animationGrid);
                setOriginalGrid(animationGrid.clone());
                setRoutes(animationRoutes || []);
                setIdealTime(animationStats?.ideal);
                setValidTime(animationStats?.valid);
                setParticipantsNumber(animationRoutes.length);
                setShowStatistics(true);
                setIsAnimationSaved(true);
                setOriginalAnimationName(name || "Без названия");
                setAnimationName(name || "Без названия");
                startSavedAnimation(animationGrid, animationRoutes, animationStats);
            } else {
                let {grid: newGrid, name: name} = await GetMapFromBackend(contentId);
                setGrid(newGrid);
                setOriginalGrid(newGrid.clone());
                const initialSteps: { [id: number]: number } = {};
                const initialCompleted: { [id: number]: boolean } = {};
                setCurrentSteps(initialSteps);
                setCompletedGoals(initialCompleted);
                setAnimationCompleted(false);
                setShowStatistics(false);
                setIsLoadedMap(true);
                setIsAnimationSaved(false);
                setOriginalAnimationName("Без названия");
            }
        } catch (error) {
            console.log(error);
            setError('Анимация не найдена');
        } finally {
            setIsLoadingMap(false);
        }
    }

    const startAnimation = async () => {
        if (animationCompleted) {
            alert("Анимация завершена");
            return;
        }
        if (!grid || isAnimating || !algo) return;

        setIsAnimating(true);
        setAnimationCompleted(false);
        setShowStatistics(false);

        try {
            const statisticsFromBackend = await GetStatisticsFromBackend(id, algo);
            setRoutes(statisticsFromBackend.routes || []);
            
            grid.reset();
            const gridCopy = grid.clone();
            gridCopy.groups.forEach((group, groupIndex) => {
                group.person_ids.forEach((personId, personIndex) => {
                    const person = new NamedPoint(personId, group.start_position);
                    const success = gridCopy.addPerson(person);
                });
            });
            setGrid(gridCopy);
            const persons: NamedPoint[] = [];
            gridCopy.cells.forEach(row => {
                row.forEach(cell => {
                    if (cell.persons.length > 0) {
                        persons.push(...cell.persons);
                    }
                });
            });

            setParticipantsNumber(statisticsFromBackend["routes"].length)
            setIdealTime(statisticsFromBackend["ideal"])
            setValidTime(statisticsFromBackend["valid"])
            executeSteps(gridCopy, persons, 0, statisticsFromBackend["routes"]);

        } catch (error) {
            console.error('Ошибка при работе с бэкендом:', error);
            setIsAnimating(false);
        }
    };

    const saveAnimation = async () => {
        if (!originalGrid || !grid || isSaving) return;

        if (isAnimationSaved) {
                await renameAnimation();
                return;
        }

        setIsSaving(true);
        try {
            const nameToSave = animationName.trim() || originalAnimationName;
            
            const gridToSave = originalGrid.clone();

            const statistics = {
                valid: validTime,
                ideal: idealTime
            };
            const animationId = await saveAnimationToBackend(gridToSave, routes, statistics, nameToSave);
            alert(`Анимация сохранена с именем: ${nameToSave}`);
            setIsAnimationSaved(true);
            setOriginalAnimationName(nameToSave);
            setSavedAnimationId(animationId);
        } catch (error) {
            console.error('Ошибка сохранения анимации:', error);
            alert('Ошибка сохранения анимации');
        } finally {
            setIsSaving(false);
        }
    };
    
    const removeAnimation = async () => {
        if (!isSavedAnimation || !id) return;
        if (!confirm('Удалить эту анимацию? Это действие необратимо.')) return;
        try {
            setIsDeleting(true);
            await deleteAnimationFromBackend(id);
            navigate('/maps', { state: { activeTab: 'animations' } });
        } catch (e) {
            alert('Не удалось удалить анимацию');
            console.error(e);
        } finally {
            setIsDeleting(false);
        }
    };
    
    const startSavedAnimation = async (savedGrid: Grid, savedRoutes: any[], savedStatistics: any) => {
        if (!savedGrid || isAnimatingRef.current) return;

        setIsAnimating(true);
        setAnimationCompleted(false);

        try {
            savedGrid.reset();
            const gridCopy = savedGrid.clone();
            
            gridCopy.groups.forEach(group => {
                group.person_ids.forEach(personId => {
                    const person = new NamedPoint(personId, group.start_position);
                    gridCopy.addPerson(person);
                });
            });
            setGrid(gridCopy);

            const persons: NamedPoint[] = [];
            gridCopy.cells.forEach(row => {
                row.forEach(cell => {
                    if (cell.persons.length > 0) {
                        persons.push(...cell.persons);
                    }
                });
            });
            
            setParticipantsNumber(savedRoutes.length);
            setIdealTime(savedStatistics.ideal);
            setValidTime(savedStatistics.valid);
            
            executeSteps(gridCopy, persons, 0, savedRoutes);

        } catch (error) {
            console.error('Ошибка при воспроизведении анимации:', error);
            setIsAnimating(false);
        }
    };

    const renameAnimation = async () => {
        try {
            const nameToSave = animationName.trim() || originalAnimationName;
            const animationIdToUpdate = savedAnimationId || id;
            await updateAnimationInBackend(animationIdToUpdate, nameToSave);
            setOriginalAnimationName(nameToSave);
            alert('Анимация переименована');
        } catch (error) {
            console.error('Ошибка переименования анимации:', error);
            alert('Ошибка переименования анимации');
        };
    }

    const restartAnimation = () => {
        if (isAnimating && !animationPaused) return;
        if (animationPaused) {
            clearTimeout(animationRef.current);
            setAnimationPaused(false);
            setIsAnimating(false);
            isAnimatingRef.current = false;
            animationPausedRef.current = false;
        }

        if (!originalGrid || routes.length === 0) {
            if (!isSavedAnimation) {
                startAnimation();
            }
            return;
        }

        setCurrentSteps({});
        setCompletedGoals({});
        setAnimationCompleted(false);
        setShowStatistics(false);

        const baseGrid = originalGrid.clone();
        const stats = { ideal: idealTime, valid: validTime };

        const freshRoutes = routes.map((r) => ({
            id: r.id,
            route: Array.isArray(r.route) ? [...r.route] : r.route,
        }));

        setRoutes(freshRoutes);

        startSavedAnimation(baseGrid, freshRoutes, stats);
    };

    const isRouteCompleted = (route: any): boolean => {
        return !route || route.animationIndex !== undefined && route.route.length <= route.animationIndex
    }

    const getTimeToWait = (direction: any): number => {
        switch (direction) {
            case 'WAIT':
            case 'RIGHT':
            case 'LEFT':
            case 'UP':
            case 'DOWN': return 1;
            case 'RIGHT_UP':
            case 'LEFT_UP':
            case 'RIGHT_DOWN':
            case 'LEFT_DOWN': return 2;
            default:
                throw new Error(`Unsupported direction ${direction}!`);
        }
    }

    const prepareRoute = (route: any) => {
        if (route !== undefined && route.animationIndex === undefined) {
            route.animationIndex = 0
            if (route.route.length > 0) {
                route.tactToWait = getTimeToWait(route.route[route.animationIndex])
            }
        }
    }

    const transformToNextRouteState = (route: any, newPosition: {
        x: number;
        y: number;
    }) => {
        if (route.tactToWait == 0) {
            const direction = route.route[route.animationIndex];
            route.animationIndex += 1;
            if (!isRouteCompleted(route)) {
                route.tactToWait = getTimeToWait(route.route[route.animationIndex]) + 1
            }
            switch (direction) {
                case 'RIGHT': newPosition.x += 1; break;
                case 'LEFT': newPosition.x -= 1; break;
                case 'UP': newPosition.y += 1; break;
                case 'DOWN': newPosition.y -= 1; break;
                case 'RIGHT_UP': newPosition.x += 1; newPosition.y += 1; break;
                case 'LEFT_UP': newPosition.x -= 1; newPosition.y += 1; break;
                case 'RIGHT_DOWN': newPosition.x += 1; newPosition.y -= 1; break;
                case 'LEFT_DOWN': newPosition.x -= 1; newPosition.y -= 1; break;
            }
        }
        route.tactToWait -= 1;
    }

    const executeSteps = (currentGrid: Grid, persons: NamedPoint[], stepIndex: number, routes: any[]) => {
        if (!animationPausedRef.current) {
            const allRoutesCompleted = persons.every(person => {
                const route = routes.find(r => r.id === person.id);
                prepareRoute(route);
                return isRouteCompleted(route);
            });

            if (allRoutesCompleted) {
                setIsAnimating(false);
                setAnimationCompleted(true);
                const total = persons.length;
                if (!isSavedAnimation) {
                    setParticipantsNumber(total);
                    setShowStatistics(true);
                }
                return;
            }
            const newGrid = currentGrid.clone();
            const updatedPersons: NamedPoint[] = [];
            const updatedSteps = { ...currentSteps };
            const updatedCompleted = { ...completedGoals };

            persons.forEach(person => {
                const route = routes.find(r => r.id === person.id);
                prepareRoute(route);
                if (!isRouteCompleted(route)) {
                    const newPosition = { ...person.position };
                    transformToNextRouteState(route, newPosition);
                    const targetCell = currentGrid.getCell(newPosition.x, newPosition.y);
                    if (targetCell) {
                        const oldCell = newGrid.getCell(person.position.x, person.position.y);
                        if (oldCell) {
                            oldCell.persons = oldCell.persons.filter(p => p.id !== person.id);
                        }

                        const newPerson = new NamedPoint(person.id, newPosition, person.reachedGoal);
                        if (targetCell.hasGoal()) {
                            newPerson.reachedGoal = true;
                            updatedCompleted[person.id] = true;

                            const goalCell = newGrid.getCell(targetCell.x, targetCell.y);
                            if (goalCell) {
                                goalCell.removeGoal();
                            }
                        }
                        else {
                            newGrid.markCell(newPosition.x, newPosition.y, 1);
                        }

                        updatedPersons.push(newPerson);
                        newGrid.addPerson(newPerson);
                        updatedSteps[person.id] = stepIndex + 1;
                    } else {
                        const newPerson = new NamedPoint(person.id, person.position, person.reachedGoal);
                        newPerson.reachedGoal = person.reachedGoal;
                        updatedPersons.push(newPerson);
                        newGrid.addPerson(newPerson);
                    }
                } else {
                    const newPerson = new NamedPoint(person.id, person.position, person.reachedGoal);
                    newPerson.reachedGoal = person.reachedGoal;
                    updatedPersons.push(newPerson);
                    newGrid.addPerson(newPerson);
                }
        });
        newGrid.groups.forEach(group => {
            const cell = newGrid.getCell(group.start_position.x, group.start_position.y);
            if (cell) {
                const personsInGroup = cell.persons.filter(p => 
                    group.person_ids.includes(p.id)
                ).length;
                group.total_count = personsInGroup;
                
                if (group.total_count <= 0) {
                    if (typeof (newGrid as any).removeGroupAt === 'function') {
                        (newGrid as any).removeGroupAt(group.start_position.x, group.start_position.y);
                    }
                }
            }
        });
        

            animationRef.current = setTimeout(() => {
                let newStepIndex = stepIndex;

                newStepIndex += 1;
                setGrid(newGrid);
                setCurrentSteps(updatedSteps);
                setCompletedGoals(updatedCompleted);

                executeSteps(newGrid, updatedPersons, newStepIndex, routes);
            }, 200);
        } else {
            animationRef.current = setTimeout(() => {
                let newStepIndex = stepIndex;
                executeSteps(currentGrid, persons, newStepIndex, routes);
            }, 200);
        }
    };

    const changeAnimationPauseState = () => {
        if (animationCompleted) {
            return;
        }
        setAnimationPaused(!animationPaused);
    }

    useEffect(() => {
        return () => {
            if (animationRef.current) {
                clearTimeout(animationRef.current);
            }
        };
    }, []);

    useEffect(
        () => {
            if (isLoadedMap) {
                startAnimation();
            }
        }, [id, isLoadedMap]
    );

    if (error) {
        return <NotFound />;
    }

    const statisticsFormatString = (timeObj: any) => {
        if (!timeObj) {
            throw new Error("Statistic object is undefined"); 
        }
        else if (timeObj.value == null) return "маршрут невозможно построить";
        const reached = participantsNumber - (timeObj.problematic);
        return `${timeObj.value} с\nдошло ${reached} из ${participantsNumber}`;
    };
    const shouldShowScroll = () => {
        return grid && (grid.width > 40 || grid.height > 22);
    };


    return (
        <div className="App">
            <div className="animation-controls">
                {(
                    <div className="name-input-container">
                        <input
                            type="text"
                            value={animationName}
                            onChange={(e) => setAnimationName(e.target.value)}
                            placeholder="Введите название анимации"
                            className="name-input"
                            maxLength={35}
                        />
                    </div>
                )}
                {(
                    <button 
                        onClick={saveAnimation} 
                        disabled={isSaving}
                        className="save-animation-btn"
                    >
                        {isSaving ? "Сохраняется..." :
                        isAnimationSaved ? "Переименовать" : "Сохранить анимацию"}
                    </button>
                )}

                {isSavedAnimation && (
                    <button
                        onClick={removeAnimation}
                        disabled={isDeleting}
                        style={{ color: '#fff', background: '#d32f2f' }}
                    >
                        {isDeleting ? "Удаляется..." : "Удалить анимацию"}
                    </button>
                )}

                {(
                    <button
                        onClick={restartAnimation}
                        disabled={!animationCompleted && !animationPaused}
                        className="save-animation-btn"
                    >
                        {animationPaused ? "Сбросить анимацию" : "Повторить анимацию"}
                    </button>
                )}
                {(
                    <button
                        onClick={changeAnimationPauseState}
                        className="save-animation-btn"
                        disabled={animationCompleted}
                    >
                        {animationPaused ? "Возобновить анимацию" : "Приостановить анимацию"}
                    </button>
                )}
            </div>

            <div className="body">
                <div className={`grid-wrapper ${shouldShowScroll() ? 'scrollable' : ''}`}>
                    {grid && <GridComponent grid={grid} isAnimating={isAnimating} currentSteps={currentSteps} completedGoals={completedGoals} objectPlacing='' />}
                </div>
                <div className="text-table-wrapper">
                    {showStatistics && <div className="text-table">
                        <div className="text-table__title">Время движения</div>
                        <ul className="text-table__list">
                            <li>Оптимальное время: {statisticsFormatString(idealTime)}</li>
                            <li>Фактическое время: {statisticsFormatString(validTime)}</li>
                        </ul>
                    </div>}
                    <div className="gist-wrapper">
                        {grid && <GistComponent maxSteps={grid.maxTicks} />}
                    </div>
                </div>
            </div>
            
            <div className="back-button-container">
                <SVGRoundButton
                    direction="left"
                    onClick={() => isSavedAnimation ? navigate("/maps", { state: { activeTab: "animations" } }) : navigate("/map/" + String(id), { state: { activeTab: "maps" } })}
                    className="svg-round-button"
                />
            </div>
        </div>
    );
};//

export default AnimationDetail;