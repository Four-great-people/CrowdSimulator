import React, { useState, useEffect, useRef } from 'react';
import '../../styles/GridComponent.css';
import Grid from '../models/Grid';
import NamedPoint from '../models/NamedPoint';

interface GridProps {
    grid: Grid;
    isAnimating?: boolean;
    currentSteps?: {[id: number]: number};
    completedGoals?: {[id: number]: boolean};
    editable?: boolean;
    objectPlacing: string;
}

const GridComponent: React.FC<GridProps> = ({ grid, isAnimating = false, currentSteps = {}, completedGoals = {}, editable = false, objectPlacing = "" }) => {
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
    const xGridSize = 40;
    const yGridSize = 22;
    useEffect(() => {
        const updateDimensions = () => {
            if (gridRef.current) {
                const { width, height, x, y } = gridRef.current.getBoundingClientRect();
                const xOffs = x;
                const yOffs = y;
                // console.log(`WH ${width} ${height} ${xOffs} ${yOffs} ${x} ${y}`);
                setDimensions({ width, height, xOffs, yOffs });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        window.addEventListener('scroll', updateDimensions);

        return () => {
            window.removeEventListener('resize', updateDimensions);
            window.removeEventListener('scroll', updateDimensions);
        };
    }, []);


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
        return cornerX === 0 || cornerX === grid.width || cornerY === 0 || cornerY === grid.height;
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
        else {
            const point = new NamedPoint(grid.goals.length, position)
            grid.addGoal(point);
        }  
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
        }
        setDelState(delIdle);

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
        } else {
            alert(diagonalBoardMessage);
        }
        setDelState(delIdle);
    };


    const isValidCellTarget = (target: any) => {
        const cn = (target?.className || '').toString();
        return cn.startsWith('cell') || cn.startsWith('person') || cn.startsWith('goal');
    };

    const handleOnClick = (e: any) => {
        if (!editable) return;
        if (!isValidCellTarget(e.target)) return;

        const generalSize = Math.min(dimensions.width / xGridSize, 30);
        // console.log(`1${generalSize} ${dimensions.width} ${xGridSize}`);
        const localWidth = generalSize;
        const localHeight = generalSize;
        const intersectionArea = generalSize / 2;
        const height = localHeight * grid.height;

        const offsetX = e.clientX - dimensions.xOffs;
        const offsetY = height - (e.clientY - dimensions.yOffs);
        // console.log(`2' ${generalSize} width:${dimensions.width} gridSize:${xGridSize} calcX:${offsetX} calcY:${offsetY} xOffs:${dimensions.xOffs} yOffs:${dimensions.yOffs}`);
        if (state === idleState) {
            processIdle(offsetX, offsetY, localWidth, localHeight, intersectionArea);
        } else if (state === inProcessState) {
            processWall(offsetX, offsetY, localWidth, localHeight, intersectionArea);
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

        const generalSize = Math.min(dimensions.width / xGridSize, 30);
        // console.log(`1${generalSize} ${dimensions.width} ${xGridSize}`);
        const localWidth = generalSize;
        const localHeight = generalSize;
        const intersectionArea = generalSize / 2;
        const height = localHeight * grid.height;

        const offsetX = e.clientX - dimensions.xOffs;
        const offsetY = height - (e.clientY - dimensions.yOffs);
        // console.log(`2 ${generalSize} width:${dimensions.width} gridSize:${xGridSize} calcX:${offsetX} calcY:${offsetY} xOffs:${dimensions.xOffs} yOffs:${dimensions.yOffs}`);

        if (objectPlacing !== borderType) {
            setDelState(delIdle);
            const cellX = Math.floor(offsetX / localWidth);
            const cellY = Math.floor(offsetY / localHeight);
            processDeleteFromCenter(cellX, cellY);
        } else {
            // console.log(`state:${state}`)
            if (delState === delWall) {
                processDeleteWall(offsetX, offsetY, localWidth, localHeight, intersectionArea);
            } else {
                const cornerX = toCorner(offsetX, localWidth, intersectionArea);
                const cornerY = toCorner(offsetY, localHeight, intersectionArea);
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

    return (
        <div ref={gridRef}
            className="grid-container"
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
                            style={{backgroundColor: cell.getColorString(grid.allTicks)}}
                        >
                            {isGoalCell && !isPersonCell && <div className="goal"></div>}
                            {isPersonCell && (
                                <div
                                    key={`${animationKey}-${personsInCell[0].id}`}
                                    className={`person ${isAnimating && !isGoalCell ? 'animate-movement' : ''} person-${personsInCell[0].id} ${isGoalCell ? 'reached-goal' : ''}`}
                                ></div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default GridComponent;

