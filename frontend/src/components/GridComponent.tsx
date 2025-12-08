import React, { useState, useEffect, useRef } from 'react';
import '../../styles/GridComponent.css';
import Grid from '../models/Grid';
import NamedPoint from '../models/NamedPoint';
import Group from '../models/Group';

interface GridProps {
    grid: Grid;
    isAnimating?: boolean;
    currentSteps?: {[id: number]: number};
    completedGoals?: {[id: number]: boolean};
    editable?: boolean;
    objectPlacing: string;
    groupSize?: number;
    onModify?: () => void;
}

const GridComponent: React.FC<GridProps> = ({
    grid,
    isAnimating = false,
    currentSteps = {},
    completedGoals = {},
    editable = false,
    objectPlacing = "",
    groupSize = 5,
    onModify
}) => {
    const [idleState, inProcessState] = ['idle', 'inProcess'];
    const [borderType, personType, goalType] = ['border', 'person', 'goal'] // Да, зависимости протекают. Но этот фронтенд я не понимаю
    const [state, setState] = useState('idle');
    const [savedX, setSavedX] = useState(0);
    const [savedY, setSavedY] = useState(0);

    const [delIdle, delWall] = ['delIdle', 'delWall'] as const;
    const [delState, setDelState] = useState<typeof delIdle | typeof delWall>(delIdle);
    const [delSavedX, setDelSavedX] = useState(0);
    const [delSavedY, setDelSavedY] = useState(0);

    const [animationKey, setAnimationKey] = useState(0);

    const [renderTick, setRenderTick] = useState(0);
    const forceRerender = () => setRenderTick(t => t + 1);

    const intersectionAreaRatio = 0.35; 
    const outsideBordersMessage = "Устанавливайте стены внутри сетки";
    const diagonalBoardMessage = "Диагональные стены не поддерживаются";
    const sameCellMessage = "Человек и цель не могут находиться в одной клетке";

    const gridRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0, xOffs: 0, yOffs: 0 });

    useEffect(() => {
        const updateDimensions = () => {
            if (gridRef.current) {
                const rect = gridRef.current.getBoundingClientRect();
                setDimensions({ 
                    width: rect.width, 
                    height: rect.height, 
                    xOffs: rect.left,
                    yOffs: rect.top
                });
            }
        };

        updateDimensions();
        const resizeObserver = new ResizeObserver(updateDimensions);
        if (gridRef.current) {
            resizeObserver.observe(gridRef.current);
        }
        window.addEventListener('resize', updateDimensions);
        window.addEventListener('scroll', updateDimensions);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateDimensions);
            window.removeEventListener('scroll', updateDimensions);
        };
    }, [grid.width, grid.height]);


    useEffect(() => {
        setAnimationKey(prev => prev + 1);
    }, [currentSteps]);

    const isWall = (x: number, y: number) => {
        const cell = grid.getCell(x, y);
        return cell ? cell.isCellWall() : false;
    };

    const directionOfWall = (x: number, y: number) => {
        const cell = grid.getCell(x, y);

        return cell ? cell.directionOfWall : [];
    };

    const isPerson = (x: number, y: number) => {
        const cell = grid.getCell(x, y);
        return cell ? cell.persons.length > 0 : false;
    };

    const getPersonId = (x: number, y: number) => {
        const cell = grid.getCell(x, y);
        return cell && cell.persons.length > 0 ? cell.persons[0].id : null;
    };

    const hasPersonReachedGoal = (x: number, y: number) => {
        const cell = grid.getCell(x, y);
        if (cell && cell.persons.length > 0) {
            const person = cell.persons[0];
            return person.reachedGoal || false;
        }
        return false;
    };

    const isGoal = (x: number, y: number) => {
        const cell = grid.getCell(x, y);
        return cell ? cell.hasGoal() : false;
    };

    const isInside = (localOffsetX: number, localOffsetY: number, width: number, height: number, intersectionArea: number) => {
        return (
            (localOffsetX > intersectionArea && localOffsetX < width - intersectionArea) ||
            (localOffsetY > intersectionArea && localOffsetY < height - intersectionArea)
        );
    };

    const toCorner = (coord: number, size: number, intersectionArea: number) => {
        if (coord % size < intersectionArea) {
            return Math.floor(coord / size);
        }
        return Math.floor(coord / size + 1);
    };

    const outsideBorders = (cornerX: number, cornerY: number) => {
        return cornerX <= 0 || cornerX >= grid.width || cornerY <= 0 || cornerY >= grid.height;
    };


    const processIdle = (offsetX: number, offsetY: number, localWidth: number, localHeight: number, intersectionArea: number) => {
        if (objectPlacing !== borderType) {
            const cellX = Math.floor(offsetX / localWidth);
            const cellY = Math.floor(offsetY / localHeight);
            setSavedX(-1);
            setSavedY(-1);
            processNonWall(cellX, cellY);
        } else {
            const cornerX = toCorner(offsetX, localWidth, intersectionArea);
            const cornerY = toCorner(offsetY, localHeight, intersectionArea);
            setSavedX(cornerX);
            setSavedY(cornerY);
            if (outsideBorders(cornerX, cornerY)) {
                alert(outsideBordersMessage);
            } else {
                setState(inProcessState);
            }
        }
    };

    const processWall = (offsetX: number, offsetY: number, localWidth: number, localHeight: number, intersectionArea: number) => {
        const cornerX = toCorner(offsetX, localWidth, intersectionArea);
        const cornerY = toCorner(offsetY, localHeight, intersectionArea);
        if (outsideBorders(cornerX, cornerY)) {
            alert(outsideBordersMessage);
            return;
        }
        if (savedX === cornerX || savedY === cornerY) {
            grid.addWall(savedX, savedY, cornerX, cornerY);
            if (onModify) onModify();
        } else {
            alert(diagonalBoardMessage);
        }
        setState(idleState);
    };

    const processNonWall = (cellX: number, cellY: number) => {
        const position = { x: cellX, y: cellY };
        if (objectPlacing == personType) {
            const point = new NamedPoint(grid.persons.length, position)
            grid.addPerson(point);
        }
        else if (objectPlacing == goalType) {
            const point = new NamedPoint(grid.goals.length, position)
            grid.addGoal(point);
        }  else {
            const groupId = grid.groups.length;
            const personIds = Array.from({length: groupSize}, (_, i) => 1000 + grid.groups.length * 100 + i);
            const group = new Group(groupId, position, groupSize, personIds);
             personIds.forEach(personId => {
                const person = new NamedPoint(personId, position);
                grid.addPerson(person);
            });
            grid.addGroup(group);
        }
        if (onModify) onModify();
    };

    const processDeleteFromCenter = (cellX: number, cellY: number) => {

        if (objectPlacing == personType) {
            if (typeof (grid as any).removePersonAt === 'function') {
                (grid as any).removePersonAt(cellX, cellY);
            }
        } else if (objectPlacing == goalType) {
            if (typeof (grid as any).removeGoalAt === 'function') {
                (grid as any).removeGoalAt(cellX, cellY);
            }
        } else {
            if (typeof (grid as any).removeGroupAt === 'function') {
                (grid as any).removeGroupAt(cellX, cellY);
            }
        }
        setDelState(delIdle);

        if (onModify) onModify();

        forceRerender();

    };

    const processDeleteWall = (offsetX: number, offsetY: number, localWidth: number, localHeight: number, intersectionArea: number) => {
        const cornerX = toCorner(offsetX, localWidth, intersectionArea);
        const cornerY = toCorner(offsetY, localHeight, intersectionArea);
        if (outsideBorders(cornerX, cornerY)) {
            alert(outsideBordersMessage);
            return;
        }
        if (delSavedX === cornerX || delSavedY === cornerY) {
            if (typeof (grid as any).removeWall === 'function') {
                (grid as any).removeWall(delSavedX, delSavedY, cornerX, cornerY);
            }
            if (onModify) onModify();
        } else {
            alert(diagonalBoardMessage);
        }
        setDelState(delIdle);
    };


    const isValidCellTarget = (target: any) => {
        const cn = (target?.className || '').toString();
        return cn.startsWith('cell') || cn.startsWith('person') || cn.startsWith('goal')|| cn.includes('group-marker');;
    };
    
    const handleOnClick = (e: any) => {
        if (!editable) return;
        if (!isValidCellTarget(e.target)) return;

        const gridContainer = gridRef.current;
        if (!gridContainer) return;

        const rect = gridContainer.getBoundingClientRect();
        const scrollLeft = gridContainer.scrollLeft;
        const scrollTop = gridContainer.scrollTop;
        
        const offsetX = e.clientX - rect.left + scrollLeft;
        const offsetY = e.clientY - rect.top + scrollTop;

        const invertedOffsetY = gridContainer.scrollHeight - offsetY;

        const cellWidth = gridContainer.scrollWidth / grid.width;
        const cellHeight = gridContainer.scrollHeight / grid.height;
        const intersectionArea = Math.min(cellWidth, cellHeight) / 2;

        if (state === idleState) {
            processIdle(offsetX, invertedOffsetY, cellWidth, cellHeight, intersectionArea);
        } else if (state === inProcessState) {
            processWall(offsetX, invertedOffsetY, cellWidth, cellHeight, intersectionArea);
        }
        else {
            alert("Некорректное состояние сервиса");
        }
        forceRerender();
    };

    const handleOnDelete = (e: any) => {
        if (!editable) return;
        if (!isValidCellTarget(e.target)) return;

        e.preventDefault();

        const gridContainer = gridRef.current;
        if (!gridContainer) return;

        const rect = gridContainer.getBoundingClientRect();
        const scrollLeft = gridContainer.scrollLeft;
        const scrollTop = gridContainer.scrollTop;
        
        const offsetX = e.clientX - rect.left + scrollLeft;
        const offsetY = e.clientY - rect.top + scrollTop;

        const invertedOffsetY = gridContainer.scrollHeight - offsetY;

        const cellWidth = gridContainer.scrollWidth / grid.width;
        const cellHeight = gridContainer.scrollHeight / grid.height;
        const intersectionArea = Math.min(cellWidth, cellHeight) / 2;

        if (objectPlacing !== borderType) {
            setDelState(delIdle);
            const cellX = Math.floor(offsetX / cellWidth);
            const cellY = Math.floor(invertedOffsetY / cellHeight);
            processDeleteFromCenter(cellX, cellY);
        } else {
            if (delState === delWall) {
                processDeleteWall(offsetX, invertedOffsetY, cellWidth, cellHeight, intersectionArea);
            } else {
                const cornerX = toCorner(offsetX, cellWidth, intersectionArea);
                const cornerY = toCorner(invertedOffsetY, cellHeight, intersectionArea);
                setDelSavedX(cornerX);
                setDelSavedY(cornerY);
                if (outsideBorders(cornerX, cornerY)) {
                    alert(outsideBordersMessage);
                } else {
                    setDelState(delWall);
                }
            }
        }
        forceRerender();
    };

    const getScaleFactor = () => {

        if (grid.width > 40 || grid.height > 22) {
            return 1;
        }
        const containerWidth = dimensions.width || 1200;
        const containerHeight = dimensions.height || 660;
        const scaleX = containerWidth / (grid.width * 30);
        const scaleY = containerHeight / (grid.height * 30);
        return Math.min(scaleX, scaleY, 1);
    };
    const shouldShowScroll = grid.width > 40 || grid.height > 22;
    const cellSize = 30;
    const nodeSize = 10;
    return (

        <div ref={gridRef}
            className="grid-container"
            style={{
                gridTemplateColumns: `repeat(${grid.width}, ${cellSize}px)`,
                gridTemplateRows: `repeat(${grid.height}, ${cellSize}px)`,
                width: shouldShowScroll ? `${grid.width * 30}px` : 'auto',
                height: shouldShowScroll ? `${grid.height * 30}px` : 'auto',
                transform: shouldShowScroll ? 'none' : `scale(${getScaleFactor()})`,
                position: 'relative',
            }}
            onClick={handleOnClick}
            onContextMenu={handleOnDelete}
            data-tick={renderTick}>
            {grid.cells.map((row) =>
                row.map((cell) => {
                    const isWallCell = isWall(cell.x, cell.y);
                    const personsInCell = grid.getCell(cell.x, cell.y)?.persons || [];
                    const isPersonCell = isPerson(cell.x, cell.y);
                    const isGoalCell = isGoal(cell.x, cell.y);
                    const direction = directionOfWall(cell.x, cell.y);

                    return (
                        <div
                            key={`${cell.x}-${cell.y}`}
                            className={`cell ${isWallCell ? 'wall' : ''} ${direction.includes("vertical") ? 'vertical' : ''} ${direction.includes("horizontal") ? 'horizontal' : ''}`}
                            style={{backgroundColor: cell.getColorString(grid.maxTicks)}}
                        >
                            {isGoalCell && !isPersonCell && <div className="goal"></div>}
                            {isPersonCell && (
                                <div
                                key={`${animationKey}-${personsInCell[0].id}`}
                                className={`person ${isAnimating && !isGoalCell ? 'animate-movement' : ''} person-${personsInCell[0].id} ${isGoalCell ? 'reached-goal' : ''}`}
                                ></div>
                            )}
                            {grid.getGroupAt(cell.x, cell.y) && (
                                    <div className="group-marker">{grid.getGroupAt(cell.x, cell.y)!.total_count}</div>
                                )}
                        </div>
                    );
                })
            )}
            {objectPlacing === borderType &&
                state === inProcessState &&
                savedX >= 0 &&
                savedY >= 0 &&
                !outsideBorders(savedX, savedY) && (
                    <div
                        className="grid-node-highlight"
                        style={{
                            position: 'absolute',
                            left: `${savedX * cellSize - nodeSize / 2}px`,
                            bottom: `${savedY * cellSize - nodeSize / 2}px`,
                            width: `${nodeSize}px`,
                            height: `${nodeSize}px`,
                        }}
                    />
            )}
        </div>
    );
};

export default GridComponent;
