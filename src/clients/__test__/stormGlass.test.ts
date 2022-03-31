import axios from 'axios';
import stormGlassWeather3HoursFixture from '@test/fixtures/stormglass_weather_3_hours.json';
import stormGlassNormalizedWeather3HoursFixture from '@test/fixtures/stormglass_normalized_response_3_hours.json';
import { StormGlass } from '@src/clients/stormGlass'

jest.mock('axios');

describe('StormGlass client', () => {
    it('should return the normalized forecast from the StormGlass service', async () => {
        const lat = -33.792726;
        const long = 151.289824;

        axios.get = jest.fn().mockResolvedValue(stormGlassWeather3HoursFixture);

        const stormGlass = new StormGlass(axios);
        const response = await stormGlass.fetchPoints(lat, long);
        expect(response).toEqual(stormGlassNormalizedWeather3HoursFixture);
    });
});