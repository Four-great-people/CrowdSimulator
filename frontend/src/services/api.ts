import { Grid } from '../models/Grid';
import NamedPoint from '../models/NamedPoint';
import Group from '../models/Group';

const useFakeCalls = process.env.MODE ? true : false;
const API_BASE_URL = 'http://localhost:5000';
const AUTH_TOKEN_KEY = 'auth_token';

export interface MapAnimItem {
    id: string;
    name: string;
}

interface AuthResponse {
    access_token: string;
    error?: string;
    message?: string;
}

export interface AnimationBlockFrontend {
    grid: Grid;
    routes: any[];
    ticks: number;
}


export const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token: string | null): void => {
    if (typeof window === 'undefined') return;
    if (token) {
        window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
    }
};

export const isAuthenticated = (): boolean => {
    if (useFakeCalls) {
        return true;
    }
    return !!getAuthToken();
};

export const logoutUser = (): void => {
    setAuthToken(null);
};

const buildHeaders = (extra: Record<string, string> = {}): Record<string, string> => {
    const headers: Record<string, string> = { ...extra };
    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

export const registerUser = async (username: string, password: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    let data: any = {};
    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        const message = data.error || data.message || 'Ошибка регистрации';
        throw new Error(message);
    }

    const authData = data as AuthResponse;

    if (!authData.access_token) {
        throw new Error('Некорректный ответ сервера при регистрации');
    }

    setAuthToken(authData.access_token);
};

export const loginUser = async (username: string, password: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    let data: any = {};
    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        const message = data.error || data.message || 'Ошибка входа';
        throw new Error(message);
    }

    const authData = data as AuthResponse;
    if (!authData.access_token) {
        throw new Error('Некорректный ответ сервера при входе');
    }

    setAuthToken(authData.access_token);
};



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

export const updateMapInBackend = async (
    mapId: string,
    grid: Grid,
    name: string
): Promise<void> => {
    try {
        if (useFakeCalls) {
            return fakeUpdate(mapId, grid, name);
        }
        return await updateToRealBackend(mapId, grid, name);
    } catch (error) {
        throw error;
    }
};

