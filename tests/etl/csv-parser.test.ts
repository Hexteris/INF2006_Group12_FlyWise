import { describe, expect, it } from 'vitest';
import {
  parseCsvLine,
  parseHHMM,
  parseFloatField,
  parseBooleanFlag,
  parseFlightRow,
  CSV_COLUMN_COUNT,
} from '../../src/etl/csv-parser.js';

describe('parseCsvLine', () => {
  it('splits a plain comma-separated line', () => {
    expect(parseCsvLine('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('preserves commas inside quoted fields', () => {
    const line = '2025-01-01,AA,1,JFK,"New York, NY",LAX,"Los Angeles, CA",659';
    const fields = parseCsvLine(line);
    expect(fields[4]).toBe('New York, NY');
    expect(fields[6]).toBe('Los Angeles, CA');
    expect(fields).toHaveLength(8);
  });

  it('handles a field that is entirely quoted with no comma', () => {
    expect(parseCsvLine('"Not Cancelled",0')).toEqual(['Not Cancelled', '0']);
  });
});

describe('parseHHMM', () => {
  it('parses a standard morning time', () => {
    expect(parseHHMM('659')).toBe(6 * 60 + 59);
  });

  it('parses a four-digit time', () => {
    expect(parseHHMM('1345')).toBe(13 * 60 + 45);
  });

  it('parses midnight as 0', () => {
    expect(parseHHMM('0')).toBe(0);
  });

  it('normalizes the BTS end-of-day sentinel 2400 to 0', () => {
    expect(parseHHMM('2400')).toBe(0);
  });

  it('rejects an out-of-range value', () => {
    expect(parseHHMM('2461')).toBeNull();
  });

  it('rejects a non-numeric value', () => {
    expect(parseHHMM('abcd')).toBeNull();
  });

  it('rejects an empty string', () => {
    expect(parseHHMM('')).toBeNull();
  });
});

describe('parseFloatField', () => {
  it('parses a float-formatted positive delay', () => {
    expect(parseFloatField('656.0')).toBe(656);
  });

  it('parses a float-formatted negative delay', () => {
    expect(parseFloatField('-3.0')).toBe(-3);
  });

  it('returns null for an empty field', () => {
    expect(parseFloatField('')).toBeNull();
  });
});

describe('parseBooleanFlag', () => {
  it('parses 0.0 as 0', () => {
    expect(parseBooleanFlag('0.0')).toBe(0);
  });

  it('parses 1.0 as 1', () => {
    expect(parseBooleanFlag('1.0')).toBe(1);
  });

  it('returns null for an empty field', () => {
    expect(parseBooleanFlag('')).toBeNull();
  });
});

describe('parseFlightRow', () => {
  const validFields = [
    '2025-01-01', 'AA', '1', 'JFK', 'New York, NY', 'LAX', 'Los Angeles, CA',
    '659', '656.0', '-3.0', '0.0', '1020', '1013.0', '-7.0', '0.0', '0.0',
    'Not Cancelled', '381.0', '377.0', '345.0', '2475.0', '0.0', '0.0', '0.0',
    '0.0', '0.0',
  ];

  it('parses a well-formed fixture row end to end', () => {
    expect(validFields).toHaveLength(CSV_COLUMN_COUNT);
    const result = parseFlightRow(validFields);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.row.flightDate).toBe('2025-01-01');
    expect(result.row.reportingAirline).toBe('AA');
    expect(result.row.origin).toBe('JFK');
    expect(result.row.originCityName).toBe('New York, NY');
    expect(result.row.crsDepTime).toBe(6 * 60 + 59);
    expect(result.row.crsArrTime).toBe(10 * 60 + 20); // CRSArrTime "1020" = 10:20
    expect(result.row.depDelay).toBe(-3);
    expect(result.row.depDel15).toBe(0);
    expect(result.row.cancellationCode).toBe('Not Cancelled');
    expect(result.row.distance).toBe(2475);
  });

  it('rejects a row with the wrong column count', () => {
    const result = parseFlightRow(['2025-01-01', 'AA']);
    expect(result.ok).toBe(false);
  });

  it('rejects a row with a malformed flight date', () => {
    const fields = [...validFields];
    fields[0] = 'not-a-date';
    const result = parseFlightRow(fields);
    expect(result.ok).toBe(false);
  });

  it('rejects a row with an unparseable scheduled departure time', () => {
    const fields = [...validFields];
    fields[7] = 'garbage';
    const result = parseFlightRow(fields);
    expect(result.ok).toBe(false);
  });

  it('accepts a row with missing outcome fields (falls back to null, not rejected)', () => {
    const fields = [...validFields];
    fields[8] = ''; // DepTime blank
    fields[13] = ''; // ArrDelay blank
    const result = parseFlightRow(fields);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row.depTime).toBeNull();
    expect(result.row.arrDelay).toBeNull();
  });
});
