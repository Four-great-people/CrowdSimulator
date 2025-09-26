import { Grid } from '../models/Grid';

export const saveMapToBackend = async (grid: Grid): Promise<string> => {
    try {
        return await saveToRealBackend(grid);
    } catch (error) {
        throw error;
    }
};

export const GetRoutesFromBackend = async (mapId: string): Promise<{id: number, route: string[]}[]> => {
    try {
        return await getRoutes(mapId);
    } catch (error) {
        throw error;
    }
};

async function getRoutes(mapId: string): Promise<{id: number, route: string[]}[]> {
    const response = await fetch("http://localhost:5000/maps/" + mapId + "/simulate", { method: 'POST' });
    const data = await response.json();
    return data;
}

async function saveToRealBackend(grid: Grid): Promise<string> {
    const requestData = grid.getDataForBackend();
    const response = await fetch("http://localhost:5000/maps", {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(requestData)
    });
    const data = await response.json();
    return data._id;
}

function fakeGetRoutes(mapId: string) {
    return [
        { "id": 1, "route": ["RIGHT", "RIGHT", "RIGHT"] },
        { "id": 2, "route": ["RIGHT_UP", "RIGHT", "RIGHT", "RIGHT"] },
        { "id": 3, "route": ["DOWN", "LEFT", "LEFT", "LEFT"] }
    ];
}

function fakeSave(grid: Grid) {
    const requestData = grid.getDataForBackend();
    console.log(requestData);
    return "0";
}