export const GetStatisticsFromBackend = async (
    mapId: string,
    algoName: string
): Promise<any> => {
    try {
        if (useFakeCalls) {
            return fakeGetRoutes(mapId);
        }
        return await getRoutes(mapId, algoName);
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
};

export const GetMapFromBackend = async (
    mapId: string
): Promise<{ grid: Grid; name: string }> => {
    try {
        let map: any;
        if (useFakeCalls) {
            map = fakeGetMap(mapId);
        } else {
            map = await getMap(mapId);
        }
        const name = map['name'] || 'Без названия';
        return { grid: createGridByMap(map), name: name };
    } catch (error) {
        throw error;
    }
};

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




export const GetAnimationFromBackend = async (
    animationId: string
): Promise<{ name: string; statistics: any; blocks: AnimationBlockFrontend[] }> => {
    try {
        if (useFakeCalls) {
            const map = fakeGetMap('');
            const routesObj = fakeGetRoutes('');
            const grid = createGridByMap(map);
            const singleBlock: AnimationBlockFrontend = {
                grid,
                routes: routesObj.routes || [],
                ticks: -1,
            };
            return {
                name: 'Без названия',
                statistics: {
                    ideal: routesObj.ideal,
                    valid: routesObj.valid,
                },
                blocks: [singleBlock],
            };
        }

        const animation = await getAnimation(animationId);
        const name = animation['name'] || 'Без названия';

        const upRight = animation['up_right_point'];
        const downLeft = animation['down_left_point'];
        const blocksRaw: any[] = Array.isArray(animation['blocks'])
            ? animation['blocks']
            : [];

        const blocks: AnimationBlockFrontend[] = blocksRaw.map((block) => {
            const mapForGrid = {
                up_right_point: upRight,
                down_left_point: downLeft,
                borders: block['borders'] || [],
                persons: block['persons'] || [],
                goals: block['goals'] || [],
                groups: block['groups'] || [],
            };

            const grid = createGridByMap(mapForGrid);
            const routes = (block['routes'] || []).map((r: any) => ({
                id: r.id,
                route: Array.isArray(r.route) ? [...r.route] : r.route,
            }));

            return {
                grid,
                routes,
                ticks:
                    typeof block['ticks'] === 'number'
                        ? block['ticks']
                        : -1,
            };
        });

        const statistics = animation['statistics'] || {};

        return {
            name,
            statistics,
            blocks,
        };
    } catch (error) {
        throw error;
    }
};

export const GetAnimationsFromBackend = async (): Promise<MapAnimItem[]> => {
    try {
        if (useFakeCalls) {
            return fakeGetAnimations();
        }
        return await getAnimations();
    } catch (error) {
        throw error;
    }
};


export const saveAnimationToBackend = async (
    grid: Grid,
    routesOrBlocks: any[],
    statistics: any,
    name: string
): Promise<string> => {
    try {
        if (useFakeCalls) {
            return fakeSaveAnimation();
        }
        return await saveAnimationToRealBackend(grid, routesOrBlocks, statistics, name);
    } catch (error) {
        throw error;
    }
};

export const updateAnimationInBackend = async (
    animId: string,
    name: string
): Promise<void> => {
    try {
        return updateAnimationInRealBackend(animId, name);
    } catch (error) {
        throw error;
    }
};

export const deleteAnimationFromBackend = async (
    animationId: string
): Promise<void> => {
    try {
        if (useFakeCalls) {
            return fakeDeleteAnimation(animationId);
        }
        return await deleteAnimationReal(animationId);
    } catch (error) {
        throw error;
    }
};


export const GetUnsavedAnimationStatisticsFromBackend = async (
    grid: Grid,
    algoName: string
): Promise<any> => {
    try {
        if (useFakeCalls) {
            return fakeGetRoutes('');
        }
        return await getUnsavedAnimationStatistics(grid, algoName);
    } catch (error) {
        throw error;
    }
};


export const GetSavedAnimationStatisticsFromBackend = async (
    animationId: string,
    algoName: string,
    grid: Grid,
    ticks: number
): Promise<any> => {
    try {
        if (useFakeCalls) {
            return fakeGetRoutes('');
        }
        return await getSavedAnimationStatisticsReal(
            animationId,
            algoName,
            grid,
            ticks
        );
    } catch (error) {
        throw error;
    }
};



async function getMaps(): Promise<MapAnimItem[]> {
    const response = await fetch(`${API_BASE_URL}/maps`, {
        method: 'GET',
        headers: buildHeaders(),
    });
    const data = await response.json();
    return data;
}

async function getMap(mapId: string) {
    const response = await fetch(`${API_BASE_URL}/maps/${mapId}`, {
        method: 'GET',
        headers: buildHeaders(),
    });
    const data = await response.json();
    return data;
}

async function getAnimations(): Promise<MapAnimItem[]> {
    const response = await fetch(`${API_BASE_URL}/animations`, {
        method: 'GET',
        headers: buildHeaders(),
    });
    const data = await response.json();
    return data;
}

async function getAnimation(animationId: string) {
    const response = await fetch(`${API_BASE_URL}/animations/${animationId}`, {
        method: 'GET',
        headers: buildHeaders(),
    });
    const data = await response.json();
    return data;
}


async function saveAnimationToRealBackend(
    grid: Grid,
    routesOrBlocks: any[],
    statistics: any,
    name: string
): Promise<string> {
    const baseData = grid.getDataForBackend();

    let blocksPayload: any[] = [];

    if (routesOrBlocks.length > 0 && routesOrBlocks[0]?.grid) {
        
        const blocks = routesOrBlocks as AnimationBlockFrontend[];
        blocksPayload = blocks.map((block) => {
            const blockData = block.grid.getDataForBackend();
            return {
                borders: blockData.borders || [],
                persons: blockData.persons || [],
                goals: blockData.goals || [],
                groups: blockData.groups || [],
                routes: (block.routes || []).map((r: any) => ({
                    id: r.id,
                    route: r.route,
                })),
                ticks:
                    typeof block.ticks === 'number'
                        ? block.ticks
                        : -1,
            };
        });
    } else {
        
        const data = grid.getDataForBackend();
        blocksPayload = [
            {
                borders: data.borders || [],
                persons: data.persons || [],
                goals: data.goals || [],
                groups: data.groups || [],
                routes: (routesOrBlocks || []).map((r: any) => ({
                    id: r.id,
                    route: r.route,
                })),
                ticks: -1,
            },
        ];
    }

    const animationData = {
        name,
        up_right_point: baseData.up_right_point,
        down_left_point: baseData.down_left_point,
        blocks: blocksPayload,
        statistics,
    };

    const response = await fetch(`${API_BASE_URL}/animations`, {
        method: 'POST',
        headers: buildHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(animationData),
    });
    const data = await response.json();
    return data._id;
}

async function getRoutes(
    mapId: string,
    algoName: string
): Promise<{ id: number; route: string[] }[]> {
    const response = await fetch(
        `${API_BASE_URL}/maps/${mapId}/statistics/${algoName}`,
        {
            method: 'GET',
            headers: buildHeaders(),
        }
    );
    const data = await response.json();
    return data;
}

async function saveToRealBackend(grid: Grid, name: string): Promise<string> {
    const requestData = {
        ...grid.getDataForBackend(),
        name: name,
    };
    const response = await fetch(`${API_BASE_URL}/maps`, {
        method: 'POST',
        headers: buildHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(requestData),
    });
    const data = await response.json();
    return data._id;
}

async function updateToRealBackend(
    mapId: string,
    grid: Grid,
    name: string
): Promise<void> {
    const requestData = {
        ...grid.getDataForBackend(),
        name: name,
    };
    const response = await fetch(`${API_BASE_URL}/maps/${mapId}`, {
        method: 'PUT',
        headers: buildHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(requestData),
    });
    if (!response.ok) {
        const t = await response.text().catch(() => '');
        throw new Error(`Ошибка обновления карты: ${response.status} ${t}`);
    }
}

async function deleteFromRealBackend(mapId: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/maps/${mapId}`, {
        method: 'DELETE',
        headers: buildHeaders(),
    });
    if (!res.ok && res.status !== 204) {
        const t = await res.text().catch(() => '');
        throw new Error(`Не удалось удалить карту: ${res.status} ${t}`);
    }
}

async function updateAnimationInRealBackend(
    animationId: string,
    name: string
): Promise<void> {
    const updateData = {
        name: name,
    };

    const response = await fetch(`${API_BASE_URL}/animations/${animationId}`, {
        method: 'PUT',
        headers: buildHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(updateData),
    });
    if (!response.ok) {
        const t = await response.text().catch(() => '');
        throw new Error(`Ошибка обновления анимации: ${response.status} ${t}`);
    }
}

async function deleteAnimationReal(animationId: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/animations/${animationId}`, {
        method: 'DELETE',
        headers: buildHeaders(),
    });
    if (!res.ok && res.status !== 204) {
        const t = await res.text().catch(() => '');
        throw new Error(`Не удалось удалить анимацию: ${res.status} ${t}`);
    }
}



