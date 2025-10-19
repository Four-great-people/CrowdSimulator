import { Grid } from '../models/Grid';
import Person from '../models/Person';

const useFakeCalls = process.env.MODE ? true : false

export const saveMapToBackend = async (grid: Grid): Promise<string> => {
    try {
        if (useFakeCalls) {
            return fakeSave(grid);
        }
        return await saveToRealBackend(grid);
    } catch (error) {
        throw error;
    }
};


export const updateMapInBackend = async (mapId: string, grid: Grid): Promise<void> => {
    try {
        if (useFakeCalls) {
            return fakeUpdate(mapId, grid);
        }
        return await updateToRealBackend(mapId, grid);
    } catch (error) {
        throw error;
    }
};


export const GetRoutesFromBackend = async (mapId: string): Promise<{ id: number, route: string[] }[]> => {
    try {
        if (useFakeCalls) {
            return fakeGetRoutes(mapId);
        }
        return await getRoutes(mapId);
    } catch (error) {
        throw error;
    }
};

export const GetMapsFromBackend = async (): Promise<string[]> => {
    try {
        if (useFakeCalls) {
            return fakeGetMaps();
        }
        return await getMaps();
    } catch (error) {
        throw error;
    }
}

export const GetMapFromBackend = async (mapId: string): Promise<Grid> => {
    try {
        let map;
        if (useFakeCalls) {
            map = fakeGetMap(mapId);
        } else {
            map = await getMap(mapId);
        }
        let width = map["up_right_point"]["x"];
        let height = map["up_right_point"]["y"];
        let newGrid = new Grid(width, height);
        map["borders"].forEach((border: { [x: string]: { [x: string]: number; }; }) => {
            newGrid.addWall(border["first"]["x"], border["first"]["y"], border["second"]["x"], border["second"]["y"]);
        });
        map["persons"].forEach((person: { position: { x: number; y: number; }; goal: { x: number; y: number; }; id: number }) => {
            const p = new Person(person["id"], person["position"], person["goal"]);
            newGrid.addPerson(p);
            newGrid.setGoal(person["goal"]);
        })
        return newGrid;
    } catch (error) {
        throw error;
    }
}

export const deleteMapFromBackend = async (mapId: string): Promise<void> => {
    try {
        if (useFakeCalls) {
            return fakeDelete(mapId);
        }
        return await deleteFromRealBackend(mapId);
    } catch (error) {
        throw error;
    }
};

async function getMaps() {
    const response = await fetch("http://localhost:5000/maps", { method: 'GET' });
    const data = await response.json();
    return data;
}

async function getMap(mapId: string) {
    const response = await fetch("http://localhost:5000/maps/" + mapId, { method: 'GET' });
    const data = await response.json();
    return data;
}

async function getRoutes(mapId: string): Promise<{ id: number, route: string[] }[]> {
    const response = await fetch("http://localhost:5000/maps/" + mapId + "/simulate", { method: 'POST' });
    const data = await response.json();
    console.log(data);
    return data;
}

async function saveToRealBackend(grid: Grid): Promise<string> {
    const requestData = grid.getDataForBackend();
    const response = await fetch("http://localhost:5000/maps", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
    });
    const data = await response.json();
    return data._id;
}

async function updateToRealBackend(mapId: string, grid: Grid): Promise<void> {
    const requestData = grid.getDataForBackend();
    const response = await fetch(`http://localhost:5000/maps/${mapId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
    });
    if (!response.ok) {
        const t = await response.text().catch(() => '');
        throw new Error(`Ошибка обновления карты: ${response.status} ${t}`);
    }
}

async function deleteFromRealBackend(mapId: string): Promise<void> {
    const res = await fetch(`http://localhost:5000/maps/${mapId}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) {
        const t = await res.text().catch(() => '');
        throw new Error(`Не удалось удалить карту: ${res.status} ${t}`);
    }
}

const fakeMapList = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "0",
    "1",
    "2",
    "3",
    "4",
    "0",
    "1",
    "2",
    "3",
    "4",
    "0",
    "1",
    "2",
    "3",
    "4",
    "0",
    "1",
    "2",
    "3",
    "4",
    "0",
    "1",
    "2",
    "3",
    "4",
    "0",
    "1",
    "2",
    "3",
    "4",
    "0",
    "1",
    "2",
    "3",
    "4",
    "0",
    "1",
    "2",
    "3",
    "4",
    "0",
    "1",
    "2",
    "3",
    "4",
    "0",
    "1",
    "2",
    "3",
    "4",
    "0",
    "1",
    "2",
    "3",
    "4",
]

function fakeGetMaps() {
    return fakeMapList
}

function fakeGetRoutes(mapId: string) {
    return [
        { "id": 1, "route": ["RIGHT", "RIGHT", "RIGHT"] },
        { "id": 2, "route": ["RIGHT_UP", "RIGHT", "RIGHT", "RIGHT"] },
        { "id": 3, "route": ["DOWN", "LEFT", "LEFT", "LEFT"] }
    ];
}

function fakeGetMap(mapId: string) {
    return {
        "up_right_point": { "x": 40, "y": 22 },
        "down_left_point": { "x": 0, "y": 0 },
        "borders": [
            { "first": { "x": 10, "y": 10 }, "second": { "x": 10, "y": 19 } },
            { "first": { "x": 10, "y": 10 }, "second": { "x": 19, "y": 10 } },
            { "first": { "x": 10, "y": 19 }, "second": { "x": 19, "y": 19 } },
            { "first": { "x": 19, "y": 10 }, "second": { "x": 19, "y": 19 } }
        ],
        "persons": [
            { "id": 1, "position": { "x": 15, "y": 15 }, "goal": { "x": 18, "y": 15 } },
            { "id": 2, "position": { "x": 14, "y": 16 }, "goal": { "x": 18, "y": 17 } },
            { "id": 3, "position": { "x": 13, "y": 13 }, "goal": { "x": 10, "y": 12 } }
        ]
    }
}

function fakeSave(grid: Grid) {
    const requestData = grid.getDataForBackend();
    console.log(requestData);
    const newId = String(fakeMapList.length)
    fakeMapList.push(newId)
    return newId;
}

function fakeUpdate(mapId: string, grid: Grid): void {
    const payload = grid.getDataForBackend();
    console.log('[FAKE updateMapInBackend] mapId:', mapId, 'payload:', payload);
}

function fakeDelete(mapId: string): void {
  const idx = fakeMapList.indexOf(mapId);
  if (idx !== -1) fakeMapList.splice(idx, 1);
}

