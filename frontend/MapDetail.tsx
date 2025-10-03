import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Grid from './src/models/Grid';
import { GetMapFromBackend, GetMapsFromBackend, GetRoutesFromBackend, saveMapToBackend, updateMapInBackend } from './src/services/api';
import Person from './src/models/Person';
import GridComponent from './src/components/GridComponent';
import './styles/App.css';
// import { Card } from '../types/Card';

// // Mock функция для получения карты по ID
// const getCardById = (id: string): Card | undefined => {
//   const mockCards: Card[] = [
//     {
//       id: '1',
//       title: 'Продукт 1',
//       description: 'Полное описание продукта 1. Здесь может быть много текста о характеристиках и преимуществах.',
//       image: 'https://via.placeholder.com/400x300',
//       price: 100,
//       category: 'Категория 1'
//     },
//     {
//       id: '2',
//       title: 'Продукт 2',
//       description: 'Полное описание продукта 2. Детальная информация о товаре и его особенностях.',
//       image: 'https://via.placeholder.com/400x300',
//       price: 200,
//       category: 'Категория 2'
//     },
//     {
//       id: '3',
//       title: 'Продукт 3',
//       description: 'Полное описание продукта 3. Подробная спецификация и технические характеристики.',
//       image: 'https://via.placeholder.com/400x300',
//       price: 300,
//       category: 'Категория 1'
//     }
//   ];

//   return mockCards.find(card => card.id === id);
// };

const MapDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    if (!id) {
        return <div>ID карты не указан</div>;
    }

    const [grid, setGrid] = useState<Grid | null>(null);
    const [currentSteps, setCurrentSteps] = useState<{ [id: number]: number }>({});
    const [completedGoals, setCompletedGoals] = useState<{ [id: number]: boolean }>({});
    const [isAnimating, setIsAnimating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [animationCompleted, setAnimationCompleted] = useState(false);
    const [mapId, setMapId] = useState<string | null>(null);
    const animationRef = useRef<any>(null);
    const [mapList, setMaps] = useState<string[]>([]);
    const [isLoadingMap, setIsLoadingMap] = useState(false);

    const loadMap = async (mapId: string) => {
        if (isSaving || isAnimating || isLoadingMap) return;
        try {
            setIsLoadingMap(true);
            let newGrid = await GetMapFromBackend(mapId);
            setGrid(newGrid);
            setMapId(mapId);
            const initialSteps: { [id: number]: number } = {};
            const initialCompleted: { [id: number]: boolean } = {};
            setCurrentSteps(initialSteps);
            setCompletedGoals(initialCompleted);
            setAnimationCompleted(false);
        } finally {
            setIsLoadingMap(false);
        }
    }

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
                setMapId(generatedMapId); // TODO: redirect
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
            setMapId(generatedMapId);  // TODO: redirect
            alert("Карта сохранена как новая с ID: " + generatedMapId);
        } catch (error) {
            console.error(error);
            alert("Ошибка при сохранении карты как новой");
        } finally {
            setIsSaving(false);
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
            loadMap(mapId as string);
            return () => {
                if (animationRef.current) {
                    clearTimeout(animationRef.current);
                }
            };
        }, []
    );

    // navigate(-1) back

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
            </div>
        </div>
    );
};

export default MapDetail;