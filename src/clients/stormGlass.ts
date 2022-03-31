import { AxiosStatic } from 'axios';
import config, { IConfig } from 'config';
import { InternalError } from '@src/util/errors/internal-error';

export interface StormGlassPointSource {
	[key: string]: number;
}

export interface StormGlassPoint {
	time: string;
	readonly waveHeight: StormGlassPointSource;
	readonly waveDirection: StormGlassPointSource;
	readonly swellDirection: StormGlassPointSource;
	readonly swellHeight: StormGlassPointSource;
	readonly swellPeriod: StormGlassPointSource;
	readonly windDirection: StormGlassPointSource;
	readonly windSpeed: StormGlassPointSource;
}

export interface StormGlassForecastResponse {
	hours: StormGlassPoint[];
}

export interface ForecastPoint {
	time: string;
	waveHeight: number;
	waveDirection: number;
	swellDirection: number;
	swellHeight: number;
	swellPeriod: number;
	windDirection: number;
	windSpeed: number;
}

/**
 * This error type is used when something breaks before the request reaches out to the StormGlass API
 * eg: Network error, or request validation error
 */
export class ClientRequestError extends InternalError {
	constructor(message: string) {
		const internalMessage = 'Unexpected error when trying to communicate to StormGlass';
		super(`${internalMessage}: ${message}`);
	}
}

export class StormGlassResponseError extends InternalError {
	constructor(message: string) {
		const internalMessage = 'Unexpected error returned by the StormGlass service';
		super(`${internalMessage}: ${message}`);
	}
}

/**
 * We could have proper type for the configuration
 */
const stormglassResourceConfig: IConfig = config.get('App.resources.StormGlass');

export class StormGlass {
	readonly stormGlassApiParams =
		'swellDirection,swellHeight,swellPeriod,waveDirection,waveHeight,windDirection,windSpeed';

	readonly stormGlassApiSource = 'noaa';

	constructor(protected request: AxiosStatic) { }

	public async fetchPoints(lat: number, long: number): Promise<ForecastPoint[]> {
		try {
			const response = await this.request.get(
				`${stormglassResourceConfig.get('apiUrl')}/weather/point?params=${this.stormGlassApiParams}&source=${this.stormGlassApiSource}&lat=${lat}&lng=${long}`,
				{
					headers: {
						Authorization: stormglassResourceConfig.get('apiToken')
					}
				}
			);

			return this.normalizeResponse(response.data);
		}
		catch (err: any) {
			if (err.response && err.response.status) {
				throw new StormGlassResponseError(`Error: ${JSON.stringify(err.response.data)} Code: ${err.response.status}`);
			}
			throw new ClientRequestError(err.message);
		}
	}

	private normalizeResponse(points: StormGlassForecastResponse): ForecastPoint[] {
		return points.hours.filter(this.isValidPoint.bind(this)).map((point) => ({
			swellDirection: point.swellDirection[this.stormGlassApiSource],
			swellHeight: point.swellHeight[this.stormGlassApiSource],
			swellPeriod: point.swellPeriod[this.stormGlassApiSource],
			time: point.time,
			waveDirection: point.waveDirection[this.stormGlassApiSource],
			waveHeight: point.waveHeight[this.stormGlassApiSource],
			windDirection: point.windDirection[this.stormGlassApiSource],
			windSpeed: point.windSpeed[this.stormGlassApiSource],
		}));
	}

	private isValidPoint(point: Partial<StormGlassPoint>): boolean {
		return !!(
			point.time &&
			point.swellDirection?.[this.stormGlassApiSource] &&
			point.swellHeight?.[this.stormGlassApiSource] &&
			point.swellPeriod?.[this.stormGlassApiSource] &&
			point.waveDirection?.[this.stormGlassApiSource] &&
			point.waveHeight?.[this.stormGlassApiSource] &&
			point.windDirection?.[this.stormGlassApiSource] &&
			point.windSpeed?.[this.stormGlassApiSource]
		);
	}
}