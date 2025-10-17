import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Grid from './src/models/Grid';
<<<<<<< HEAD
import { GetMapFromBackend, GetStatisticsFromBackend } from './src/services/api';
=======
import { GetMapFromBackend, GetRoutesFromBackend, GetAnimationFromBackend, saveAnimationToBackend } from './src/services/api';
>>>>>>> 23054a9 (valid frontend and db animation saving)
import Person from './src/models/Person';
import GridComponent from './src/components/GridComponent';
import SVGRoundButton from './src/components/SVGRoundButton';
import './styles/App.css';

const AnimationDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isSavedAnimation = window.location.pathname.includes('/animation/saved/');

    if (!id) {
        return <div>ID карты не указан</div>;
    }
    
    const [grid, setGrid] = useState<Grid | null>(null);
    const [currentSteps, setCurrentSteps] = useState<{ [id: number]: number }>({});
    const [completedGoals, setCompletedGoals] = useState<{ [id: number]: boolean }>({});
    const [isAnimating, setIsAnimating] = useState(false);
    const [animationCompleted, setAnimationCompleted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    // const [mapId, setMapId] = useState<string | null>(null);
    const animationRef = useRef<any>(null);
    const [isLoadingMap, setIsLoadingMap] = useState(false);
    const [isLoadedMap, setIsLoadedMap] = useState(false);
    const [idealTime, setIdealTime] = useState(undefined);
    const [validTime, setValidTime] = useState(undefined);
    const [participantsNumber, setParticipantsNumber] = useState(undefined);

    const loadContent = async (contentId: string) => {
        if (isAnimating || isLoadingMap) return;
        try {
            setIsLoadingMap(true);
            
            if (isSavedAnimation) {
                const animationGrid = await GetAnimationFromBackend(contentId);
                setGrid(animationGrid);
                setAnimationCompleted(true);
                setIsAnimating(false);
            } else {
                let newGrid = await GetMapFromBackend(contentId);
                setGrid(newGrid);
                const initialSteps: { [id: number]: number } = {};
                const initialCompleted: { [id: number]: boolean } = {};
                setCurrentSteps(initialSteps);
                setCompletedGoals(initialCompleted);
                setAnimationCompleted(false);
                setIsLoadedMap(true);
            }
        } catch (error) {
            console.log(error);
            navigate("/maps");
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

        try {
            const statisticsFromBackend = await GetStatisticsFromBackend(id);
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
        if (!grid || isSaving) return;
        
        setIsSaving(true);
        try {
            const animationId = await saveAnimationToBackend(grid);
            alert(`Анимация сохранена с ID: ${animationId}`);
        } catch (error) {
            console.error('Ошибка сохранения анимации:', error);
            alert('Ошибка сохранения анимации');
        } finally {
            setIsSaving(false);
        }
    };

    const isRouteCompleted = (route: any): boolean => {
<<<<<<< HEAD
        if (route) {
            console.log(`${route.route.length} ${route.animationIndex} ${route.route}`) //
=======
        if (route) {    
            console.log(`${route.route.length} ${route.animationIndex} ${route.route}`) 
>>>>>>> 23054a9 (valid frontend and db animation saving)
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

    useEffect(
        () => {
            loadContent(id as string);
            return () => {
                if (animationRef.current) {
                    clearTimeout(animationRef.current);
                }
            };
        }, [id]
    );

    useEffect(
        () => {
            if (isLoadedMap) {
                startAnimation();
            }
        }, [id, isLoadedMap]
    );

    const statisticsFormatString = (n: any) => {
        if (n["value"] == null)
            return "маршрут невозможно построить"
        return `${n["value"]} с\nне дошло ${n["problematic"]} из ${participantsNumber}`
    }

    return (
        <div className="App">
            {!isSavedAnimation && (
                <div className="animation-controls">
                    {animationCompleted && (
                        <button 
                            onClick={saveAnimation} 
                            disabled={isSaving}
                            className="save-animation-btn"
                        >
                            {isSaving ? "Сохраняется..." : "Сохранить анимацию"}
                        </button>
                    )}
                </div>
            )}

            <div className="body">
                <div className="grid-wrapper">
                    {grid && <GridComponent grid={grid} isAnimating={isAnimating} currentSteps={currentSteps} completedGoals={completedGoals} />}
                </div>
                <div className="text-table-wrapper">
                    {animationCompleted && <div className="text-table">
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
                    onClick={() => isSavedAnimation ? navigate("/maps") : navigate("/map/" + String(id))}
                    className="svg-round-button"
                />
            </div>
        </div>
    );
};

export default AnimationDetail;