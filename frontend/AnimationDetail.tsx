import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Grid from './src/models/Grid';
import { 
  GetMapFromBackend, 
  GetStatisticsFromBackend, 
  GetAnimationFromBackend, 
  saveAnimationToBackend, 
  deleteAnimationFromBackend
} from './src/services/api';

import Person from './src/models/Person';
import GridComponent from './src/components/GridComponent';
import SVGRoundButton from './src/components/SVGRoundButton';
import NotFound from './src/components/NotFound';
import './styles/App.css';

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
    const [animationCompleted, setAnimationCompleted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    // const [mapId, setMapId] = useState<string | null>(null);
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

    useEffect(() => {
        loadContent(id);
    }, [id]);

    const loadContent = async (contentId: string) => {
        if (isAnimating || isLoadingMap) return;
        try {
            setIsLoadingMap(true);
            setError(null);
            
            if (isSavedAnimation) {
                const { grid: animationGrid, routes: animationRoutes, statistics: animationStats } = await GetAnimationFromBackend(contentId);
                setGrid(animationGrid);
                setOriginalGrid(animationGrid.clone());
                setRoutes(animationRoutes || []);
                setIdealTime(animationStats?.ideal);
                setValidTime(animationStats?.valid);
                setParticipantsNumber(animationRoutes.length);
                setShowStatistics(true);
                setIsAnimationSaved(true);

                startSavedAnimation(animationGrid, animationRoutes, animationStats);
            } else {
                let newGrid = await GetMapFromBackend(contentId);
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
        if (!grid || isAnimating) return;

        setIsAnimating(true);
        setAnimationCompleted(false);
        setShowStatistics(false);

        try {
            const statisticsFromBackend = await GetStatisticsFromBackend(id, algo);
            setRoutes(statisticsFromBackend.routes || []);
            grid.reset();
            const gridCopy = grid.clone();
            setGrid(gridCopy);

            const persons: Person[] = [];
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
        if (!originalGrid || !grid || isSaving || !idealTime || !validTime || !routes || routes.length === 0) return;

        if (isAnimationSaved) {
                alert("Анимация уже сохранена");
                return;
        }

        setIsSaving(true);
        try {
            const statistics = {
                valid: validTime,
                ideal: idealTime
            };
            const animationId = await saveAnimationToBackend(originalGrid, routes, statistics);
            alert(`Анимация сохранена с ID: ${animationId}`);
            setIsAnimationSaved(true);
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
        if (!savedGrid || isAnimating) return;

        setIsAnimating(true);
        setAnimationCompleted(false);

        try {
            savedGrid.reset();
            const gridCopy = savedGrid.clone();
            setGrid(gridCopy);

            const persons: Person[] = [];
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

    const isRouteCompleted = (route: any): boolean => {
        if (route) {
            console.log(`${route.route.length} ${route.animationIndex} ${route.route}`)
        }
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

    const executeSteps = (currentGrid: Grid, persons: Person[], stepIndex: number, routes: any[]) => {
        const allRoutesCompleted = persons.every(person => {
            const route = routes.find(r => r.id === person.id);
            prepareRoute(route);
            return isRouteCompleted(route);
        });

        if (allRoutesCompleted) {
            setIsAnimating(false);
            setAnimationCompleted(true);
            if (!isSavedAnimation) {
                setShowStatistics(true);
            }
            return;
        }

        const newGrid = currentGrid.clone();
        newGrid.addTick();
        const updatedPersons: Person[] = [];
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

                    const newPerson = new Person(person.id, newPosition, person.goal, person.reachedGoal);

                    if (newPosition.x === person.goal.x && newPosition.y === person.goal.y) {
                        newPerson.reachedGoal = true;
                        updatedCompleted[person.id] = true;

                        const goalCell = newGrid.getCell(person.goal.x, person.goal.y);
                        if (goalCell) {
                            goalCell.removeGoal();
                        }
                    }
                    else {
                        newGrid.markCell(newPosition.x, newPosition.y);
                    }

                    updatedPersons.push(newPerson);
                    newGrid.addPerson(newPerson);
                    updatedSteps[person.id] = stepIndex + 1;
                } else {
                    const newPerson = new Person(person.id, person.position, person.goal, person.reachedGoal);
                    newPerson.reachedGoal = person.reachedGoal;
                    updatedPersons.push(newPerson);
                    newGrid.addPerson(newPerson);
                }
            } else {
                const newPerson = new Person(person.id, person.position, person.goal, person.reachedGoal);
                newPerson.reachedGoal = person.reachedGoal;
                updatedPersons.push(newPerson);
                newGrid.addPerson(newPerson);
            }
        });

        animationRef.current = setTimeout(() => {
            setGrid(newGrid);
            setCurrentSteps(updatedSteps);
            setCompletedGoals(updatedCompleted);

            executeSteps(newGrid, updatedPersons, stepIndex + 1, routes);
        }, 200);
    };

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


    const statisticsFormatString = (n: any) => {
        if (n["value"] == null)
            return "маршрут невозможно построить"
        return `${n["value"]} с\nне дошло ${n["problematic"]} из ${participantsNumber}`
    }

    return (
        <div className="App">
            {!isSavedAnimation ? (
                <div className="animation-controls">
                    {animationCompleted && (
                        <button 
                            onClick={saveAnimation} 
                            disabled={isSaving}
                            className="save-animation-btn"
                        >
                            {isSaving ? "Сохраняется..." :
                            isAnimationSaved ? "Анимация сохранена" : "Сохранить анимацию"}
                        </button>
                    )}
                </div>
            ) : (
                <div className="animation-controls">
                    <button onClick={removeAnimation} disabled={isDeleting} style={{ color: '#fff', background: '#d32f2f' }}>
                        {isDeleting ? "Удаляется..." : "Удалить анимацию"}
                    </button>
                </div>
            )}
            <div className="body">
                <div className="grid-wrapper">
                    {grid && <GridComponent grid={grid} isAnimating={isAnimating} currentSteps={currentSteps} completedGoals={completedGoals} />}
                </div>
                <div className="text-table-wrapper">
                    {showStatistics && <div className="text-table">
                        <div className="text-table__title">Время движения</div>
                        <ul className="text-table__list">
                            <li>Оптимальное время: {statisticsFormatString(idealTime)}</li>
                            <li>Фактическое время: {statisticsFormatString(validTime)}</li>
                        </ul>
                    </div>}
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
};

export default AnimationDetail;
