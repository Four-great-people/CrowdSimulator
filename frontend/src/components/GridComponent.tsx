import React, { useState, useEffect } from 'react';
import '../../styles/GridComponent.css';
import Grid from '../models/Grid';
import Person from '../models/Person';

interface GridProps {
    grid: Grid;
    isAnimating?: boolean;
    currentSteps?: {[id: number]: number};
	completedGoals?: {[id: number]: boolean};
    editable?: boolean
}

const GridComponent: React.FC<GridProps> = ({ grid, isAnimating = false, currentSteps = {}, completedGoals = {}, editable = false}) => {
    const [idleState, wallState, personState] = ['idle', 'wall', 'person']
    const [animationKey, setAnimationKey] = useState(0);
    const [savedX, setSavedX] = useState(0);
    const [savedY, setSavedY] = useState(0);
    const [state, setState] = useState('idle');
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
		return cell ? cell.directionOfWall : "";
	}

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

    const isInside = (localOffsetX, localOffsetY, width, height, intersectionArea) => {
        return (
            localOffsetX > intersectionArea && localOffsetX < width - intersectionArea ||
            localOffsetY > intersectionArea && localOffsetY < height - intersectionArea
         )
    }

    const toCorner = (coord, size, intersectionArea) => {
        console.log(coord, size);
        if (coord % size < intersectionArea) {
            return Math.floor(coord / size);
        }
        return Math.floor(coord / size + 1);
    }

    const outsideBorders = (cornerX, cornerY) => {
        return cornerX == 0 || cornerX == grid.width || cornerY == 0 || cornerY == grid.height;
    }

    const processIdle = (offsetX, offsetY, localOffsetX, localOffsetY, localWidth, localHeight, intersectionArea) => {
        if (isInside(localOffsetX, localOffsetY, localWidth, localHeight, intersectionArea)) {
            const cellX = Math.floor(offsetX / localWidth);
            const cellY = Math.floor(offsetY / localHeight);
            setSavedX(cellX);
            setSavedY(cellY);
            setState(personState);
        }
        else {
            const cornerX = toCorner(offsetX, localWidth, intersectionArea);
            const cornerY = toCorner(offsetY, localHeight, intersectionArea);
            setSavedX(cornerX);
            setSavedY(cornerY);
            if (outsideBorders(cornerX, cornerY)) {
                alert(outsideBordersMessage);
            }
            else {
                setState(wallState);
            }
        }
    }

    const processWall = (offsetX, offsetY, localWidth, localHeight, intersectionArea) => {
        const cornerX = toCorner(offsetX, localWidth, intersectionArea);
        const cornerY = toCorner(offsetY, localHeight, intersectionArea);
        if (outsideBorders(cornerX, cornerY)) {
            alert(outsideBordersMessage);
            return;
        }
        if (savedX == cornerX || savedY == cornerY) {
            grid.addWall(savedX, savedY, cornerX, cornerY);
        }
        else {
            alert(diagonalBoardMessage);
        }
        setState(idleState);
    }

    const processPerson = (offsetX, offsetY, localWidth, localHeight) => {
        const cellX = Math.floor(offsetX / localWidth);
        const cellY = Math.floor(offsetY / localHeight);
        setState(idleState);
        if (cellX == savedX && cellY == savedY) {
            alert(sameCellMessage);
            return;
        }
        const position = {"x": savedX, "y": savedY};
        const goal = {"x": cellX, "y": cellY};
        grid.addPerson(new Person(grid.persons.length, position, goal));
        grid.setGoal(goal);
    }

    const handleOnClcik = (e) => {
        if (!editable) {
            return;
        }
        if (!e.target.className.startsWith("cell")) {
            return;
        }
        const localWidth = 30;
        const localHeight = 30; // Yeah, i know, nagic numbers, but who the hell cares
        const intersectionArea = Math.floor((Math.min(localWidth, localHeight) * intersectionAreaRatio));
        const height = localHeight * grid.height;
        const offsetX = e.clientX - e.currentTarget.offsetLeft; //Didn't work with scroll
        // const offsetY = e.clientY - e.currentTarget.offsetTop;
        const offsetY = height - (e.clientY - e.currentTarget.offsetTop); // Flip y value, until we have inverted coordinates
        const localOffsetX = offsetX % localWidth;
        // const localOffsetY = offsetY % localHeight;
        const localOffsetY = localHeight - (offsetY % localHeight); // Flip y value, until we have inverted coordinates
        if (state == idleState) {
            processIdle(offsetX, offsetY, localOffsetX, localOffsetY, localWidth, localHeight, intersectionArea);
        }
        else if (state == wallState) {
            processWall(offsetX, offsetY, localWidth, localHeight, intersectionArea);
        }
        else if (state == personState) {
            processPerson(offsetX, offsetY, localWidth, localHeight);
        }
        else {
            alert("Service incorrect state");
        }
    }

    return (
        <div className="grid-container" onClick={handleOnClcik}>
            {grid.cells.map((row, rowIndex) =>
                row.map((cell, cellIndex) => {
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