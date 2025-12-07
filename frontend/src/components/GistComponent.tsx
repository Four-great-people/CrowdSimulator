import React, { useState, useEffect, useRef } from 'react';
import '../../styles/GridComponent.css';
import Grid from '../models/Grid';
import GridComponent from './GridComponent';

interface GistProps {
    maxSteps: number;
}

const GistComponent: React.FC<GistProps> = ({ maxSteps}) => {
    const gistRef = useRef<HTMLDivElement>(null);

    const getLength = () => {
        const maxSize = 5;
        return Math.min(maxSteps + 1, maxSize);
    }

    const getGrid = () => {
        const length = getLength();
        const grid = new Grid(length, 1);
        grid.markCell(length - 1, 0, maxSteps);
        if (length == 1) {
            return grid;
        }
        const step = maxSteps / (length - 1);
        for (var i = 1; i < length - 1; ++i) {
            grid.markCell(i, 0, step * i);
        }
        return grid;
    }
    
    return (
        <div className={`gist`}>
            {<GridComponent grid={getGrid()} isAnimating={false} currentSteps={{}} completedGoals={{}} editable={false} objectPlacing={""} groupSize={1} />}
            <div className="enumeration">
                {getGrid().cells[0].map((cell) => {
                    return <div className="enum-item">{cell.usedTicks * 5}c</div> // I know, that it's hardcoded. But do we really want to change middle-services for this?
                })}
            </div>
        </div>
    );
};

export default GistComponent;

