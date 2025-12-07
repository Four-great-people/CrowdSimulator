import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Grid from './src/models/Grid';
import NamedPoint from './src/models/NamedPoint';

import {
    GetMapFromBackend,
    GetAnimationFromBackend,
    saveAnimationToBackend,
    deleteAnimationFromBackend,
    updateAnimationInBackend,
    GetUnsavedAnimationStatisticsFromBackend,
    GetSavedAnimationStatisticsFromBackend,
    AnimationBlockFrontend,
} from './src/services/api';

import GridComponent from './src/components/GridComponent';
import SVGRoundButton from './src/components/SVGRoundButton';
import NotFound from './src/components/NotFound';
import './styles/App.css';

interface TimeStat {
    value: number | null;
    problematic: number;
}

interface ExecuteOptions {
    maxSteps?: number;
    onFinished?: (
        gridAtEnd: Grid,
        personsAtEnd: NamedPoint[],
        lastStepIndex: number
    ) => void;
}

const AnimationDetail: React.FC = () => {
    const { id, algo } = useParams<{ id: string; algo?: string }>();
    const navigate = useNavigate();

    const isSavedAnimation = window.location.pathname.includes('/animation/saved/');

    if (!id || (!algo && !isSavedAnimation)) {
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

    const animationRef = useRef<any>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isLoadingMap, setIsLoadingMap] = useState(false);
    const [isLoadedMap, setIsLoadedMap] = useState(false);

    const [idealTime, setIdealTime] = useState<TimeStat | undefined>(undefined);
    const [validTime, setValidTime] = useState<TimeStat | undefined>(undefined);

    const [participantsNumber, setParticipantsNumber] = useState<number>(0);
    const [routes, setRoutes] = useState<any[]>([]);
    const [showStatistics, setShowStatistics] = useState(false);

    const [isAnimationSaved, setIsAnimationSaved] = useState(false);
    const [savedAnimationId, setSavedAnimationId] = useState<string | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [animationName, setAnimationName] = useState('');
    const [originalAnimationName, setOriginalAnimationName] = useState('');

    const [animationBlocks, setAnimationBlocks] = useState<AnimationBlockFrontend[]>([]);
    const animationBlocksRef = useRef<AnimationBlockFrontend[]>([]);
    const currentBlockIndexRef = useRef<number>(0);
    const animationRunIdRef = useRef(0);
    const lastStepIndexRef = useRef<number>(0);

    const objectTypes: string[] = ['border', 'person', 'goal', 'group'];
    const [currentObject, setCurrentObject] = useState<string>('border');
    const [groupSizeInput, setGroupSizeInput] = useState<string>('5');
    const [groupSize, setGroupSize] = useState<number>(5);

    const gridChangedFlag = useRef(false);

    

    useEffect(() => {
        animationPausedRef.current = animationPaused;
    }, [animationPaused]);

    useEffect(() => {
        isAnimatingRef.current = isAnimating;
    }, [isAnimating]);

    useEffect(() => {
        animationBlocksRef.current = animationBlocks;
    }, [animationBlocks]);

    useEffect(() => {
        if (id) {
            loadContent(id);
        }
    }, [id]);

    useEffect(() => {
        if (isLoadedMap && !isSavedAnimation) {
            startAnimation();
        }
    }, [isLoadedMap, isSavedAnimation]);

    useEffect(() => {
        if (!animationPaused && gridChangedFlag.current) {
            recalculateAfterGridChange();
        }
    }, [animationPaused]);

    useEffect(() => {
        return () => {
            if (animationRef.current) {
                clearTimeout(animationRef.current);
            }
        };
    }, []);

    

    const collectPersons = (g: Grid): NamedPoint[] => {
        const persons: NamedPoint[] = [];
        g.cells.forEach(row =>
            row.forEach(cell => {
                if (cell.persons.length > 0) {
                    persons.push(...cell.persons);
                }
            })
        );
        return persons;
    };

    const normalizeRoutes = (routesData: any[] | null | undefined): any[] =>
        (routesData || []).map((r: any) => ({
            id: r.id,
            route: Array.isArray(r.route) ? [...r.route] : r.route,
        }));

    const cloneRoutesForPlayback = (routesData: any[]): any[] =>
        (routesData || []).map(r => ({
            id: r.id,
            route: Array.isArray(r.route) ? [...r.route] : r.route,
            animationIndex: undefined,
            tactToWait: undefined,
        }));

    const mergeStats = (prev?: TimeStat, current?: TimeStat): TimeStat | undefined => {
        if (!current) return prev;
        if (!prev) return current;

        if (prev.value == null || current.value == null) {
            return {
                value: null,
                problematic: current.problematic,
            };
        }

        return {
            value: prev.value + current.value,
            problematic: current.problematic,
        };
    };

    const statisticsFormatString = (timeObj: TimeStat | undefined): string => {
        if (!timeObj) return '-';
        if (timeObj.value == null) return 'маршрут невозможно построить';
        const reached = participantsNumber - timeObj.problematic;
        return `${timeObj.value} с\nдошло ${reached} из ${participantsNumber}`;
    };

    const shouldShowScroll = () => {
        return grid && (grid.width > 40 || grid.height > 22);
    };

    const onObjectClick = (object: string) => {
        setCurrentObject(object);
    };

    const handleGroupSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '' || /^\d*$/.test(value)) {
            setGroupSizeInput(value);
            if (value !== '') {
                const numValue = parseInt(value, 10);
                if (!isNaN(numValue) && numValue >= 1 && numValue <= 50) {
                    setGroupSize(numValue);
                }
            }
        }
    };

    

    const loadContent = async (contentId: string) => {
        if (isAnimating || isLoadingMap) return;

        try {
            setIsLoadingMap(true);
            setError(null);

            setAnimationBlocks([]);
            animationBlocksRef.current = [];
            currentBlockIndexRef.current = 0;

            setCurrentSteps({});
            setCompletedGoals({});
            setAnimationCompleted(false);
            setShowStatistics(false);
            setIdealTime(undefined);
            setValidTime(undefined);
            setParticipantsNumber(0);
            setRoutes([]);
            gridChangedFlag.current = false;
            setAnimationPaused(false);
            animationPausedRef.current = false;

            if (isSavedAnimation) {
                const animation = await GetAnimationFromBackend(contentId);

                const blocks = animation.blocks || [];
                if (!blocks.length) {
                    throw new Error('У анимации нет блоков');
                }

                setAnimationBlocks(blocks);
                animationBlocksRef.current = blocks;
                currentBlockIndexRef.current = 0;

                const firstGrid = blocks[0].grid.clone();
                setGrid(firstGrid);
                setOriginalGrid(firstGrid.clone());

                setIdealTime(animation.statistics?.ideal);
                setValidTime(animation.statistics?.valid);

                const totalParticipants = Math.max(
                    0,
                    ...blocks.map(b => (b.routes ? b.routes.length : 0))
                );
                setParticipantsNumber(totalParticipants);

                setShowStatistics(true);
                setIsAnimationSaved(true);
                setOriginalAnimationName(animation.name || 'Без названия');
                setAnimationName(animation.name || 'Без названия');

                playBlocksSequence(blocks, 0);
            } else {
                const { grid: newGrid } = await GetMapFromBackend(contentId);
                setGrid(newGrid);
                setOriginalGrid(newGrid.clone());

                setIsLoadedMap(true);
                setIsAnimationSaved(false);
                setSavedAnimationId(null);
                setOriginalAnimationName('Без названия');
            }
        } catch (err) {
            console.error(err);
            setError('Анимация не найдена');
        } finally {
            setIsLoadingMap(false);
        }
    };

    

    const isRouteCompleted = (route: any): boolean => {
        return (
            !route ||
            (route.animationIndex !== undefined &&
                route.route &&
                route.route.length <= route.animationIndex)
        );
    };

    const getTimeToWait = (direction: any): number => {
        switch (direction) {
            case 'WAIT':
            case 'RIGHT':
            case 'LEFT':
            case 'UP':
            case 'DOWN':
                return 1;
            case 'RIGHT_UP':
            case 'LEFT_UP':
            case 'RIGHT_DOWN':
            case 'LEFT_DOWN':
                return 2;
            default:
                throw new Error(`Unsupported direction ${direction}!`);
        }
    };

    const prepareRoute = (route: any) => {
        if (route !== undefined && route.animationIndex === undefined) {
            route.animationIndex = 0;
            if (route.route && route.route.length > 0) {
                route.tactToWait = getTimeToWait(route.route[route.animationIndex]);
            }
        }
    };

    const transformToNextRouteState = (
        route: any,
        newPosition: { x: number; y: number }
    ) => {
        if (route.tactToWait === 0) {
            const direction = route.route[route.animationIndex];
            route.animationIndex += 1;
            if (!isRouteCompleted(route)) {
                route.tactToWait =
                    getTimeToWait(route.route[route.animationIndex]) + 1;
            }
            switch (direction) {
                case 'RIGHT':
                    newPosition.x += 1;
                    break;
                case 'LEFT':
                    newPosition.x -= 1;
                    break;
                case 'UP':
                    newPosition.y += 1;
                    break;
                case 'DOWN':
                    newPosition.y -= 1;
                    break;
                case 'RIGHT_UP':
                    newPosition.x += 1;
                    newPosition.y += 1;
                    break;
                case 'LEFT_UP':
                    newPosition.x -= 1;
                    newPosition.y += 1;
                    break;
                case 'RIGHT_DOWN':
                    newPosition.x += 1;
                    newPosition.y -= 1;
                    break;
                case 'LEFT_DOWN':
                    newPosition.x -= 1;
                    newPosition.y -= 1;
                    break;
            }
        }
        route.tactToWait -= 1;
    };

    

    const executeSteps = (
        currentGrid: Grid,
        persons: NamedPoint[],
        stepIndex: number,
        routesForPersons: any[],
        options: ExecuteOptions = {},
        runId?: number
    ) => {
        if (runId !== undefined && runId !== animationRunIdRef.current) {
        return;
    }  
        lastStepIndexRef.current = stepIndex;

        if (!animationPausedRef.current) {
            const allRoutesCompleted = persons.every(person => {
                const route = routesForPersons.find(r => r.id === person.id);
                prepareRoute(route);
                return isRouteCompleted(route);
            });

            const reachedMax =
                typeof options.maxSteps === 'number' &&
                options.maxSteps >= 0 &&
                stepIndex >= options.maxSteps;

            if (allRoutesCompleted || reachedMax) {
                if (options.onFinished) {
                    options.onFinished(currentGrid, persons, stepIndex);
                } 
                return;
            }

            const newGrid = currentGrid.clone();
            const updatedPersons: NamedPoint[] = [];
            const updatedSteps = { ...currentSteps };
            const updatedCompleted = { ...completedGoals };

            persons.forEach(person => {
                const route = routesForPersons.find(r => r.id === person.id);
                prepareRoute(route);

                if (!isRouteCompleted(route)) {
                    const newPosition = { ...person.position };
                    transformToNextRouteState(route, newPosition);
                    const targetCell = currentGrid.getCell(newPosition.x, newPosition.y);

                    if (targetCell) {
                        const oldCell = newGrid.getCell(
                            person.position.x,
                            person.position.y
                        );
                        if (oldCell) {
                            oldCell.persons = oldCell.persons.filter(
                                p => p.id !== person.id
                            );
                        }

                        const newPerson = new NamedPoint(
                            person.id,
                            newPosition,
                            person.reachedGoal
                        );

                        if (targetCell.hasGoal()) {
                            newPerson.reachedGoal = true;
                            updatedCompleted[person.id] = true;

                            const goalCell = newGrid.getCell(
                                targetCell.x,
                                targetCell.y
                            );
                            if (goalCell) {
                                goalCell.removeGoal();
                            }
                        } else {
                            newGrid.markCell(newPosition.x, newPosition.y);
                        }

                        updatedPersons.push(newPerson);
                        newGrid.addPerson(newPerson);
                        updatedSteps[person.id] = stepIndex + 1;
                    } else {
                        const newPerson = new NamedPoint(
                            person.id,
                            person.position,
                            person.reachedGoal
                        );
                        updatedPersons.push(newPerson);
                        newGrid.addPerson(newPerson);
                    }
                } else {
                    const newPerson = new NamedPoint(
                        person.id,
                        person.position,
                        person.reachedGoal
                    );
                    updatedPersons.push(newPerson);
                    newGrid.addPerson(newPerson);
                }
            });

            newGrid.groups.forEach(group => {
                const cell = newGrid.getCell(
                    group.start_position.x,
                    group.start_position.y
                );
                if (cell) {
                    const personsInGroup = cell.persons.filter(p =>
                        group.person_ids.includes(p.id)
                    ).length;
                    group.total_count = personsInGroup;

                    if (group.total_count <= 0) {
                        if (typeof (newGrid as any).removeGroupAt === 'function') {
                            (newGrid as any).removeGroupAt(
                                group.start_position.x,
                                group.start_position.y
                            );
                        }
                    }
                }
            });

            animationRef.current = setTimeout(() => {
                const nextStepIndex = stepIndex + 1;
                setGrid(newGrid);
                setCurrentSteps(updatedSteps);
                setCompletedGoals(updatedCompleted);
                executeSteps(
                    newGrid,
                    updatedPersons,
                    nextStepIndex,
                    routesForPersons,
                    options,
                    runId
                );
            }, 200);
        } else {
            animationRef.current = setTimeout(() => {
                executeSteps(
                    currentGrid,
                    persons,
                    stepIndex,
                    routesForPersons,
                    options,
                    runId
                );
            }, 200);
        }
    };

    

    const playBlocksSequence = (
        blocks: AnimationBlockFrontend[],
        startIndex: number
    ) => {
        if (!blocks || blocks.length === 0) return;

        const runId = ++animationRunIdRef.current;

        const playBlock = (index: number) => {
            if (index >= blocks.length) {
                setIsAnimating(false);
                setAnimationCompleted(true);
                setShowStatistics(true);
                return;
            }

            currentBlockIndexRef.current = index;

            const block = blocks[index];
            const gridCopy = block.grid.clone();

            setGrid(gridCopy);

            const persons = collectPersons(gridCopy);
            if (persons.length === 0) {
                playBlock(index + 1);
                return;
            }

            const normalizedRoutes = normalizeRoutes(block.routes);
            setRoutes(normalizedRoutes);

            const routesForPlayback = cloneRoutesForPlayback(normalizedRoutes);

            setIsAnimating(true);
            setAnimationCompleted(false);

            const maxSteps =
                typeof block.ticks === 'number' && block.ticks >= 0
                    ? block.ticks
                    : undefined;

            executeSteps(gridCopy, persons, 0, routesForPlayback, {
                maxSteps,
                onFinished: (_, personsAtEnd) => {
                    if (index === blocks.length - 1) {
                        setIsAnimating(false);
                        setAnimationCompleted(true);
                        setShowStatistics(true);
                        setParticipantsNumber(personsAtEnd.length);
                    } else {
                        playBlock(index + 1);
                    }
                },
            }, runId);
        };

        playBlock(startIndex);
    };

    

    const startAnimation = async () => {
        if (animationCompleted) {
            alert('Анимация завершена');
            return;
        }
        if (!grid || isAnimating || isSavedAnimation || !algo) return;

        setIsAnimating(true);
        setAnimationCompleted(false);
        setShowStatistics(false);

        try {
            const statisticsFromBackend =
                await GetUnsavedAnimationStatisticsFromBackend(grid, algo);
            const routesFromBackend = normalizeRoutes(
                statisticsFromBackend.routes || []
            );

            grid.reset();
            const gridCopy = grid.clone();

            gridCopy.groups.forEach(group => {
                group.person_ids.forEach(personId => {
                    const person = new NamedPoint(personId, group.start_position);
                    gridCopy.addPerson(person);
                });
            });

            setGrid(gridCopy);

            const persons = collectPersons(gridCopy);

            setParticipantsNumber(routesFromBackend.length);
            setIdealTime(statisticsFromBackend.ideal);
            setValidTime(statisticsFromBackend.valid);

            const firstBlock: AnimationBlockFrontend = {
                grid: gridCopy.clone(),
                routes: routesFromBackend,
                ticks: -1,
            };

            setAnimationBlocks([firstBlock]);
            animationBlocksRef.current = [firstBlock];
            currentBlockIndexRef.current = 0;

            const routesForPlayback = cloneRoutesForPlayback(routesFromBackend);

            setRoutes(routesFromBackend);

            const runId = ++animationRunIdRef.current;

            executeSteps(gridCopy, persons, 0, routesForPlayback, {
                onFinished: (_, personsAtEnd) => {
                    setAnimationCompleted(true);
                    setParticipantsNumber(personsAtEnd.length);
                    setShowStatistics(true);
                },
            }, runId);
        } catch (error) {
            console.error('Ошибка при работе с бэкендом:', error);
            setIsAnimating(false);
        }
    };

    

    const recalculateAfterGridChange = async () => {
        if (!grid) return;

        const algoName = algo || 'dense';

        gridChangedFlag.current = false;

        try {
            if (animationRef.current) {
                clearTimeout(animationRef.current);
            }

            const runId = ++animationRunIdRef.current;
            const gridCopy = grid.clone();
            const pausedTicks = lastStepIndexRef.current;

            const persistedAnimationId = isSavedAnimation
                ? id
                : savedAnimationId;

            let routesFromBackend: any[] = [];
            let statisticsFromBackend: any;

            if (persistedAnimationId) {
                statisticsFromBackend =
                    await GetSavedAnimationStatisticsFromBackend(
                        persistedAnimationId,
                        algoName,
                        gridCopy,
                        pausedTicks
                    );
                routesFromBackend = normalizeRoutes(
                    statisticsFromBackend.routes || []
                );

                setIdealTime(statisticsFromBackend.ideal);
                setValidTime(statisticsFromBackend.valid);
            } else {
                statisticsFromBackend =
                    await GetUnsavedAnimationStatisticsFromBackend(
                        gridCopy,
                        algoName
                    );
                routesFromBackend = normalizeRoutes(
                    statisticsFromBackend.routes || []
                );

                setIdealTime(prev =>
                    mergeStats(prev, statisticsFromBackend.ideal)
                );
                setValidTime(prev =>
                    mergeStats(prev, statisticsFromBackend.valid)
                );
            }

            const normalizedRoutes = routesFromBackend;

            setAnimationBlocks(prevBlocks => {
                const updated = [...prevBlocks];

                if (updated.length > 0) {
                    const idx = Math.min(
                        currentBlockIndexRef.current,
                        updated.length - 1
                    );
                    if (idx >= 0) {
                        const prevBlock = updated[idx];
                        if (prevBlock.ticks < 0) {
                            updated[idx] = {
                                ...prevBlock,
                                ticks: pausedTicks,
                            };
                        }
                    }
                }

                const newBlock: AnimationBlockFrontend = {
                    grid: gridCopy.clone(),
                    routes: normalizedRoutes,
                    ticks: -1,
                };

                updated.push(newBlock);
                animationBlocksRef.current = updated;
                currentBlockIndexRef.current = updated.length - 1;
                return updated;
            });

            const persons = collectPersons(gridCopy);

            setGrid(gridCopy);
            setParticipantsNumber(normalizedRoutes.length);
            setRoutes(normalizedRoutes);
            setIsAnimating(true);
            setAnimationCompleted(false);

            const routesForPlayback = cloneRoutesForPlayback(normalizedRoutes);

            executeSteps(gridCopy, persons, 0, routesForPlayback, {
                onFinished: (_, personsAtEnd) => {
                    setIsAnimating(false);
                    setAnimationCompleted(true);
                    setShowStatistics(true);
                    setParticipantsNumber(personsAtEnd.length);
                },
            }, runId);
        } catch (error) {
            console.error(
                'Ошибка пересчёта маршрутов после изменения карты:',
                error
            );
            setIsAnimating(false);
        }
    };

    

    const saveAnimation = async () => {
        if (!grid || isSaving) return;

        if (isSavedAnimation || isAnimationSaved) {
            await renameAnimation();
            return;
        }

        if (!animationBlocksRef.current.length) {
            alert('Анимация ещё не запускалась — нечего сохранять');
            return;
        }

        setIsSaving(true);
        try {
            const nameToSave =
                animationName.trim() || originalAnimationName || 'Без названия';

            const statistics = {
                valid: validTime,
                ideal: idealTime,
            };

            const baseGrid = animationBlocksRef.current[0].grid;
            const blocksToSave = animationBlocksRef.current;

            const animationId = await saveAnimationToBackend(
                baseGrid,
                blocksToSave,
                statistics,
                nameToSave
            );

            alert(`Анимация сохранена с именем: ${nameToSave}`);

            setIsAnimationSaved(true);
            setSavedAnimationId(animationId);
            setOriginalAnimationName(nameToSave);
        } catch (error) {
            console.error('Ошибка сохранения анимации:', error);
            alert('Ошибка сохранения анимации');
        } finally {
            setIsSaving(false);
        }
    };

    const renameAnimation = async () => {
        try {
            const nameToSave =
                animationName.trim() || originalAnimationName || 'Без названия';
            const animationIdToUpdate = savedAnimationId || id;

            if (!animationIdToUpdate) return;

            await updateAnimationInBackend(animationIdToUpdate, nameToSave);
            setOriginalAnimationName(nameToSave);
            alert('Анимация переименована');
        } catch (error) {
            console.error('Ошибка переименования анимации:', error);
            alert('Ошибка переименования анимации');
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

    

    const restartAnimation = () => {
        if (isAnimating && !animationPaused) return;

        if (animationPaused) {
            if (animationRef.current) {
                clearTimeout(animationRef.current);
            }
            setAnimationPaused(false);
            animationPausedRef.current = false;
            setIsAnimating(false);
            isAnimatingRef.current = false;
        }

        if (!animationBlocksRef.current.length) {
            if (!isSavedAnimation) {
                startAnimation();
            }
            return;
        }

        setCurrentSteps({});
        setCompletedGoals({});
        setAnimationCompleted(false);
        setShowStatistics(false);

        playBlocksSequence(animationBlocksRef.current, 0);
    };

    const changeAnimationPauseState = () => {
        if (animationCompleted) return;

        setAnimationPaused(prev => !prev);
    };

    

    if (error) {
        return <NotFound />;
    }

    return (
        <div className="App">
            <div className="animation-controls">
                <div className="name-input-container">
                    <input
                        type="text"
                        value={animationName}
                        onChange={e => setAnimationName(e.target.value)}
                        placeholder="Введите название анимации"
                        className="name-input"
                        maxLength={35}
                    />
                </div>

                <button
                    onClick={saveAnimation}
                    disabled={isSaving}
                    className="save-animation-btn"
                >
                    {isSaving
                        ? 'Сохраняется...'
                        : isSavedAnimation || isAnimationSaved
                        ? 'Переименовать'
                        : 'Сохранить анимацию'}
                </button>

                {isSavedAnimation && (
                    <button
                        onClick={removeAnimation}
                        disabled={isDeleting}
                        style={{ color: '#fff', background: '#d32f2f' }}
                    >
                        {isDeleting ? 'Удаляется...' : 'Удалить анимацию'}
                    </button>
                )}

                <button
                    onClick={restartAnimation}
                    disabled={!animationCompleted && !animationPaused}
                    className="save-animation-btn"
                >
                    {animationPaused ? 'Сбросить анимацию' : 'Повторить анимацию'}
                </button>

                <button
                    onClick={changeAnimationPauseState}
                    className="save-animation-btn"
                    disabled={animationCompleted}
                >
                    {animationPaused ? 'Возобновить анимацию' : 'Приостановить анимацию'}
                </button>

                {objectTypes.map(type => (
                    <button disabled={type === currentObject} key={type}>
                        <img
                            src={'/' + type + '.png'}
                            onClick={() => onObjectClick(type)}
                            width="30"
                            height="30"
                            alt={type}
                        />
                    </button>
                ))}

                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        marginLeft: '12px',
                        padding: '4px 8px',
                        borderRadius: '5px',
                        border: '1px solid #ccc',
                    }}
                >
                    <label
                        style={{ marginRight: '8px', fontSize: '14px' }}
                    >
                        Людей в группе:
                    </label>
                    <input
                        type="text"
                        value={groupSizeInput}
                        onChange={handleGroupSizeChange}
                        style={{
                            width: '40px',
                            padding: '2px 5px',
                            border: '1px solid #ddd',
                            borderRadius: '3px',
                            textAlign: 'center',
                        }}
                    />
                </div>
            </div>

            <div className="body">
                <div
                    className={`grid-wrapper ${shouldShowScroll() ? 'scrollable' : ''}`}
                >
                    {grid && (
                        <GridComponent
                            grid={grid}
                            isAnimating={isAnimating}
                            currentSteps={currentSteps}
                            completedGoals={completedGoals}
                            editable={animationPaused}
                            objectPlacing={currentObject}
                            groupSize={groupSize}
                            onModify={() => {
                                if (animationPaused) {
                                    gridChangedFlag.current = true;
                                }
                            }}
                        />
                    )}
                </div>
                <div className="text-table-wrapper">
                    {showStatistics && (
                        <div className="text-table">
                            <div className="text-table__title">Время движения</div>
                            <ul className="text-table__list">
                                <li>
                                    Оптимальное время:{' '}
                                    {statisticsFormatString(idealTime)}
                                </li>
                                <li>
                                    Фактическое время:{' '}
                                    {statisticsFormatString(validTime)}
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            <div className="back-button-container">
                <SVGRoundButton
                    direction="left"
                    onClick={() =>
                        isSavedAnimation
                            ? navigate('/maps', { state: { activeTab: 'animations' } })
                            : navigate('/map/' + String(id), {
                                  state: { activeTab: 'maps' },
                              })
                    }
                    className="svg-round-button"
                />
            </div>
        </div>
    );
};

export default AnimationDetail;


