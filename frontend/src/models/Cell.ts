import Person from './Person';

class Cell {
    x: number;
    y: number;
    isWall: boolean;
    directionOfWall: string[];
    persons: Person[];
    goal: { x: number, y: number } | null;

    constructor(x: number, y: number, isWall: boolean = false, goal: { x: number, y: number } | null = null) {
        this.x = x;
        this.y = y;
        this.isWall = isWall;
        this.persons = [];
        this.goal = goal;
        this.directionOfWall = [];
    }

    addPerson(person: Person) {
        this.persons.push(person);
    }

    setGoal(goal: { x: number, y: number }) {
        this.goal = goal;
    }
    addWallDirection(direction: "horizontal" | "vertical") {
        if (!this.directionOfWall.includes(direction)) {
            this.directionOfWall.push(direction);
        }
    }


    isOccupied() {
        return this.persons.length > 0;
    }

    isCellWall() {
        return this.isWall;
    }

    hasGoal() {
        return this.goal !== null;
    }

    removeGoal() {
        this.goal = null;
    }
    
    getInfo() {
        return {
            x: this.x,
            y: this.y,
            isWall: this.isWall,
            persons: this.persons.map(person => person.getInfo()),
            goal: this.goal,
        };
    }

    clone(): Cell {
        const newCell = new Cell(this.x, this.y, this.isWall, this.goal ? { ...this.goal } : null);
        newCell.directionOfWall = [...this.directionOfWall];
        newCell.persons = this.persons.map(person => person.clone());
        return newCell;
    }
}

export default Cell;