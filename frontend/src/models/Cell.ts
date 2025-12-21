import NamedPoint from './NamedPoint';
import Group from './Group';

class Cell {
    x: number;
    y: number;
    isWall: boolean;
    directionOfWall: string[];
    persons: NamedPoint[];
    goals: NamedPoint[];
    usedTicks: number;
    lastTick: number;
    groups: Group[];

    constructor(x: number, y: number, isWall: boolean = false) {
        this.x = x;
        this.y = y;
        this.isWall = isWall;
        this.persons = [];
        this.goals = [];
        this.directionOfWall = [];
        this.usedTicks = 0;
        this.lastTick = -1;
    }

    addPerson(person: NamedPoint) {
        if (!this.persons.some(p => p.id === person.id)) {
            this.persons.push(person);
        }
    }

    addGoal(goal: NamedPoint) {
        this.goals.push(goal);
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
        return this.goals.length > 0;
    }

    removeGoal() {
        this.goals = [];
    }
    
    getInfo() {
        return {
            x: this.x,
            y: this.y,
            isWall: this.isWall,
            persons: this.persons.map(person => person.getInfo()),
            goals: this.goals.map(goal => goal.getInfo()),
        };
    }

    clone(): Cell {
        const newCell = new Cell(this.x, this.y, this.isWall);
        newCell.directionOfWall = [...this.directionOfWall];
        newCell.persons = this.persons.map(person => person.clone());
        newCell.goals = this.goals.map(goal => goal.clone());
        newCell.usedTicks = this.usedTicks;
        return newCell;
    }

    mark(cnt: number, tick: number) {
        if (tick == this.lastTick) {
            return;
        }
        this.usedTicks += cnt;
        this.lastTick = tick;
    }

    reset() {
        this.usedTicks = 0;
    }

    getColorString(maxTicks: number) {
        if (maxTicks == 0) {
            return "#FFFFFF";
        }
        const maxEffect = 128;
        const notBlueComponent = 255 - Math.floor(this.usedTicks / maxTicks * maxEffect);
        return "#" + notBlueComponent.toString(16) + notBlueComponent.toString(16) + "FF";
    }
}

export default Cell;