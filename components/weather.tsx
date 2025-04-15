'use client';

import cx from 'classnames';
import { format, isWithinInterval } from 'date-fns';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface WeatherAtLocation {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_units: {
    time: string;
    interval: string;
    temperature_2m: string;
  };
  current: {
    time: string;
    interval: number;
    temperature_2m: number;
  };
  hourly_units: {
    time: string;
    temperature_2m: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
  };
  daily_units: {
    time: string;
    sunrise: string;
    sunset: string;
  };
  daily: {
    time: string[];
    sunrise: string[];
    sunset: string[];
  };
}

const SAMPLE = {
  latitude: 37.763283,
  longitude: -122.41286,
  generationtime_ms: 0.027894973754882812,
  utc_offset_seconds: 0,
  timezone: 'GMT',
  timezone_abbreviation: 'GMT',
  elevation: 18,
  current_units: { time: 'iso8601', interval: 'seconds', temperature_2m: '°C' },
  current: { time: '2024-10-07T19:30', interval: 900, temperature_2m: 29.3 },
  hourly_units: { time: 'iso8601', temperature_2m: '°C' },
  hourly: {
    time: [
      '2024-10-07T00:00',
      '2024-10-07T01:00',
      '2024-10-07T02:00',
      '2024-10-07T03:00',
      '2024-10-07T04:00',
      '2024-10-07T05:00',
      '2024-10-07T06:00',
      '2024-10-07T07:00',
      '2024-10-07T08:00',
      '2024-10-07T09:00',
      '2024-10-07T10:00',
      '2024-10-07T11:00',
      '2024-10-07T12:00',
      '2024-10-07T13:00',
      '2024-10-07T14:00',
      '2024-10-07T15:00',
      '2024-10-07T16:00',
      '2024-10-07T17:00',
      '2024-10-07T18:00',
      '2024-10-07T19:00',
      '2024-10-07T20:00',
      '2024-10-07T21:00',
      '2024-10-07T22:00',
      '2024-10-07T23:00',
      '2024-10-08T00:00',
      '2024-10-08T01:00',
      '2024-10-08T02:00',
      '2024-10-08T03:00',
      '2024-10-08T04:00',
      '2024-10-08T05:00',
      '2024-10-08T06:00',
      '2024-10-08T07:00',
      '2024-10-08T08:00',
      '2024-10-08T09:00',
      '2024-10-08T10:00',
      '2024-10-08T11:00',
      '2024-10-08T12:00',
      '2024-10-08T13:00',
      '2024-10-08T14:00',
      '2024-10-08T15:00',
      '2024-10-08T16:00',
      '2024-10-08T17:00',
      '2024-10-08T18:00',
      '2024-10-08T19:00',
      '2024-10-08T20:00',
      '2024-10-08T21:00',
      '2024-10-08T22:00',
      '2024-10-08T23:00',
      '2024-10-09T00:00',
      '2024-10-09T01:00',
      '2024-10-09T02:00',
      '2024-10-09T03:00',
      '2024-10-09T04:00',
      '2024-10-09T05:00',
      '2024-10-09T06:00',
      '2024-10-09T07:00',
      '2024-10-09T08:00',
      '2024-10-09T09:00',
      '2024-10-09T10:00',
      '2024-10-09T11:00',
      '2024-10-09T12:00',
      '2024-10-09T13:00',
      '2024-10-09T14:00',
      '2024-10-09T15:00',
      '2024-10-09T16:00',
      '2024-10-09T17:00',
      '2024-10-09T18:00',
      '2024-10-09T19:00',
      '2024-10-09T20:00',
      '2024-10-09T21:00',
      '2024-10-09T22:00',
      '2024-10-09T23:00',
      '2024-10-10T00:00',
      '2024-10-10T01:00',
      '2024-10-10T02:00',
      '2024-10-10T03:00',
      '2024-10-10T04:00',
      '2024-10-10T05:00',
      '2024-10-10T06:00',
      '2024-10-10T07:00',
      '2024-10-10T08:00',
      '2024-10-10T09:00',
      '2024-10-10T10:00',
      '2024-10-10T11:00',
      '2024-10-10T12:00',
      '2024-10-10T13:00',
      '2024-10-10T14:00',
      '2024-10-10T15:00',
      '2024-10-10T16:00',
      '2024-10-10T17:00',
      '2024-10-10T18:00',
      '2024-10-10T19:00',
      '2024-10-10T20:00',
      '2024-10-10T21:00',
      '2024-10-10T22:00',
      '2024-10-10T23:00',
      '2024-10-11T00:00',
      '2024-10-11T01:00',
      '2024-10-11T02:00',
      '2024-10-11T03:00',
    ],
    temperature_2m: [
      36.6, 32.8, 29.5, 28.6, 29.2, 28.2, 27.5, 26.6, 26.5, 26, 25, 23.5, 23.9,
      24.2, 22.9, 21, 24, 28.1, 31.4, 33.9, 32.1, 28.9, 26.9, 25.2, 23, 21.1,
      19.6, 18.6, 17.7, 16.8, 16.2, 15.5, 14.9, 14.4, 14.2, 13.7, 13.3, 12.9,
      12.5, 13.5, 15.8, 17.7, 19.6, 21, 21.9, 22.3, 22, 20.7, 18.9, 17.9, 17.3,
      17, 16.7, 16.2, 15.6, 15.2, 15, 15, 15.1, 14.8, 14.8, 14.9, 14.7, 14.8,
      15.3, 16.2, 17.9, 19.6, 20.5, 21.6, 21, 20.7, 19.3, 18.7, 18.4, 17.9,
      17.3, 17, 17, 16.8, 16.4, 16.2, 16, 15.8, 15.7, 15.4, 15.4, 16.1, 16.7,
      17, 18.6, 19, 19.5, 19.4, 18.5, 17.9, 17.5, 16.7, 16.3, 16.1,
    ],
  },
  daily_units: {
    time: 'iso8601',
    sunrise: 'iso8601',
    sunset: 'iso8601',
  },
  daily: {
    time: [
      '2024-10-07',
      '2024-10-08',
      '2024-10-09',
      '2024-10-10',
      '2024-10-11',
    ],
    sunrise: [
      '2024-10-07T07:15',
      '2024-10-08T07:16',
      '2024-10-09T07:17',
      '2024-10-10T07:18',
      '2024-10-11T07:19',
    ],
    sunset: [
      '2024-10-07T19:00',
      '2024-10-08T18:58',
      '2024-10-09T18:57',
      '2024-10-10T18:55',
      '2024-10-11T18:54',
    ],
  },
};

