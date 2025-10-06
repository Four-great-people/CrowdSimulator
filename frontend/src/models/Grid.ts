import Cell from './Cell';
import Person from './Person';
import Wall from './Wall';

export class Grid {
    width: number;
    height: number;
    cells: Cell[][];
    persons: Person[];
    walls: Wall[];

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.cells = this.createGrid();
        this.persons = [];
        this.walls = [];
    }

    private createGrid(): Cell[][] {
        const grid: Cell[][] = [];
        for (let y = this.height - 1; y >= 0; y--) {
            const row: Cell[] = [];
            for (let x = 0; x < this.width; x++) {
                row.push(new Cell(x, y));
            }
            grid.push(row);
        }
        return grid;
    }


    clone(): Grid {
        const newGrid = new Grid(this.width, this.height);

        this.cells.forEach((row, y) => {
            row.forEach((cell, x) => {
                const targetCell = newGrid.getCell(x, y);
                if (targetCell) {
                    newGrid.cells[y][x] = cell.clone();
                }
            });
        });
        
        newGrid.walls = this.walls.map(wall => wall.clone());
        
        newGrid.persons = this.persons.map(person => {
            const cell = newGrid.getCell(person.position.x, person.position.y);
            if (cell && cell.persons.length > 0) {
                return cell.persons.find(p => p.id === person.id) || person.clone();
            }
            return person.clone();
        });
        
        return newGrid;
    }


    getCell(x: number, y: number): Cell | null {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }
        return this.cells[y][x];
    }

    addWall(x1: number, y1: number, x2: number, y2: number) {
        const wall = new Wall({ x: x1, y: y1 }, { x: x2, y: y2 });
        this.walls.push(wall);

        if (x1 === x2) {
            const [startY, endY] = y1 < y2 ? [y1, y2] : [y2, y1];
            for (let y = startY; y < endY; y++) {
                this.cells[y][x1].isWall = true;
                this.cells[y][x1].addWallDirection("vertical");
            }
        } else if (y1 === y2) {
            const [startX, endX] = x1 < x2 ? [x1, x2] : [x2, x1];
            for (let x = startX; x < endX; x++) {
                this.cells[y1][x].isWall = true;
                this.cells[y1][x].addWallDirection("horizontal");
            }
        }
    }

    addPerson(person: Person) {
        const cell = this.getCell(person.position.x, person.position.y);
        if (cell) {
            cell.addPerson(person);
            this.persons.push(person);
        }
    }   

    setGoal(goal: { x: number, y: number }) {
        const cell = this.getCell(goal.x, goal.y);
        if (cell) {
            cell.setGoal(goal);
        }
    }

    getDataForBackend() {
        return {
            up_right_point: { x: this.width, y: this.height },
            down_left_point: { x: 0, y: 0 },
            borders: this.walls.map(wall => wall.toJSON()),
            persons: this.persons.map(person => ({
                id: person.id,
                position: person.position,
                goal: person.goal
            }))
        };
    }
}

export default Grid;