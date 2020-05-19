import {
  forEach as lodashForEach,
  map as lodashMap,
} from 'lodash';
import { availableAtDate } from '../layers/util';

const periodIntervalMap = {
  daily: 'Day',
  monthly: 'Month',
  yearly: 'Year',
};

// WARNING: capitalizing certain props could break other parts of WV
// that read these props, need to watch for that when integrating this code
function capitalizeFirstLetter(string) {
  return !string ? '' : string.charAt(0).toUpperCase() + string.slice(1);
}

function setLayerProp (layer, prop, value) {
  if (prop === 'measurements' && (value && value.includes('Featured'))) {
    return;
  }
  if (layer[prop] && !layer[prop].includes(value)) {
    layer[prop].push(value);
  } else if (value) {
    layer[prop] = [value];
  }
}

function getMeasurementSourceFacetProps (layers, measurements) {
  lodashForEach(measurements, (measureObj, measureKey) => {
    lodashForEach(measureObj.sources, ({ settings }, sourceKey) => {
      settings.forEach((id) => {
        setLayerProp(layers[id], 'measurements', measureKey);
        setLayerProp(layers[id], 'sources', sourceKey);
      });
    });
  });
}

function getCategoryFacetProps (layers, measurements, categories) {
  lodashForEach(categories, (categoryObj, categoryKey) => {
    if (categoryKey === 'featured') {
      return;
    }
    lodashForEach(categoryObj, (subCategoryObj, subCategoryKey) => {
      if (subCategoryKey === 'All') {
        return;
      }
      subCategoryObj.measurements.forEach((measureKey) => {
        const { sources } = measurements[measureKey];
        lodashForEach(sources, ({ settings }) => {
          settings.forEach((id) => {
            setLayerProp(layers[id], 'categories', subCategoryKey);
          });
        });
      });
    });
  });
}

function getLayerPeriodFacetProps(layer) {
  const { period, dateRanges } = layer;
  if (!dateRanges) {
    layer.facetPeriod = capitalizeFirstLetter(period);
    return;
  }
  const dateIntervals = (dateRanges || []).map(({ dateInterval }) => dateInterval);
  const firstInterval = Number.parseInt(dateIntervals[0], 10);
  const consistentIntervals = dateIntervals.every((interval) => {
    const parsedInterval = Number.parseInt(interval, 10);
    return parsedInterval === firstInterval;
  });

  layer.facetPeriod = capitalizeFirstLetter(period);

  if (period === 'subdaily' || firstInterval === 1) {
    return;
  }

  if (consistentIntervals && firstInterval <= 16) {
    layer.facetPeriod = `${firstInterval}-${periodIntervalMap[period]}`;
  } else if (layer.id.includes('7Day')) {
    layer.facetPeriod = '7-Day';
  } else if (layer.id.includes('5Day')) {
    layer.facetPeriod = '5-Day';
  } else if (layer.id.includes('Monthly')) {
    layer.facetPeriod = 'Monthly';
  } else if (layer.id.includes('Weekly')) {
    layer.facetPeriod = '7-Day';
  } else {
    layer.facetPeriod = `Multi-${periodIntervalMap[period]}`;
  }
}

function formatFacetProps({ layers, measurements, categories }) {
  getMeasurementSourceFacetProps(layers, measurements);
  getCategoryFacetProps(layers, measurements, categories);
  return layers;
}

/**
 * Derive and format facet props from config
 * @param {*} config
 */
export default function buildLayerFacetProps(config, selectedDate) {
  const layers = formatFacetProps(config);

  return lodashMap(layers, (layer) => {
    layer.availableAtDate = availableAtDate(layer, selectedDate).toString();
    getLayerPeriodFacetProps(layer);
    if (layer.daynight && layer.daynight.length) {
      layer.daynight = layer.daynight.map(capitalizeFirstLetter);
    }
    return layer;
  });
}