function buildBlockFromGrid(grid: Grid) {
    const data = grid.getDataForBackend();
    return {
        borders: data.borders || [],
        persons: data.persons || [],
        goals: data.goals || [],
        routes: [],
        groups: data.groups || [],
    };
}

async function getUnsavedAnimationStatistics(
    grid: Grid,
    algoName: string
): Promise<any> {
    const data = grid.getDataForBackend();

    const payload = {
        up_right_point: data.up_right_point,
        down_left_point: data.down_left_point,
        block: buildBlockFromGrid(grid),
    };

    const response = await fetch(
        `${API_BASE_URL}/animations/statistics/${algoName}`,
        {
            method: 'POST',
            headers: buildHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(payload),
        }
    );

    const json = await response.json();
    if (!response.ok) {
        const msg =
            (json && (json.error || json.message)) ||
            'Ошибка получения статистики анимации';
        throw new Error(msg);
    }
    return json;
}

async function getSavedAnimationStatisticsReal(
    animationId: string,
    algoName: string,
    grid: Grid,
    ticks: number
): Promise<any> {
    const payload = {
        block: buildBlockFromGrid(grid),
        ticks,
    };

    const response = await fetch(
        `${API_BASE_URL}/animations/${animationId}/statistics/${algoName}`,
        {
            method: 'POST',
            headers: buildHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(payload),
        }
    );

    const json = await response.json();
    if (!response.ok) {
        const msg =
            (json && (json.error || json.message)) ||
            'Ошибка получения статистики сохранённой анимации';
        throw new Error(msg);
    }
    return json;
}



