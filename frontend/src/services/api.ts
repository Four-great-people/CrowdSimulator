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


export const GetStatisticsFromBackend = async (mapId: string, algoName: string): Promise<any> => {
    try {
        if (useFakeCalls) {
            return fakeGetRoutes(mapId);
        }
        return await getRoutes(mapId, algoName);
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
        return createGridByMap(map);
    } catch (error) {
        throw error;
    }
}

export const deleteMapFromBackend = async (mapId: string): Promise<void> => {
    try {
        if (useFakeCalls) {
            return fakeDelete(mapId);
        }
        return await deleteFromRealBackend(mapId);} catch (error) {
        throw error;
    }
};

export const GetAnimationFromBackend = async (animationId: string): Promise<{grid: Grid, routes: any[], statistics: any}> => {
    try {
        if (useFakeCalls) {
            const map = fakeGetMap("")
            return {
                grid: createGridByMap(map),
                routes: fakeGetRoutes("")["routes"] || [],
                statistics: fakeGetRoutes("") || {}
            };
        }
        const animationMap = await getAnimation(animationId);
        let newGrid = createGridByMap(animationMap);
        return {
            grid: newGrid,
            routes: animationMap["routes"] || [],
            statistics: animationMap["statistics"] || {}
        };
    } catch (error) {
        throw error;
    }
}

export const GetAnimationsFromBackend = async (): Promise<string[]> => {
    try {
        if (useFakeCalls) {
            return fakeGetAnimations();
        }
        return await getAnimations();
    } catch (error) {
        throw error;
    }
}

export const saveAnimationToBackend = async (grid: Grid, routes: any[], statistics: any): Promise<string> => {
    try {
        if (useFakeCalls) {
            return fakeSaveAnimation();
        }
        return await saveAnimationToRealBackend(grid, routes, statistics);
    } catch (error) {
        throw error;
    }
};

export const deleteAnimationFromBackend = async (animationId: string): Promise<void> => {
    try {
        if (useFakeCalls) {
            return fakeDeleteAnimation(animationId);
        }
        return await deleteAnimationReal(animationId);
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

async function getAnimations() {
    const response = await fetch("http://localhost:5000/animations", { method: 'GET' });
    const data = await response.json();
    return data;
}

async function getAnimation(animationId: string) {
    const response = await fetch("http://localhost:5000/animations/" + animationId, { method: 'GET' });
    const data = await response.json();
    return data;
} 

async function saveAnimationToRealBackend(grid: Grid, routes: any[], statistics: any): Promise<string> {
    const animationData = grid.getAnimationDataForBackend(routes, statistics);
    const response = await fetch("http://localhost:5000/animations", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(animationData)
    });
    const data = await response.json();
    return data._id;
}

async function getRoutes(mapId: string, algoName: string): Promise<{ id: number, route: string[] }[]> {
    const response = await fetch("http://localhost:5000/maps/" + mapId + "/statistics/" + algoName, { method: 'GET' });
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

function createGridByMap(map: any) {
    let width = map["up_right_point"]["x"];
    let height = map["up_right_point"]["y"];
    let newGrid = new Grid(width, height);
    map["borders"].forEach((border: { [x: string]: { [x: string]: number; }; }) => {
        newGrid.addWall(border["first"]["x"], border["first"]["y"], border["second"]["x"], border["second"]["y"]);
    });
    map["persons"].forEach((person: { position: { x: number; y: number; }; goal: { x: number; y: number; }; id: number; }) => {
        const p = new Person(person["id"], person["position"], person["goal"]);
        newGrid.addPerson(p);
        newGrid.setGoal(person["goal"]);
    });
    return newGrid;
}

async function deleteAnimationReal(animationId: string): Promise<void> {
    const res = await fetch(`http://localhost:5000/animations/${animationId}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) {
        const t = await res.text().catch(() => '');
        throw new Error(`Не удалось удалить анимацию: ${res.status} ${t}`);
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

function fakeGetAnimations() {
    return fakeMapList;
}

function fakeSaveAnimation() {
    const newId = String(fakeMapList.length)
    return newId
}

function fakeGetRoutes(mapId: string) {
    return {
    "ideal": {
        "value": null,
        "problematic": 10,
    },
    "valid": {
        "value": 25,
        "problematic": 2,
    },
    "routes": [
        { "id": 1, "route": ["RIGHT", "RIGHT", "RIGHT"] },
        { "id": 2, "route": ["RIGHT_UP", "RIGHT", "RIGHT", "RIGHT"] },
        { "id": 3, "route": ["DOWN", "LEFT", "LEFT", "LEFT"] }
    ]};
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

function fakeDeleteAnimation(animationId: string): void {
    const idx = fakeMapList.indexOf(animationId);
    if (idx !== -1) fakeMapList.splice(idx, 1);
}
