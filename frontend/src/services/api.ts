import { Grid } from '../models/Grid';
import Person from '../models/Person';

const useFakeCalls = process.env.MODE ? true : false

export interface MapAnimItem {
    id: string,
    name: string
}

export const saveMapToBackend = async (grid: Grid, name: string): Promise<string> => {
    try {
        if (useFakeCalls) {
            return fakeSave(grid, name);
        }
        return await saveToRealBackend(grid, name);
    } catch (error) {
        throw error;
    }
};


export const updateMapInBackend = async (mapId: string, grid: Grid, name: string): Promise<void> => {
    try {
        if (useFakeCalls) {
            return fakeUpdate(mapId, grid, name);
        }
        return await updateToRealBackend(mapId, grid, name);
    } catch (error) {
        throw error;
    }
};


export const GetStatisticsFromBackend = async (mapId: string): Promise<any> => {
    try {
        if (useFakeCalls) {
            return fakeGetRoutes(mapId);
        }
        return await getRoutes(mapId);
    } catch (error) {
        throw error;
    }
};

export const GetMapsFromBackend = async (): Promise<MapAnimItem[]> => {
    try {
        if (useFakeCalls) {
            return fakeGetMaps();
        }
        return await getMaps();
    } catch (error) {
        throw error;
    }
}

export const GetMapFromBackend = async (mapId: string): Promise<{grid: Grid, name: string}> => {
    try {
        let map;
        if (useFakeCalls) {
            map = fakeGetMap(mapId);
        } else {
            map = await getMap(mapId);
        }
        let width = map["up_right_point"]["x"];
        let height = map["up_right_point"]["y"];
        let name = map["name"] || "Без названия";   
        let newGrid = new Grid(width, height);
        map["borders"].forEach((border: { [x: string]: { [x: string]: number; }; }) => {
            newGrid.addWall(border["first"]["x"], border["first"]["y"], border["second"]["x"], border["second"]["y"]);
        });
        map["persons"].forEach((person: { position: { x: number; y: number; }; goal: { x: number; y: number; }; id: number }) => {
            const p = new Person(person["id"], person["position"], person["goal"]);
            newGrid.addPerson(p);
            newGrid.setGoal(person["goal"]);
        })
        return {grid: newGrid, name: name}
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

export const GetAnimationFromBackend = async (animationId: string): Promise<{grid: Grid, routes: any[], statistics: any, name: string}> => {
    try {
        const animationMap = await getAnimation(animationId);
        let width = animationMap["up_right_point"]["x"];
        let height = animationMap["up_right_point"]["y"];
        let newGrid = new Grid(width, height);
        let name = animationMap["name"] || "Без названия";
        animationMap["borders"].forEach((border: { [x: string]: { [x: string]: number; }; }) => {
            newGrid.addWall(border["first"]["x"], border["first"]["y"], border["second"]["x"], border["second"]["y"]);
        });
        animationMap["persons"].forEach((person: { position: { x: number; y: number; }; goal: { x: number; y: number; }; id: number}) => {
            const p = new Person(person["id"], person["position"], person["goal"]);
            newGrid.addPerson(p);
            newGrid.setGoal(person["goal"]);
        })

        return {
            grid: newGrid,
            routes: animationMap["routes"] || [],
            statistics: animationMap["statistics"] || {},
            name: name
        };
    } catch (error) {
        throw error;
    }
}

export const GetAnimationsFromBackend = async (): Promise<MapAnimItem[]> => {
    try {
        return await getAnimations();
    } catch (error) {
        throw error;
    }
}

export const saveAnimationToBackend = async (grid: Grid, routes: any[], statistics: any, name: string): Promise<string> => {
    try {
        return await saveAnimationToRealBackend(grid, routes, statistics, name);
    } catch (error) {
        throw error;
    }
};

export const updateAnimationInBackend = async (animId: string, name: string): Promise<void> => {
    try {
        return updateAnimationInRealBackend(animId, name);
    } catch (error) {
        throw error;
    }
}

async function getMaps(): Promise<MapAnimItem[]> {
    const response = await fetch("http://localhost:5000/maps", { method: 'GET' });
    const data = await response.json();
    return data;
}

async function getMap(mapId: string) {
    const response = await fetch("http://localhost:5000/maps/" + mapId, { method: 'GET' });
    const data = await response.json();
    return data;
}

async function getAnimations(): Promise<MapAnimItem[]> {
    const response = await fetch("http://localhost:5000/animations", { method: 'GET' });
    const data = await response.json();
    return data;
}

async function getAnimation(animationId: string) {
    const response = await fetch("http://localhost:5000/animations/" + animationId, { method: 'GET' });
    const data = await response.json();
    return data;
} 

async function saveAnimationToRealBackend(grid: Grid, routes: any[], statistics: any, name: string): Promise<string> {
    const animationData = {
        ...grid.getAnimationDataForBackend(routes, statistics),
        name: name
    };

    const response = await fetch("http://localhost:5000/animations", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(animationData)
    });
    const data = await response.json();
    return data._id;
}

async function getRoutes(mapId: string): Promise<{ id: number, route: string[] }[]> {
    const response = await fetch("http://localhost:5000/maps/" + mapId + "/statistics/dense", { method: 'GET' });
    const data = await response.json();
    console.log(data);
    return data;
}

async function saveToRealBackend(grid: Grid, name: string): Promise<string> {
    const requestData = {
        ...grid.getDataForBackend(),
        name: name
    }
    const response = await fetch("http://localhost:5000/maps", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
    });
    const data = await response.json();
    return data._id;
}

