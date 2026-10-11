import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type HourlyMarine = {
  time?: string[];
  wave_height?: Array<number | null>;
  swell_wave_height?: Array<number | null>;
  swell_wave_direction?: Array<number | null>;
  swell_wave_period?: Array<number | null>;
  sea_surface_temperature?: Array<number | null>;
  sea_level_height_msl?: Array<number | null>;
  ocean_current_velocity?: Array<number | null>;
};

type HourlyWeather = {
  time?: string[];
  wind_speed_10m?: Array<number | null>;
  wind_direction_10m?: Array<number | null>;
};

type OfficialStation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

type OfficialPoint = [timestamp: number, value: number | null, ...metadata: number[]];

// Coastal stations exposed by the Belgian OD Nature marine forecasting centre.
// Using the closest local station avoids Open-Meteo's offshore grid snapping.
const OFFICIAL_STATIONS: OfficialStation[] = [
  { id: "3", name: "Blankenberge", latitude: 51.3, longitude: 3.12 },
  { id: "9", name: "Bredene", latitude: 51.23, longitude: 2.97 },
  { id: "22", name: "Knokke", latitude: 51.33, longitude: 3.28 },
  { id: "23", name: "Koksijde", latitude: 51.12, longitude: 2.63 },
  { id: "25", name: "Middelkerke", latitude: 51.18, longitude: 2.82 },
  { id: "28", name: "Newport", latitude: 51.15, longitude: 2.71667 },
  { id: "30", name: "Ostend", latitude: 51.2333, longitude: 2.91667 },
  { id: "36", name: "Zeebrugge", latitude: 51.35, longitude: 3.2 }
];

function closestOfficialStation(latitude: number, longitude: number) {
  return OFFICIAL_STATIONS.reduce((closest, station) => {
    const distance = (station.latitude - latitude) ** 2 + (station.longitude - longitude) ** 2;
    const closestDistance =
      (closest.latitude - latitude) ** 2 + (closest.longitude - longitude) ** 2;
    return distance < closestDistance ? station : closest;
  });
}

function belgianLocalParts(timestamp: number) {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date(timestamp)).map((part) => [part.type, part.value])
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute)
  };
}

function officialPointAt(points: OfficialPoint[], date: string, time: string) {
  const [hour = 12, minute = 0] = time.split(":").map(Number);
  const targetMinutes = hour * 60 + minute;
  let closest: OfficialPoint | null = null;
  let difference = Number.POSITIVE_INFINITY;

  points.forEach((point) => {
    const local = belgianLocalParts(point[0]);
    if (local.date !== date || typeof point[1] !== "number") return;
    const candidateDifference = Math.abs(local.minutes - targetMinutes);
    if (candidateDifference < difference) {
      closest = point;
      difference = candidateDifference;
    }
  });

  return closest;
}

