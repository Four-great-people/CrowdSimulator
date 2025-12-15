import Cell from './Cell';
import NamedPoint from './NamedPoint';
import Wall from './Wall';
import Group from './Group';
export class Grid {
    width: number;
    height: number;
    cells: Cell[][];
    persons: NamedPoint[];
    goals: NamedPoint[];
    walls: Wall[];
    maxTicks: number;
    groups: Group[] = [];

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.cells = this.createGrid();
        this.persons = [];
        this.goals = [];
        this.walls = [];
        this.maxTicks = 0;
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

    private _removeDirFromCell(cell: any, dir: 'vertical'|'horizontal') {
        const v = (cell as any).directionOfWall;
        if (Array.isArray(v)) {
          (cell as any).directionOfWall = v.filter((d: string) => d !== dir);
        } else if (typeof v === 'string') {
          const parts = v.split(' ').filter(Boolean).filter((d: string) => d !== dir);
          (cell as any).directionOfWall = parts.join(' ');
        } else {
          (cell as any).directionOfWall = '';
        }
    }
    addGroup(group: Group) {
        this.groups.push(group);
    }

    removeGroupAt(x: number, y: number) {
         const group = this.groups.find(g => 
            g.start_position.x === x && g.start_position.y === y
        );
        if (group) {
            const cell = this.getCell(x, y);
            if (cell) {
                cell.persons = cell.persons.filter(person => 
                    !group.person_ids.includes(person.id)
                );
            }
            this.persons = this.persons.filter(person => 
                !group.person_ids.includes(person.id)
            );
            this.groups = this.groups.filter(g => 
            g.start_position.x !== x || g.start_position.y !== y
            );
        }
    }
    getGroupAt(x: number, y: number): Group | null {
        return this.groups.find(g => 
            g.start_position.x === x && g.start_position.y === y
        ) || null;
    }

    removeWall(x1: number, y1: number, x2: number, y2: number) {
        const isVertical = x1 === x2;
        const isHorizontal = y1 === y2;
        if (!isVertical && !isHorizontal) return;

        if (isVertical && y2 < y1) [y1, y2] = [y2, y1];
        if (isHorizontal && x2 < x1) [x1, x2] = [x2, x1];

        if (isVertical) {
            for (let y = y1; y < y2; y++) {
                const cell = this.getCell(x1, y);
                if (cell) this._removeDirFromCell(cell, 'vertical');
            }
        } else {
          for (let x = x1; x < x2; x++) {
              const cell = this.getCell(x, y1);
              if (cell) this._removeDirFromCell(cell, 'horizontal');
          }
        }

        const newWalls: any[] = [];
        for (const w of this.walls) {
            const wVert = w.first.x === w.second.x;
            const wHoriz = w.first.y === w.second.y;

            if (isVertical && wVert && w.first.x === x1) {
                const ws = Math.min(w.first.y, w.second.y);
                const we = Math.max(w.first.y, w.second.y);
                const s = Math.max(ws, y1);
                const e = Math.min(we, y2);
                if (s < e) {
                    if (ws < y1) newWalls.push(new Wall({ x: x1, y: ws }, { x: x1, y: y1 }));
                    if (y2 < we) newWalls.push(new Wall({ x: x1, y: y2 }, { x: x1, y: we }));
                    continue;                 }
            } else if (isHorizontal && wHoriz && w.first.y === y1) {
                const ws = Math.min(w.first.x, w.second.x);
                const we = Math.max(w.first.x, w.second.x);
                const s = Math.max(ws, x1);
                const e = Math.min(we, x2);
                if (s < e) {
                    if (ws < x1) newWalls.push(new Wall({ x: ws, y: y1 }, { x: x1, y: y1 }));
                    if (x2 < we) newWalls.push(new Wall({ x: x2, y: y1 }, { x: we, y: y1 }));
                    continue;
                }
            }
  
        newWalls.push(w);
      }
      this.walls = newWalls;
    }
    removePersonAt(x: number, y: number) {
        const cell = this.getCell(x, y);
        if (!cell) return;

        if (cell.persons.length > 0) {
            const person = cell.persons[0];
            cell.persons = cell.persons.filter(p => p.id !== person.id);
            this.persons = this.persons.filter(p => p.id !== person.id);
        }
    }

