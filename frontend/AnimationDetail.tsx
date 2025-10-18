import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Grid from './src/models/Grid';
import { GetMapFromBackend, GetStatisticsFromBackend } from './src/services/api';
import Person from './src/models/Person';
import GridComponent from './src/components/GridComponent';
import SVGRoundButton from './src/components/SVGRoundButton';
import './styles/App.css';

const AnimationDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    if (!id) {
        return <div>ID карты не указан</div>;
    }

    const [grid, setGrid] = useState<Grid | null>(null);
    const [currentSteps, setCurrentSteps] = useState<{ [id: number]: number }>({});
    const [completedGoals, setCompletedGoals] = useState<{ [id: number]: boolean }>({});
    const [isAnimating, setIsAnimating] = useState(false);
    const [animationCompleted, setAnimationCompleted] = useState(false);
    // const [mapId, setMapId] = useState<string | null>(null);
    const animationRef = useRef<any>(null);
    const [isLoadingMap, setIsLoadingMap] = useState(false);
    const [isLoadedMap, setIsLoadedMap] = useState(false);
    const [idealTime, setIdealTime] = useState(undefined);
    const [validTime, setValidTime] = useState(undefined)

    const loadMap = async (mapId: string) => {
        if (isAnimating || isLoadingMap) return;
        try {
            setIsLoadingMap(true);
            let newGrid = await GetMapFromBackend(mapId);
            setGrid(newGrid);
            const initialSteps: { [id: number]: number } = {};
            const initialCompleted: { [id: number]: boolean } = {};
            setCurrentSteps(initialSteps);
            setCompletedGoals(initialCompleted);
            setAnimationCompleted(false);
            setIsLoadedMap(true);
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
            setIdealTime(statisticsFromBackend["ideal"])
            setValidTime(statisticsFromBackend["valid"])
            executeSteps(gridCopy, persons, 0, statisticsFromBackend["routes"]);

        } catch (error) {
            console.error('Ошибка при работе с бэкендом:', error);
            setIsAnimating(false);
        }
    };

    const isRouteCompleted = (route: any): boolean => {
        if (route) {
            console.log(`${route.route.length} ${route.animationIndex} ${route.route}`) //
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
            loadMap(id as string);
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
        if (n == null)
            return "маршрут невозможно построить"
        return `${n} с`
    }

    return (
        <div className="App">
            <div className="body">
                <div className="grid-wrapper">
                    {grid && <GridComponent grid={grid} isAnimating={isAnimating} currentSteps={currentSteps} completedGoals={completedGoals} />}
                </div>
                <div className="text-table-wrapper">
                    {animationCompleted && <div className="text-table">
                        <div className="text-table__title">Время движения</div>
                        <ul className="text-table__list">
                            <li>{`Маршрут с возможностью пересечения людей: ${statisticsFormatString(idealTime)}`}</li>
                            <li>{`Маршрут без возможности пересечения людей: ${statisticsFormatString(validTime)}`}</li>
                        </ul>
                    </div>}
                </div>
            </div>
            <div className="back-button-container">
                <SVGRoundButton
                    direction="left"
                    onClick={() => navigate("/map/" + String(id))}
                    className="svg-round-button"
                />
            </div>
        </div>
    );
};

export default AnimationDetail;