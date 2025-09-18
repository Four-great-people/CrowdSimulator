import React, { useState, useEffect } from 'react';
import '../../styles/GridComponent.css';
import Grid from '../models/Grid';

interface GridProps {
    grid: Grid;
    isAnimating?: boolean;
    currentSteps?: {[id: number]: number};
	completedGoals?: {[id: number]: boolean};
}

const GridComponent: React.FC<GridProps> = ({ grid, isAnimating = false, currentSteps = {}, completedGoals = {} }) => {
    const [animationKey, setAnimationKey] = useState(0);

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

    return (
        <div className="grid-container">
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