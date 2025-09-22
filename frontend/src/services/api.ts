import { Grid } from '../models/Grid';

export const saveMapToBackend = async (grid: Grid): Promise<string> => {
    try {
        const requestData = grid.getDataForBackend();

        const response = await fetch("http://localhost:5000/maps", {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(requestData)
        });
        const data = await response.json();
        return data._id;
        
    } catch (error) {
        throw error;
    }
};

export const GetRoutesFromBackend = async (mapId: string): Promise<{id: number, route: string[]}[]> => {
    try {

        const response = await fetch("http://localhost:5000/maps/" + mapId + "/simulate", {method: 'POST'});
        const data = await response.json();
        return data;
        
    } catch (error) {
        throw error;
    }
};