import Person from './Person';

class Cell {
    x: number;
    y: number;
    isWall: boolean;
    directionOfWall: string[];
    persons: Person[];
    goal: { x: number, y: number } | null;
    usedTicks: number;

    constructor(x: number, y: number, isWall: boolean = false, goal: { x: number, y: number } | null = null) {
        this.x = x;
        this.y = y;
        this.isWall = isWall;
        this.persons = [];
        this.goal = goal;
        this.directionOfWall = [];
        this.usedTicks = 0;
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
        newCell.usedTicks = this.usedTicks;
        return newCell;
    }

    mark() {
        this.usedTicks += 1;
    }

    reset() {
        this.usedTicks = 0;
    }

    getColorString(allTicks: number) {
        if (allTicks == 0) {
            return "#FFFFFF";
        }
        const maxEffect = 128;
        const notBlueComponent = 255 - Math.floor(this.usedTicks / allTicks * maxEffect);
        return "#" + notBlueComponent.toString(16) + notBlueComponent.toString(16) + "FF";
    }
}

export default Cell;