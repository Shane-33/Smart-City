# Timezone Groups

![npm](https://img.shields.io/npm/v/timezone-groups)

`timezone-groups` is a versatile NPM package that allows you to effortlessly generate timezone groups in both Node.js and browser environments. It supports multiple date libraries, including the option to create and use custom ones.

## Features

- Compatible with Node.js and the latest two browser versions.
- Supports various date libraries for generating groups, including the ability to use custom ones.
- Provides a command-line interface (CLI) for easy group generation.

## Installation

Install the package via NPM using the following command:

```bash
npm install timezone-groups
```

## CLI Usage

To generate timezone groups using the CLI, use the following command:

```bash
timezone-groups --start "2023-07-26" --days 1 --engine moment
```

Options:

- `--start`: The start reference date to generate the groups (defaults to now).
- `--days`: The number of days to consider for the DST groupings (defaults to 365).
- `--engine`: The date library to use for generating groups. Options include "moment", "luxon", "date-fns", "dayjs", "native" (defaults to moment).

The output will be a file named `timezone-groups_<engine>_timestamp.json`, which contains an array of objects with the following structure:

```json
{
    "labelTzIndices": [0, ..., 46],
    "tzs": ["America/Anguilla", ...,  "America/Tortola"]
}
```

## JavaScript Function

You can also use the package programmatically in your JavaScript code. Here's an example of how to do it:

```javascript
const timeZoneGroups = await groupTimeZones({
  startDate, // The start reference date to generate the groups (defaults to now).
  groupDateRange, // The number of days to consider for the DST groupings (defaults to 365).
  dateEngine, // The date engine instance used to generate groups. You can use the `createDateEngine` utility to create an engine from any of the supported engine values. Alternatively, a custom date engine instance used to generate groups.
});
```

## Notes

- IANA time zones are generated via `Intl.supportedValuesOf("timeZone")`.
- Label indices can be used to provide localized labels.
- Based on https://github.com/neogermi/timezone-grouping/ (many thanks to [@neogermi](https://github.com/neogermi)).
