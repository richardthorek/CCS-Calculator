# Chart.js Library

This folder contains the Chart.js library used for data visualization in the CCS Calculator.

## Version
- Chart.js v4.4.1

## Why included in source?
Chart.js is included as a UMD build in the source code to:
1. Avoid CDN dependencies and ensure offline functionality
2. Guarantee version consistency across deployments
3. Simplify deployment (no build step required)

## License
Chart.js is licensed under the MIT License.
See: https://github.com/chartjs/Chart.js/blob/master/LICENSE.md

## Updating
To update Chart.js:
1. Run `npm install chart.js@latest`
2. Copy `node_modules/chart.js/dist/chart.umd.js` to `src/lib/chart.js`
3. Update this README with the new version number
