import React, { useState, useEffect, useRef } from 'react';
import './styles/App.css';
import GridComponent from './src/components/GridComponent';
import Grid from './src/models/Grid';
import Person from './src/models/Person';
import { SendGridDataToBackend, GetRoutesFromBackend } from './src/services/api';


const App: React.FC = () => {
    const [grid, setGrid] = useState<Grid | null>(null);
    const [currentSteps, setCurrentSteps] = useState<{[id: number]: number}>({});
    const [completedGoals, setCompletedGoals] = useState<{[id: number]: boolean}>({});  
    const [isAnimating, setIsAnimating] = useState(false);
    const animationRef = useRef<any>(null);

    useEffect(() => {
        const newGrid = new Grid(40, 22);

        newGrid.addWall(10, 10, 10, 20);
        newGrid.addWall(10, 10, 20, 10);
        newGrid.addWall(10, 19, 20, 19);
        newGrid.addWall(19, 10, 19, 20);

        const person1 = new Person(1, { x: 15, y: 15 }, { x: 18, y: 15 });
        const person2 = new Person(2, { x: 14, y: 16 }, { x: 18, y: 17 });
        const person3 = new Person(3, { x: 13, y: 13}, { x: 10, y: 12});
        newGrid.addPerson(person1);
        newGrid.addPerson(person2);
        newGrid.addPerson(person3);

        newGrid.setGoal({ x: 18, y: 15 });
        newGrid.setGoal({ x: 18, y: 17 });
        newGrid.setGoal({ x: 10, y: 12});

        setGrid(newGrid);
        
        const initialSteps: {[id: number]: number} = {};
        const initialCompleted: {[id: number]: boolean} = {};
        setCurrentSteps(initialSteps);
        setCompletedGoals(initialCompleted);

        return () => {
            if (animationRef.current) {
                clearTimeout(animationRef.current);
            }
        };
    }, []);

    const startAnimation = async () => {
        if (!grid || isAnimating) return;
        
        setIsAnimating(true);

        try {
        await SendGridDataToBackend(grid);
        const routesFromBackend = await GetRoutesFromBackend();
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

    const executeSteps = (currentGrid: Grid, persons: Person[], stepIndex: number, routes: any[]) => {
        const allRoutesCompleted = persons.every(person => {
            const route = routes.find(r => r.id === person.id);
            return !route || stepIndex >= route.route.length;
        });
        
        if (allRoutesCompleted) {
            setIsAnimating(false);
            return;
        }
        
        const newGrid = currentGrid.clone();
        
       
        
        const updatedPersons: Person[] = [];
        const updatedSteps = { ...currentSteps };
        const updatedCompleted = { ...completedGoals };
        
        persons.forEach(person => {
            const route = routes.find(r => r.id === person.id);
            
            if (route && stepIndex < route.route.length) {
                const direction = route.route[stepIndex];
                const newPosition = { ...person.position };
                
                switch (direction) {
                    case 'RIGHT': newPosition.x += 1; break;
                    case 'LEFT': newPosition.x -= 1; break;
                    case 'UP': newPosition.y += 1; break;
                    case 'DOWN': newPosition.y -= 1; break;
                }
                
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
        }, 400);
    };



    return (
        <div className="App">
            <div className="controls">
                <button onClick={startAnimation} disabled={isAnimating}>
                    {isAnimating ? 'Animating...' : 'Start Animation'}
                </button>
            </div>
            {grid && <GridComponent grid={grid} isAnimating={isAnimating} currentSteps={currentSteps} completedGoals={completedGoals}  />}
        </div>
    );
};

export default App;