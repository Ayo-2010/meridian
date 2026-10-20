# Meridian

A daylight-saving-aware world clock and meeting planner for eight cities. Built with plain HTML, CSS and JavaScript.

**Live demo:** https://ayo-2010.github.io/meridian/

## Features

- Eight cities with live local times and time-zone labels
- One shared meeting hour, adjustable with a slider or the minus and plus controls
- Twenty-four-hour overlap timeline with working, awake and out-of-hours bands
- Working-hours count and a ranked list of the best cities for the chosen hour
- Add or remove cities, change the home city and move the meeting date forward or back
- Date-aware offsets that account for daylight saving changes
- Responsive layout down to 390px, reduced motion support and a global `[hidden]` rule

## Running it

Open `index.html` in a browser. There is no build step and no dependencies to install.

## Files

```
index.html
styles.css
app.js
```

## Tech

Plain HTML, CSS and JavaScript with the browser `Intl` time-zone data.
