import React, { useState, useEffect } from 'react';
import '../../styles/GridComponent.css';
import Grid from '../models/Grid';
import Person from '../models/Person';

interface GridProps {
    grid: Grid;
    isAnimating?: boolean;
    currentSteps?: {[id: number]: number};
    completedGoals?: {[id: number]: boolean};
    editable?: boolean;
}

const GridComponent: React.FC<GridProps> = ({ grid, isAnimating = false, currentSteps = {}, completedGoals = {}, editable = false }) => {
    const [idleState, wallState, personState] = ['idle', 'wall', 'person'];
    const [state, setState] = useState<'idle'|'wall'|'person'>('idle');
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


    const processIdle = (offsetX: number, offsetY: number, localOffsetX: number, localOffsetY: number, localWidth: number, localHeight: number, intersectionArea: number) => {
        if (isInside(localOffsetX, localOffsetY, localWidth, localHeight, intersectionArea)) {
            const cellX = Math.floor(offsetX / localWidth);
            const cellY = Math.floor(offsetY / localHeight);
            setSavedX(cellX);
            setSavedY(cellY);
            setState(personState);
        } else {
            const cornerX = toCorner(offsetX, localWidth, intersectionArea);
            const cornerY = toCorner(offsetY, localHeight, intersectionArea);
            setSavedX(cornerX);
            setSavedY(cornerY);
            if (outsideBorders(cornerX, cornerY)) {
                alert(outsideBordersMessage);
            } else {
                setState(wallState);
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

    const processPerson = (offsetX: number, offsetY: number, localWidth: number, localHeight: number) => {
        const cellX = Math.floor(offsetX / localWidth);
        const cellY = Math.floor(offsetY / localHeight);
        setState(idleState);
        if (cellX === savedX && cellY === savedY) {
            alert(sameCellMessage);
            return;
        }
        const position = { x: savedX, y: savedY };
        const goal = { x: cellX, y: cellY };
        grid.addPerson(new Person(grid.persons.length, position, goal));
        grid.setGoal(goal);
    };


    const processDeleteFromCenter = (cellX: number, cellY: number) => {

        if (typeof (grid as any).removePersonOrGoalAt === 'function') {
            (grid as any).removePersonOrGoalAt(cellX, cellY);
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

    const handleOnClcik = (e: any) => {
        if (!editable) return;
        if (!isValidCellTarget(e.target)) return;

        const localWidth = 30;
        const localHeight = 30;
        const intersectionArea = Math.floor((Math.min(localWidth, localHeight) * intersectionAreaRatio));
        const height = localHeight * grid.height;

        const offsetX = e.clientX - e.currentTarget.offsetLeft;
        const offsetY = height - (e.clientY - e.currentTarget.offsetTop); 
        const localOffsetX = offsetX % localWidth;
        const localOffsetY = localHeight - (offsetY % localHeight);

        if (state === idleState) {
            processIdle(offsetX, offsetY, localOffsetX, localOffsetY, localWidth, localHeight, intersectionArea);
        } else if (state === wallState) {
            processWall(offsetX, offsetY, localWidth, localHeight, intersectionArea);
        } else if (state === personState) {
            processPerson(offsetX, offsetY, localWidth, localHeight);
        }
        else {
            alert("Некорректное состояние сервиса");
        }
    };

    const handleOnContextMenu = (e: any) => {
        if (!editable) return;
        if (!isValidCellTarget(e.target)) return;

        e.preventDefault(); 

        const localWidth = 30;
        const localHeight = 30;
        const intersectionArea = Math.floor((Math.min(localWidth, localHeight) * intersectionAreaRatio));
        const height = localHeight * grid.height;

        const offsetX = e.clientX - e.currentTarget.offsetLeft;
        const offsetY = height - (e.clientY - e.currentTarget.offsetTop); 
        const localOffsetX = offsetX % localWidth;
        const localOffsetY = localHeight - (offsetY % localHeight); 

        if (delState === delIdle) {
            if (isInside(localOffsetX, localOffsetY, localWidth, localHeight, intersectionArea)) {
                const cellX = Math.floor(offsetX / localWidth);
                const cellY = Math.floor(offsetY / localHeight);
                processDeleteFromCenter(cellX, cellY);
                return;
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
        } else if (delState === delWall) {
            processDeleteWall(offsetX, offsetY, localWidth, localHeight, intersectionArea);
        }
    };

    return (
        <div
            className="grid-container"
            onClick={handleOnClcik}
            onContextMenu={handleOnContextMenu}
            data-tick={renderTick}>
            {grid.cells.map((row) =>
                row.map((cell) => {
                    const personReachedGoal = hasPersonReachedGoal(cell.x, cell.y);
                    const isWallCell = isWall(cell.x, cell.y);
                    const isPersonCell = isPerson(cell.x, cell.y);
                    const personId = getPersonId(cell.x, cell.y);
                    const isGoalCell = isGoal(cell.x, cell.y);
                    const direction = directionOfWall(cell.x, cell.y);

                    return (
                        <div
                            key={`${cell.x}-${cell.y}`}
                            className={`cell ${isWallCell ? 'wall' : ''} ${direction.includes("vertical") ? 'vertical' : ''} ${direction.includes("horizontal") ? 'horizontal' : ''}`}
                            style={{backgroundColor: cell.getColorString(grid.allTicks)}}
                        >
                            {isPersonCell && (
                                <div
                                    key={`${animationKey}-${personId}`}
                                    className={`person ${isAnimating && !personReachedGoal ? 'animate-movement' : ''} person-${personId} ${personReachedGoal ? 'reached-goal' : ''}`}
                                ></div>
                            )}
                            {isGoalCell && <div className="goal"></div>}
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default GridComponent;