    removeGoalAt(x: number, y: number) {
        const cell = this.getCell(x, y);
        if (!cell) return;

        if (cell.goals.length > 0) {
            const goal = cell.goals[0];
            cell.goals = cell.goals.filter(g => g.id !== goal.id);
            this.goals = this.goals.filter(g => g.id !== goal.id);
        }
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
        newGrid.goals = this.goals.map(goal => {
            const cell = newGrid.getCell(goal.position.x, goal.position.y);
            if (cell && cell.goals.length > 0) {
                return cell.goals.find(g => g.id === goal.id) || goal.clone();
            }
            return goal.clone();
        });

        newGrid.maxTicks = this.maxTicks;
        newGrid.groups = this.groups.map(group => group.clone());
        
        return newGrid;
    }

    resize(newWidth: number, newHeight: number): Grid {
        if (newWidth <= 0 || newHeight <= 0) {
            throw new Error("Размеры не могут быть отрицательными.");
        }

        const newGrid = new Grid(newWidth, newHeight);

        this.persons.forEach(person => {
            if (person.position.x < newWidth && person.position.y < newHeight) {
                const clonedPerson = person.clone();
                newGrid.addPerson(clonedPerson);
            }
        });

        this.goals.forEach(goal => {
            if (goal.position.x < newWidth && goal.position.y < newHeight) {
                const clonedGoal = goal.clone();
                newGrid.addGoal(clonedGoal);
            }
        });

        this.walls.forEach(wall => {
            if (wall.first.x < newWidth && wall.first.y < newHeight &&
                wall.second.x < newWidth && wall.second.y < newHeight) {
                newGrid.addWall(wall.first.x, wall.first.y, wall.second.x, wall.second.y);
            }
        });

        this.groups.forEach(group => {
            if (group.start_position.x < newWidth && group.start_position.y < newHeight) {
                const clonedGroup = group.clone();
                newGrid.addGroup(clonedGroup);
            }
        });

        newGrid.maxTicks = this.maxTicks;

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

    addPerson(person: NamedPoint) {
        const cell = this.getCell(person.position.x, person.position.y);
        if (cell) {
            if (cell.goals.length == 0) {
                cell.addPerson(person);
                if (!this.persons.some(p => p.id === person.id)) {
                    this.persons.push(person);
                }
            }
        }
    }   

    addGoal(goal: NamedPoint) {
        const cell = this.getCell(goal.position.x, goal.position.y);
        if (cell) {
            if (cell.persons.length == 0 && cell.goals.length == 0) {
                cell.addGoal(goal);
                this.goals.push(goal);
            }
        }
    }   

    setHotspots (hotspot: { x: number, y: number, usedTicks: number }) {
        const cell = this.getCell(hotspot.x, hotspot.y);
        if (cell) {
            cell.usedTicks = hotspot.usedTicks;
        }
    }

    getDataForBackend() {
        const persons: NamedPoint[] = [];
        this.cells.forEach(row =>
            row.forEach(cell => {
                if (cell.persons && cell.persons.length > 0) {
                    persons.push(...cell.persons);
                }
            })
        );

        return {
            up_right_point: { x: this.width, y: this.height },
            down_left_point: { x: 0, y: 0 },
            borders: this.walls.map(wall => wall.toJSON()),
            persons: persons.map(person => ({
                id: person.id,
                position: person.position,
            })),
            goals: this.goals.map(goal => ({
                id: goal.id,
                position: goal.position,
            })),
            groups: this.groups.map(group => group.toJSON())
        };
    }
    getGroupsForBackend() {
        if (this.groups) {
            return this.groups.map(group => ({
                id: group.id,
                start_position: group.start_position,
                total_count: group.total_count,
                person_ids: group.person_ids || []
            }));
        } else {
            return []
        }
    }

    getAnimationDataForBackend(routes: any[], statistics: any, ticks: number = -1) {
    const cleanRoutes = routes.map(route => ({
        id: route.id,
        route: route.route
    }));

    const block = {
        borders: this.walls.map(wall => wall.toJSON()),
        persons: this.persons.map(person => ({
            id: person.id,
            position: person.position,
        })),
        goals: this.goals.map(goal => ({
            id: goal.id,
            position: goal.position,
        })),
        routes: cleanRoutes,
        ticks,
    };

    return {
        up_right_point: { x: this.width, y: this.height },
        down_left_point: { x: 0, y: 0 },
        blocks: [block],
        statistics,
    };
}


    markCell(x: number, y: number, cnt: number, tick: number) {
        const cell = this.getCell(x, this.cells.length - 1 - y); // Inverted y for now, needs to be refactored
        if (cell) {
            cell.mark(cnt, tick);
            this.maxTicks = Math.max(this.maxTicks, cell.usedTicks);
        }
    }

    reset() {
        this.cells.forEach(row => row.forEach(cell => cell.reset()));
        this.maxTicks = 0;
    }

}

export default Grid;