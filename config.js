export const terrainCategories = {
  GW: ["GW_Layout 1.png",
              "GW_Layout 2.png",
              "GW_Layout 3.png",
              "GW_Layout 4.png",
              "GW_Layout 5.png",
              "GW_Layout 6.png",
              "GW_Layout 7.png",
              "GW_Layout 8.png"],
  WTC_Crucible_of_Battle: ["WTC_Crucible of Battle 1.png",
              "WTC_Crucible of Battle 2.png",
              "WTC_Crucible of Battle 3.png",
              "WTC_Crucible of Battle 4 - 5.png",
              "WTC_Crucible of Battle 6.png",
              "WTC_Crucible of Battle 7.png",
              "WTC_Crucible of Battle 8.png"],
  WTC_Dawn_of_War: ["WTC_Dawn of War 1.png",
              "WTC_Dawn of War 2.png",
              "WTC_Dawn of War 3.png",
              "WTC_Dawn of War 4.png",
              "WTC_Dawn of War 5.png",
              "WTC_Dawn of War 6.png"],
  WTC_Search_and_Destroy: ["WTC_Search and Destroy 1.png",
              "WTC_Search and Destroy 2.png",
              "WTC_Search and Destroy 3.png",
              "WTC_Search and Destroy 4 - 5.png",
              "WTC_Search and Destroy 6.png",
              "WTC_Search and Destroy 7.png",
              "WTC_Search and Destroy 8.png"],
  WTC_Sweeping_Engagement: ["WTC_Sweeping Engagement 1.png",
              "WTC_Sweeping Engagement 2.png",
              "WTC_Sweeping Engagement 3.png",
              "WTC_Sweeping Engagement 4.png",
              "WTC_Sweeping Engagement 5.png",
              "WTC_Sweeping Engagement 6.png"],
  WTC_Tipping_Point: ["WTC_Tipping Point 1.png",
              "WTC_Tipping Point 2.png",
              "WTC_Tipping Point 3.png",
              "WTC_Tipping Point 4 - 5.png",
              "WTC_Tipping Point 6.png",
              "WTC_Tipping Point 7.png",
              "WTC_Tipping Point 8.png",]
};

const units = [];


function circlePoints(centerX, centerY, radius, segments = 60) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    pts.push(centerX + radius * Math.cos(angle));
    pts.push(centerY + radius * Math.sin(angle));
  }
  return pts;
}


const deploymentZones = [
  {
    name: 'None',
    lines: []
  },
  {
    name: 'Crucible of Battle',
    lines: [
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [0, height / 2, width, 0],
        stroke: 'red',
        strokeWidth: 3
      },
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [0, height, width, height / 2],
        stroke: 'blue',
        strokeWidth: 3
      },
    ]
  },
  {
    name: 'Dawn of War',
    lines: [
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [12 * pxPerInchWidth, 0, 12 * pxPerInchWidth, height],
        stroke: 'red',
        strokeWidth: 3
      },
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [32 * pxPerInchWidth, 0, 32 * pxPerInchWidth, height],
        stroke: 'blue',
        strokeWidth: 3
      }
    ]
  },
  {
    name: 'Hammer and Anvil',
    lines: [
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [0, 12 * pxPerInchHeight, width, 12 * pxPerInchHeight],
        stroke: 'red',
        strokeWidth: 3
      },
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [0, height - 12 * pxPerInchHeight, width, height - 12 * pxPerInchHeight],
        stroke: 'blue',
        strokeWidth: 3
      }
    ]
  },
  {
    name: 'Search and Destroy',
    lines: [
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [width /2, 0, width / 2, 21 * pxPerInchWidth],
        stroke: 'red',
        strokeWidth: 3
      },
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [0, height / 2, 13 * pxPerInchWidth, height / 2],
        stroke: 'red',
        strokeWidth: 3
      },
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [22 * pxPerInchWidth, height, 22 * pxPerInchWidth, 39 * pxPerInchWidth],
        stroke: 'blue',
        strokeWidth: 3
      },
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [width, height / 2, 31 * pxPerInchWidth, height / 2],
        stroke: 'blue',
        strokeWidth: 3
      },
      {
      isCircle: true,
      points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) =>
        circlePoints(centerX, centerY, 9 * pxPerInchWidth), // 6-inch radius
      stroke: 'green',
      strokeWidth: 3
      }
    ]
  },
  {
    name: 'Sweeping Engagement',
    lines: [
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [14 * pxPerInchWidth, 0, 14 * pxPerInchWidth, height / 2],
        stroke: 'red',
        strokeWidth: 3
      },
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [8 * pxPerInchWidth, height / 2, 14 * pxPerInchWidth, height / 2],
        stroke: 'red',
        strokeWidth: 3
      },
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [8 * pxPerInchWidth, height / 2, 8 * pxPerInchWidth, height],
        stroke: 'red',
        strokeWidth: 3
      },
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [36 * pxPerInchWidth, 0, 36 * pxPerInchWidth, height / 2],
        stroke: 'blue',
        strokeWidth: 3
      },
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [30 * pxPerInchWidth, height / 2, 36 * pxPerInchWidth, height / 2],
        stroke: 'blue',
        strokeWidth: 3
      },
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [30 * pxPerInchWidth, height / 2, 30 * pxPerInchWidth, height],
        stroke: 'blue',
        strokeWidth: 3
      },
    ]
  },
  {
    name: 'Tipping Point',
    lines: [
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [0, 20 * pxPerInchWidth, width / 2, 20 * pxPerInchWidth],
        stroke: 'red',
        strokeWidth: 3
      },
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [width / 2, 20 * pxPerInchWidth, width / 2, 12 * pxPerInchWidth],
        stroke: 'red',
        strokeWidth: 3
      },
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [width / 2, 12 * pxPerInchWidth, width, 12 * pxPerInchWidth],
        stroke: 'red',
        strokeWidth: 3
      },
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [0, 48 * pxPerInchWidth, width / 2, 48 * pxPerInchWidth],
        stroke: 'blue',
        strokeWidth: 3
      },
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [width / 2, 48 * pxPerInchWidth, width / 2, 40 * pxPerInchWidth],
        stroke: 'blue',
        strokeWidth: 3
      },
      {
        points: (width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) => [width / 2, 40 * pxPerInchWidth, width, 40 * pxPerInchWidth],
        stroke: 'blue',
        strokeWidth: 3
      },
    ]
  },
];

const objectiveLayouts = [
  {
    name: 'None',
    objectives: []
  },
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

// Load baseSizes as a promise
const baseSizesPromise = fetch('./baseSizes.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`Failed to load baseSizes.json: ${response.statusText}`);
    }
    return response.json();
  })
  .catch(error => {
    console.error('Error loading baseSizes.json:', error);
    return {}; // Fallback to empty object
  });

export { units, baseSizesPromise as baseSizes, deploymentZones, objectiveLayouts };