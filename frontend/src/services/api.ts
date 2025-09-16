import { Grid } from '../models/Grid';

export const SendGridDataToBackend = async (grid: Grid): Promise<void> => {
    try {
        const requestData = grid.getDataForBackend();      
        console.log(requestData);
        
    } catch (error) {
        throw error;
    }
};

export const GetRoutesFromBackend = async (): Promise<{id: number, route: string[]}[]> => {
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