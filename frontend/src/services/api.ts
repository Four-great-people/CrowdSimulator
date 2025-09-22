import { Grid } from '../models/Grid';

export interface SaveMapResponse {
    mapId: string;
}

export const saveMapToBackend = async (grid: Grid): Promise<string> => {
    try {
        const requestData = grid.getDataForBackend();

        // const data: SaveMapResponse = await response.json();
        // return data.mapId;
        
        console.log(requestData);
        return "id-1234";
        
    } catch (error) {
        throw error;
    }
};

export const GetRoutesFromBackend = async (mapId: string): Promise<{id: number, route: string[]}[]> => {
    try {

        // Заглушка ответа
        return [
            { "id": 1, "route": ["RIGHT", "RIGHT", "RIGHT"] },
            { "id": 2, "route": ["UP", "RIGHT", "RIGHT", "RIGHT", "RIGHT"] },
            { "id": 3, "route": ["DOWN", "LEFT", "LEFT", "LEFT"] }
        ];
    } catch (error) {
        throw error;
    }
};