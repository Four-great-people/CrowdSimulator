export class Group {
    id: number;
    start_position: { x: number; y: number };
    total_count: number;
    person_ids: number[];

    constructor(id: number, start_position: { x: number; y: number }, total_count: number, person_ids: number[] = []) {
        this.id = id;
        this.start_position = start_position;
        this.total_count = total_count;
        this.person_ids = person_ids;
        
    }

    toJSON() {
        return {
            id: this.id,
            start_position: this.start_position,
            total_count: this.total_count,
            person_ids: this.person_ids
        };
    }

    clone(): Group {
        return new Group(
            this.id,
            { ...this.start_position },
            this.total_count,
            [...this.person_ids]
        );
    }
}

export default Group;