const fakeMapList: MapAnimItem[] = [
    { id: '0', name: '0 - Без названия' },
    { id: '1', name: '1 - Без названия' },
    { id: '2', name: '2 - Без названия' },
    { id: '3', name: '3 - Без названия' },
    { id: '4', name: '4 - Без названия' },
];

function createGridByMap(map: any) {
    const width = map['up_right_point']['x'];
    const height = map['up_right_point']['y'];
    const newGrid = new Grid(width, height);
    (map['borders'] || []).forEach(
        (border: { [x: string]: { [x: string]: number } }) => {
            newGrid.addWall(
                border['first']['x'],
                border['first']['y'],
                border['second']['x'],
                border['second']['y']
            );
        }
    );
    if (map['groups'] && Array.isArray(map['groups'])) {
        map['groups'].forEach((group: any) => {
            const g = new Group(
                group['id'],
                group['start_position'],
                group['total_count'],
                group['person_ids'] || []
            );
            newGrid.addGroup(g);
        });
    }
    (map['persons'] || []).forEach(
        (person: {
            position: { x: number; y: number };
            goal: { x: number; y: number };
            id: number;
        }) => {
            const p = new NamedPoint(person['id'], person['position']);
            newGrid.addPerson(p);
        }
    );
    (map['goals'] || []).forEach(
        (goal: { position: { x: number; y: number }; id: number }) => {
            const g = new NamedPoint(goal['id'], goal['position']);
            newGrid.addGoal(g);
        }
    );
    return newGrid;
}

function fakeGetMaps() {
    return fakeMapList;
}

function fakeGetAnimations() {
    return fakeMapList;
}

function fakeSaveAnimation() {
    const newId = String(fakeMapList.length);
    return newId;
}

function fakeGetRoutes(mapId: string) {
    return {
        ideal: {
            value: null,
            problematic: 10,
        },
        valid: {
            value: 25,
            problematic: 2,
        },
        routes: [
            { id: 1, route: ['RIGHT', 'RIGHT', 'RIGHT'] },
            { id: 2, route: ['RIGHT_UP', 'RIGHT', 'RIGHT', 'RIGHT'] },
            { id: 3, route: ['DOWN', 'LEFT', 'LEFT', 'LEFT'] },
        ],
    };
}

function fakeGetMap(mapId: string) {
    return {
        up_right_point: { x: 40, y: 22 },
        down_left_point: { x: 0, y: 0 },
        borders: [
            { first: { x: 10, y: 10 }, second: { x: 10, y: 19 } },
            { first: { x: 10, y: 10 }, second: { x: 19, y: 10 } },
            { first: { x: 10, y: 19 }, second: { x: 19, y: 19 } },
            { first: { x: 19, y: 10 }, second: { x: 19, y: 19 } },
        ],
        persons: [
            { id: 1, position: { x: 15, y: 15 } },
            { id: 2, position: { x: 14, y: 16 } },
            { id: 3, position: { x: 13, y: 13 } },
        ],
        goals: [
            { id: 1, position: { x: 18, y: 15 } },
            { id: 2, position: { x: 18, y: 17 } },
            { id: 3, position: { x: 10, y: 12 } },
        ],
        name: `Карта ${mapId}`,
    };
}

function fakeSave(grid: Grid, name: string) {
    const requestData = grid.getDataForBackend();
    console.log(requestData);
    const newId = String(fakeMapList.length);
    fakeMapList.push({ id: newId, name: name });
    return newId;
}

function fakeUpdate(mapId: string, grid: Grid, name: string): void {
    const payload = grid.getDataForBackend();
    console.log(
        '[FAKE updateMapInBackend] mapId:',
        mapId,
        'payload:',
        payload,
        'name: ',
        name
    );
    const mapItem = fakeMapList.find((item) => item.id === mapId);
    if (mapItem) {
        mapItem.name = name;
    }
}

function fakeDelete(mapId: string): void {
    const idx = fakeMapList.findIndex((item) => item.id === mapId);
    if (idx !== -1) fakeMapList.splice(idx, 1);
}

function fakeDeleteAnimation(animationId: string): void {
    const idx = fakeMapList.findIndex((item) => item.id === animationId);
    if (idx !== -1) fakeMapList.splice(idx, 1);
}
