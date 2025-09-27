import { Grid } from '../models/Grid';

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


export const GetRoutesFromBackend = async (mapId: string): Promise<{id: number, route: string[]}[]> => {
    try {
        if (useFakeCalls) {
            return fakeGetRoutes(mapId);
        }
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

async function updateToRealBackend(mapId: string, grid: Grid): Promise<void> {
  const requestData = grid.getDataForBackend();
  const response = await fetch(`${BACKEND}/maps/${mapId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
  });
  if (!response.ok) {
      const t = await response.text().catch(() => '');
      throw new Error(`Ошибка обновления карты: ${response.status} ${t}`);
  }
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

function fakeUpdate(mapId: string, grid: Grid): void {
    const payload = grid.getDataForBackend();
    console.log('[FAKE updateMapInBackend] mapId:', mapId, 'payload:', payload);
}

