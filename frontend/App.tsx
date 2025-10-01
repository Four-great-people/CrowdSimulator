import React, { useState, useEffect, useRef } from 'react';
import './styles/App.css';
import GridComponent from './src/components/GridComponent';
import Grid from './src/models/Grid';
import Person from './src/models/Person';
import { saveMapToBackend, updateMapInBackend, GetRoutesFromBackend, GetMapsFromBackend } from './src/services/api';


const App: React.FC = () => {
    const [grid, setGrid] = useState<Grid | null>(null);
    const [currentSteps, setCurrentSteps] = useState<{ [id: number]: number }>({});
    const [completedGoals, setCompletedGoals] = useState<{ [id: number]: boolean }>({});
    const [isAnimating, setIsAnimating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [animationCompleted, setAnimationCompleted] = useState(false);
    const [mapId, setMapId] = useState<string | null>(null);
    const animationRef = useRef<any>(null);
    const [mapList, setMaps] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const newGrid = new Grid(40, 22);

        newGrid.addWall(10, 10, 10, 20);
        newGrid.addWall(10, 10, 20, 10);
        newGrid.addWall(10, 19, 20, 19);
        newGrid.addWall(19, 10, 19, 20);

        const person1 = new Person(1, { x: 15, y: 15 }, { x: 18, y: 15 });
        const person2 = new Person(2, { x: 14, y: 16 }, { x: 18, y: 17 });
        const person3 = new Person(3, { x: 13, y: 13 }, { x: 10, y: 12 });
        newGrid.addPerson(person1);
        newGrid.addPerson(person2);
        newGrid.addPerson(person3);

        newGrid.setGoal({ x: 18, y: 15 });
        newGrid.setGoal({ x: 18, y: 17 });
        newGrid.setGoal({ x: 10, y: 12 });

        setGrid(newGrid);

        const initialSteps: { [id: number]: number } = {};
        const initialCompleted: { [id: number]: boolean } = {};
        setCurrentSteps(initialSteps);
        setCompletedGoals(initialCompleted);

        return () => {
            if (animationRef.current) {
                clearTimeout(animationRef.current);
            }
        };
    }, []);

    const loadMaps = async () => {
        try {
            setIsLoading(true);
            const maps = await GetMapsFromBackend();
            setMaps(maps);
        } finally {
            setIsLoading(false);
        }
    };

    const saveMap = async () => {
        if (!grid || isSaving) return;

        setIsSaving(true);
        try {
            if (mapId) {
                await updateMapInBackend(mapId, grid);
                alert("Карта обновлена");
            }

            else {
                const generatedMapId = await saveMapToBackend(grid);
                setMapId(generatedMapId);
                alert("Карта сохранена с новым ID: " + generatedMapId)
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
            setMapId(generatedMapId);
            alert("Карта сохранена как новая с ID: " + generatedMapId);
        } catch (error) {
            console.error(error);
            alert("Ошибка при сохранении карты как новой");
        } finally {
            setIsSaving(false);
            loadMaps();
        }
    };



    const startAnimation = async () => {
        if (!mapId) {
            alert("Необходимо сохранить карту");
            return;
        }
        if (animationCompleted) {
            alert("Анимация завершена");
            return;
        }
        if (!grid || isAnimating) return;

        setIsAnimating(true);
        setAnimationCompleted(false);

        try {
            const routesFromBackend = await GetRoutesFromBackend(mapId);
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

            executeSteps(gridCopy, persons, 0, routesFromBackend);

        } catch (error) {
            console.error('Ошибка при работе с бэкендом:', error);
            setIsAnimating(false);
        }
    };

    const isRouteCompleted = (route: any): boolean => {
        return !route || route.animationIndex !== undefined && route.route.length <= route.animationIndex
    }

    const getTimeToWait = (direction: any): number => {
        switch (direction) {
            case 'RIGHT':
            case 'LEFT':
            case 'UP':
            case 'DOWN': return 1;
            case 'RIGHT_UP':
            case 'LEFT_UP':
            case 'RIGHT_DOWN':
            case 'LEFT_DOWN': return 2;
            default:
                throw new Error("Unsupported direction!");
        }
    }

    const transformToNextRouteState = (route: any, newPosition: {
        x: number;
        y: number;
    }) => {
        if (route.animationIndex === undefined) {
            route.animationIndex = 0
            route.tactToWait = getTimeToWait(route.route[route.animationIndex]) - 1
        }
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
            return isRouteCompleted(route);
        });

        if (allRoutesCompleted) {
            setIsAnimating(false);
            setAnimationCompleted(true);
            return;
        }

        const newGrid = currentGrid.clone();
        const updatedPersons: Person[] = [];
        const updatedSteps = { ...currentSteps };
        const updatedCompleted = { ...completedGoals };

        persons.forEach(person => {
            const route = routes.find(r => r.id === person.id);

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
            loadMaps()
        }, []
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
                <button onClick={startAnimation} disabled={isAnimating}>
                    {isAnimating ? 'Animating...' : 'Start Animation'}
                </button>
            </div>
            <div className="body">
                <div className="grid-wrapper">
                    {grid && <GridComponent grid={grid} isAnimating={isAnimating} currentSteps={currentSteps} completedGoals={completedGoals} />}
                </div>
                <div className="map-list-wrapper">
                    <div className="map-list">
                        {
                            mapList.map(
                                (mapName) => <button className="blue-button">{mapName}</button>
                            )
                        }
                    </div>
                </div>
            </div>

        </div>
    );
};

export default App;