function n(num: number): number {
  return Math.round(num * 10) / 10;
}

export function Weather({
  weatherAtLocation = SAMPLE,
}: {
  weatherAtLocation?: WeatherAtLocation;
}) {
  const [chartWidth, setChartWidth] = useState(0);
  const t = useTranslations('Weather');

  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById('weather-container');
      if (container) {
        setChartWidth(container.offsetWidth);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hourlyTimes = weatherAtLocation.hourly.time;
  const hourlyTemperatures = weatherAtLocation.hourly.temperature_2m;

  const times = hourlyTimes.slice(0, 24).map((time, i) => {
    return {
      time,
      temperature: hourlyTemperatures[i],
    };
  });

  const maxTemperature = Math.max(...times.map((t) => t.temperature));
  const minTemperature = Math.min(...times.map((t) => t.temperature));
  const temperatureRange = maxTemperature - minTemperature || 10;

  const sunrise = new Date(weatherAtLocation.daily.sunrise[0]);
  const sunset = new Date(weatherAtLocation.daily.sunset[0]);
  const now = new Date(weatherAtLocation.current.time);
  const isDaytime = isWithinInterval(now, { start: sunrise, end: sunset });

  const barSize = 9;
  const barSpacing = 4;
  const paddingX = 16;
  const chartHeight = 100;

  return (
    <div
      id="weather-container"
      className="py-4 bg-gradient-to-r rounded-xl from-background/75 dark:from-background/10 via-background dark:via-background/20 to-background/75 dark:to-background/10"
    >
      <div className="flex flex-col sm:flex-row gap-2 mx-6 sm:mx-8 mb-6">
        <div className="flex flex-col">
          <div className="text-sm text-muted-foreground">
            {t('current')}
          </div>
          <div className="flex flex-row items-center gap-2">
            <div className="text-xl font-medium">
              {n(weatherAtLocation.current.temperature_2m)}{' '}
              {weatherAtLocation.current_units.temperature_2m}
            </div>
            <div className="size-3 bg-sky-400 rounded-full" />
          </div>
        </div>

        <div className="flex flex-col sm:ml-8">
          <div className="text-sm text-muted-foreground">
            {t('forecast')}
          </div>
          <div className="flex flex-row items-center gap-2">
            <div
              className={
                isDaytime
                  ? 'text-sm rounded-full bg-yellow-500 px-2 py-0.5 text-black'
                  : 'text-sm rounded-full bg-blue-500 px-2 py-0.5 text-white'
              }
            >
              {isDaytime ? 'Day' : 'Night'}
            </div>
            <div
              className={cx('text-sm rounded-full px-2 py-0.5', {
                'bg-red-500 text-white':
                  weatherAtLocation.current.temperature_2m > 30,
                'bg-orange-500 text-white':
                  weatherAtLocation.current.temperature_2m > 20 &&
                  weatherAtLocation.current.temperature_2m <= 30,
                'bg-green-500 text-white':
                  weatherAtLocation.current.temperature_2m > 10 &&
                  weatherAtLocation.current.temperature_2m <= 20,
                'bg-blue-500 text-white':
                  weatherAtLocation.current.temperature_2m <= 10,
              })}
            >
              {weatherAtLocation.current.temperature_2m > 30
                ? 'Hot'
                : weatherAtLocation.current.temperature_2m > 20
                ? 'Warm'
                : weatherAtLocation.current.temperature_2m > 10
                ? 'Cool'
                : 'Cold'}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 mt-10 flex flex-col gap-0.5 px-10 overflow-x-scroll scrollbar-hide">
        <div className="relative h-[100px] w-full">
          {times.map((t, i) => {
            const hour = new Date(t.time).getHours();
            const formattedHour = hour === 0 ? '12am' : hour === 12 ? '12pm' : hour > 12 ? `${hour - 12}pm` : `${hour}am`;

            const height =
              ((t.temperature - minTemperature) / temperatureRange) *
                chartHeight || 0;

            const left = i * (barSize + barSpacing) + paddingX;

            const isNow =
              new Date(t.time).getHours() === new Date().getHours() &&
              new Date(t.time).getDate() === new Date().getDate();

            return (
              <div
                key={i}
                className="absolute flex flex-col items-center justify-end mb-8"
                style={{ left, height: chartHeight }}
              >
                <div
                  className={cx('w-2 rounded-sm', {
                    'bg-sky-400': !isNow,
                    'bg-blue-600': isNow,
                  })}
                  style={{ height: `${height}%` }}
                />
                <div
                  className={cx(
                    'text-[10px] font-medium absolute text-center w-8 whitespace-nowrap',
                    {
                      'text-foreground': isNow,
                      'text-muted-foreground': !isNow,
                    },
                  )}
                  style={{ bottom: -24 }}
                >
                  {formattedHour}
                </div>
                <div
                  className={cx(
                    'text-[11px] font-medium absolute text-center w-8 whitespace-nowrap',
                    {
                      'text-foreground': isNow,
                      'text-muted-foreground': !isNow,
                    },
                  )}
                  style={{ bottom: -42 }}
                >
                  {n(t.temperature)}°
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