async function updateToRealBackend(mapId: string, grid: Grid, name: string): Promise<void> {
    const requestData = {
        ...grid.getDataForBackend(),
        name: name
    }
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

async function updateAnimationInRealBackend(animationId: string, name: string): Promise<void> {
    const updateData = {
        name: name
    };

    const response = await fetch(`http://localhost:5000/animations/${animationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
    });
    if (!response.ok) {
        const t = await response.text().catch(() => '');
        throw new Error(`Ошибка обновления анимации: ${response.status} ${t}`);
    }
}

const fakeMapList: MapAnimItem[] = [
    { id: "0", name: "0 - Без названия" },
    { id: "1", name: "1 - Без названия" },
    { id: "2", name: "2 - Без названия" },
    { id: "3", name: "3 - Без названия" },
    { id: "4", name: "4 - Без названия" },
    { id: "0", name: "0 - Без названия" },
    { id: "1", name: "1 - Без названия" },
    { id: "2", name: "2 - Без названия" },
    { id: "3", name: "3 - Без названия" },
    { id: "4", name: "4 - Без названия" },
    { id: "0", name: "0 - Без названия" },
    { id: "1", name: "1 - Без названия" },
    { id: "2", name: "2 - Без названия" },
    { id: "3", name: "3 - Без названия" },
    { id: "4", name: "4 - Без названия" },
    { id: "0", name: "0 - Без названия" },
    { id: "1", name: "1 - Без названия" },
    { id: "2", name: "2 - Без названия" },
    { id: "3", name: "3 - Без названия" },
    { id: "4", name: "4 - Без названия" },
    { id: "0", name: "0 - Без названия" },
    { id: "1", name: "1 - Без названия" },
    { id: "2", name: "2 - Без названия" },
    { id: "3", name: "3 - Без названия" },
    { id: "4", name: "4 - Без названия" },
    { id: "0", name: "0 - Без названия" },
    { id: "1", name: "1 - Без названия" },
    { id: "2", name: "2 - Без названия" },
    { id: "3", name: "3 - Без названия" },
    { id: "4", name: "4 - Без названия" },
    { id: "0", name: "0 - Без названия" },
    { id: "1", name: "1 - Без названия" },
    { id: "2", name: "2 - Без названия" },
    { id: "3", name: "3 - Без названия" },
    { id: "4", name: "4 - Без названия" },
    { id: "0", name: "0 - Без названия" },
    { id: "1", name: "1 - Без названия" },
    { id: "2", name: "2 - Без названия" },
    { id: "3", name: "3 - Без названия" },
    { id: "4", name: "4 - Без названия" },
    { id: "0", name: "0 - Без названия" },
    { id: "1", name: "1 - Без названия" },
    { id: "2", name: "2 - Без названия" },
    { id: "3", name: "3 - Без названия" },
    { id: "4", name: "4 - Без названия" },
    { id: "0", name: "0 - Без названия" },
    { id: "1", name: "1 - Без названия" },
    { id: "2", name: "2 - Без названия" },
    { id: "3", name: "3 - Без названия" },
    { id: "4", name: "4 - Без названия" },
    { id: "0", name: "0 - Без названия" },
    { id: "1", name: "1 - Без названия" },
    { id: "2", name: "2 - Без названия" },
    { id: "3", name: "3 - Без названия" },
    { id: "4", name: "4 - Без названия" },
    { id: "0", name: "0 - Без названия" },
    { id: "1", name: "1 - Без названия" },
    { id: "2", name: "2 - Без названия" },
    { id: "3", name: "3 - Без названия" },
    { id: "4", name: "4 - Без названия" },
];

function fakeGetMaps() {
    return fakeMapList
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
        ],
        "name": `Карта ${mapId}`
    }
}

function fakeSave(grid: Grid, name: string) {
    const requestData = grid.getDataForBackend();
    console.log(requestData);
    const newId = String(fakeMapList.length)
    fakeMapList.push({id: newId, name: name})
    return newId;
}

function fakeUpdate(mapId: string, grid: Grid, name: string): void {
    const payload = grid.getDataForBackend();
    console.log('[FAKE updateMapInBackend] mapId:', mapId, 'payload:', payload, 'name: ', name);
    const mapItem = fakeMapList.find(item => item.id === mapId);
    if (mapItem) {
        mapItem.name = name;
    }
}

function fakeDelete(mapId: string): void {
    const idx = fakeMapList.findIndex(item => item.id === mapId);
    if (idx !== -1) fakeMapList.splice(idx, 1);
}

