import React from 'react';

/**
* @desc Wrapper for TileText to determine what time unit to display
* @param {Object} item
* @param {Number} index
* @param {Number} gridWidth
* @returns {Object} svg text DOM object
*/
const axisScaleTextElementWrapper = (item, index, gridWidth) => {
  let dateText = item.date;
  if (item.timeScale === 'hour') {
    let timeScaleUnit = item.dateObject.hours;
    dateText = timeScaleUnit === 12 ||
      timeScaleUnit === 6 ||
      timeScaleUnit === 18
      ? `${timeScaleUnit}:00`
      : item.date;
  }
  let xOffsetAdded = 8;
  if (item.timeScale === 'month' || item.timeScale === 'year') {
    xOffsetAdded = 5;
  }
  return (
    <React.Fragment>
      <text className="axis-grid-text" x="0" y="42"
        fill={item.withinRange ? 'white' : ''}
        transform={`translate(${(index * gridWidth) + xOffsetAdded}, 20)`}
        textRendering="optimizeSpeed" clipPath="url(#textDisplay)"
      >
        {dateText}
      </text>
    </React.Fragment>
  );
};

const TileText = ({ item, index, gridWidth }) => {
  return (
    axisScaleTextElementWrapper(item, index, gridWidth)
  );
};

export default TileText;