async function officialWaveForecast(
  station: OfficialStation,
  date: string,
  time: string
) {
  const body = new URLSearchParams({
    type: "forecast",
    simple: "1",
    variable: "36",
    stationGroup: station.id
  });
  const response = await fetch(
    "https://odnature.naturalsciences.be/marine-forecasting-centre/ajax/getTimeSeries",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body,
      cache: "no-store"
    }
  );

  if (!response.ok) return null;
  const points = (await response.json()) as OfficialPoint[];
  const point = officialPointAt(points, date, time);
  if (!point || typeof point[1] !== "number") return null;

  return {
    waveHeight: point[1],
    sourceTime: new Date(point[0]).toISOString(),
    station
  };
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`));
}

function targetIndex(times: string[], date: string, time: string) {
  const [targetHour = 12, targetMinute = 0] = time.split(":").map(Number);
  const targetMinutes = targetHour * 60 + targetMinute;
  let bestIndex = 0;
  let bestDifference = Number.POSITIVE_INFINITY;

  times.forEach((value, index) => {
    if (!value.startsWith(`${date}T`)) return;
    const [hour = 0, minute = 0] = value.slice(11, 16).split(":").map(Number);
    const difference = Math.abs(hour * 60 + minute - targetMinutes);

    if (difference < bestDifference) {
      bestIndex = index;
      bestDifference = difference;
    }
  });

  return bestIndex;
}

function valueAt(values: Array<number | null> | undefined, index: number) {
  const value = values?.[index];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function waveSize(height: number | null) {
  if (height === null) return "";
  if (height < 0.4) return "XS";
  if (height < 0.8) return "S";
  if (height < 1) return "S-M";
  if (height < 1.3) return "M";
  if (height < 1.6) return "M-L";
  if (height < 2) return "L";
  if (height < 3) return "XL";
  return "XXL";
}

function cardinalDirection(degrees: number | null) {
  if (degrees === null) return "";
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(((degrees % 360) + 360) % 360 / 45) % 8] ?? "";
}

function angularDistance(first: number, second: number) {
  const distance = Math.abs(first - second) % 360;
  return Math.min(distance, 360 - distance);
}

const DEFAULT_FACING: Record<string, number> = { BE: 315, FR: 270, ES: 0, PT: 270 };

function spotTimeZone(countryCode: string, region: string | null) {
  if (countryCode === "ES" && region === "Canary Islands") return "Atlantic/Canary";
  if (countryCode === "PT" && region === "Azores") return "Atlantic/Azores";
  if (countryCode === "PT" && region === "Madeira") return "Atlantic/Madeira";
  if (countryCode === "PT") return "Europe/Lisbon";
  if (countryCode === "ES") return "Europe/Madrid";
  if (countryCode === "FR") return "Europe/Paris";
  return "Europe/Brussels";
}

function windType(speed: number | null, direction: number | null, coastDirection: number) {
  if (speed === null || direction === null) return "";
  if (speed < 5) return "Glassy";

  // Wind direction is where the wind comes from; coastDirection is the bearing the beach faces.
  const difference = angularDistance(direction, coastDirection);
  if (difference <= 30) return "Onshore";
  if (difference <= 90) return "Cross-on";
  if (difference < 150) return "Cross-off";
  return "Offshore";
}

function currentType(speed: number | null) {
  if (speed === null) return "";
  if (speed < 0.5) return "None";
  if (speed < 1.5) return "Light";
  return "Strong";
}

function tideType(values: Array<number | null> | undefined, index: number) {
  const numericValues = (values ?? []).filter((value): value is number => typeof value === "number");
  const current = valueAt(values, index);
  if (current === null || !numericValues.length) return "";

  const minimum = Math.min(...numericValues);
  const maximum = Math.max(...numericValues);
  const range = maximum - minimum;
  const position = range ? (current - minimum) / range : 0.5;

  if (position <= 0.18) return "Low";
  if (position >= 0.82) return "High";

  const previous = valueAt(values, Math.max(0, index - 1));
  const next = valueAt(values, Math.min((values?.length ?? 1) - 1, index + 1));
  if (previous !== null && next !== null) {
    if (next > previous) return "Rising";
    if (next < previous) return "Dropping";
  }

  return "Mid";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const spotId = url.searchParams.get("spotId") ?? "";
  const date = url.searchParams.get("date") ?? "";
  const time = url.searchParams.get("time") || "12:00";

  if (!spotId || !isIsoDate(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return NextResponse.json({ error: "Paramètres incomplets." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { data: spot, error: spotError } = await supabase
    .from("spots")
    .select("id,name,latitude,longitude,country_code,region,facing_deg")
    .eq("id", spotId)
    .single();

  if (spotError || !spot) {
    return NextResponse.json({ error: "Spot introuvable." }, { status: 404 });
  }

  if (spot.latitude === null || spot.longitude === null) {
    return NextResponse.json({ error: "Les coordonnées de ce spot restent à confirmer." }, { status: 422 });
  }

  const isBelgianSpot = spot.country_code === "BE";
  const officialStation = isBelgianSpot ? closestOfficialStation(spot.latitude, spot.longitude) : null;
  const timeZone = spotTimeZone(spot.country_code, spot.region);
  // Per-spot orientation (spots.facing_deg); the country default is only a fallback for spots without one.
  const coastDirection = spot.facing_deg ?? DEFAULT_FACING[spot.country_code] ?? 270;

  const marineUrl = new URL("https://marine-api.open-meteo.com/v1/marine");
  marineUrl.search = new URLSearchParams({
    latitude: String(spot.latitude),
    longitude: String(spot.longitude),
    hourly: [
      "wave_height",
      "swell_wave_height",
      "swell_wave_direction",
      "swell_wave_period",
      "sea_surface_temperature",
      "sea_level_height_msl",
      "ocean_current_velocity"
    ].join(","),
    start_date: date,
    end_date: date,
    timezone: timeZone,
    cell_selection: "sea"
  }).toString();

  const fiveDaysAgo = new Date();
  fiveDaysAgo.setUTCHours(0, 0, 0, 0);
  fiveDaysAgo.setUTCDate(fiveDaysAgo.getUTCDate() - 5);
  const requestedDate = new Date(`${date}T12:00:00Z`);
  const weatherBase = requestedDate < fiveDaysAgo
    ? "https://archive-api.open-meteo.com/v1/archive"
    : "https://api.open-meteo.com/v1/forecast";
  const weatherUrl = new URL(weatherBase);
  weatherUrl.search = new URLSearchParams({
    latitude: String(spot.latitude),
    longitude: String(spot.longitude),
    hourly: "wind_speed_10m,wind_direction_10m",
    start_date: date,
    end_date: date,
    timezone: timeZone
  }).toString();

  try {
    const [marineResponse, weatherResponse, officialForecast] = await Promise.all([
      fetch(marineUrl, { next: { revalidate: 1800 } }),
      fetch(weatherUrl, { next: { revalidate: 1800 } }),
      officialStation ? officialWaveForecast(officialStation, date, time).catch(() => null) : Promise.resolve(null)
    ]);

    if (!marineResponse.ok || !weatherResponse.ok) {
      return NextResponse.json(
        { error: "Conditions indisponibles pour cette date." },
        { status: 502 }
      );
    }

    const marine = (await marineResponse.json()) as {
      hourly?: HourlyMarine;
      utc_offset_seconds?: number;
    };
    const weather = (await weatherResponse.json()) as { hourly?: HourlyWeather };
    const times = marine.hourly?.time ?? [];
    const index = targetIndex(times, date, time);
    const weatherIndex = targetIndex(weather.hourly?.time ?? [], date, time);
    const openMeteoWaveHeight = valueAt(marine.hourly?.wave_height, index);
    const waveHeight = officialForecast?.waveHeight ?? openMeteoWaveHeight;
    const swellHeight = valueAt(marine.hourly?.swell_wave_height, index);
    const swellDirection = valueAt(marine.hourly?.swell_wave_direction, index);
    const swellPeriod = valueAt(marine.hourly?.swell_wave_period, index);
    const waterTemperature = valueAt(marine.hourly?.sea_surface_temperature, index);
    const seaLevel = valueAt(marine.hourly?.sea_level_height_msl, index);
    const currentSpeed = valueAt(marine.hourly?.ocean_current_velocity, index);
    const windSpeed = valueAt(weather.hourly?.wind_speed_10m, weatherIndex);
    const windDirection = valueAt(weather.hourly?.wind_direction_10m, weatherIndex);

    if (!times.length || waveHeight === null) {
      return NextResponse.json(
        { error: "Aucune donnée marine disponible pour cette date." },
        { status: 404 }
      );
    }

    const localSourceTime = times[index] ?? `${date}T${time}`;
    const openMeteoSourceTime = new Date(
      Date.parse(`${localSourceTime}:00Z`) - (marine.utc_offset_seconds ?? 0) * 1000
    ).toISOString();
    const sourceTime = officialForecast?.sourceTime ?? openMeteoSourceTime;

    return NextResponse.json({
      spot: { id: spot.id, name: spot.name },
      source: officialForecast ? "od-nature+open-meteo" : "open-meteo",
      sourceTime,
      officialStation: officialForecast
        ? {
            id: officialForecast.station.id,
            name: officialForecast.station.name,
            latitude: officialForecast.station.latitude,
            longitude: officialForecast.station.longitude
          }
        : null,
      raw: {
        waveHeight,
        swellHeight,
        swellDirection,
        swellPeriod,
        waterTemperature,
        seaLevel,
        currentSpeed,
        windSpeed,
        windDirection
      },
      suggestions: {
        waveSize: waveSize(waveHeight),
        swellDirection: cardinalDirection(swellDirection),
        windType: windType(windSpeed, windDirection, coastDirection),
        waterTemp: waterTemperature === null ? "" : String(Math.round(waterTemperature)),
        current: currentType(currentSpeed),
        tide: tideType(marine.hourly?.sea_level_height_msl, index)
      }
    });
  } catch {
    return NextResponse.json(
      { error: "Impossible de contacter le service de conditions marines." },
      { status: 502 }
    );
  }
}
