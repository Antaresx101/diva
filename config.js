const units = [];

const baseSizes = {
  "Lord Discordant on Helstalker": "140x80 mm",
  "Legionaries": "40 mm",
  "Helbrute": "100 mm",
  "Venomcrawler": "120 mm"
};

const deploymentZones = [
  {
    name: 'DZ 1',
    lines: [
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [0, 12 * pxPerInchHeight, width, 12 * pxPerInchHeight],
        stroke: 'blue',
        strokeWidth: 4
      },
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [0, height - 12 * pxPerInchHeight, width, height - 12 * pxPerInchHeight],
        stroke: 'red',
        strokeWidth: 4
      }
    ]
  },
  {
    name: 'DZ 2',
    lines: [
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [10 * pxPerInchWidth, 0, 10 * pxPerInchWidth, height],
        stroke: 'blue',
        strokeWidth: 4
      },
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [34 * pxPerInchWidth, 0, 34 * pxPerInchWidth, height],
        stroke: 'red',
        strokeWidth: 4
      }
    ]
  },
  {
    name: 'DZ 3',
    lines: [
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [0, 0, centerX, centerY],
        stroke: 'blue',
        strokeWidth: 4
      },
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [width, 0, centerX, centerY],
        stroke: 'red',
        strokeWidth: 4
      },
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [0, height, centerX, centerY],
        stroke: 'green',
        strokeWidth: 4
      },
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [width, height, centerX, centerY],
        stroke: 'yellow',
        strokeWidth: 4
      }
    ]
  }
];

const objectiveLayouts = [
  {
    name: 'Obj 1',
    objectives: [
      { x: 22, y: 30, radius: 3 },
      { x: 12, y: 12, radius: 3 },
      { x: 32, y: 12, radius: 3 },
      { x: 12, y: 48, radius: 3 },
      { x: 32, y: 48, radius: 3 }
    ]
  },
  {
    name: 'Obj 2',
    objectives: [
      { x: 11, y: 20, radius: 3 },
      { x: 22, y: 20, radius: 3 },
      { x: 33, y: 20, radius: 3 },
      { x: 11, y: 40, radius: 3 },
      { x: 22, y: 40, radius: 3 },
      { x: 33, y: 40, radius: 3 }
    ]
  },
  {
    name: 'Obj 3',
    objectives: [
      { x: 22, y: 30, radius: 3 },
      { x: 14.7, y: 20, radius: 3 },
      { x: 29.3, y: 20, radius: 3 },
      { x: 14.7, y: 40, radius: 3 },
      { x: 29.3, y: 40, radius: 3 }
    ]
  }
];

export { units, baseSizes, deploymentZones, objectiveLayouts };