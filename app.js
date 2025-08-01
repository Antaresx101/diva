const terrainImage = new Image();
terrainImage.onload = function() {
  // Get container dimensions
  const container = document.getElementById('container');
  const containerRect = container.getBoundingClientRect();
  let width = containerRect.width;
  let height = containerRect.height;

  // 44:60 aspect ratio
  const targetAspect = 44 / 60;
  if (width / height > targetAspect) {
    width = height * targetAspect;
  } else {
    height = width / targetAspect;
  }

  // Set stage size
  const stage = new Konva.Stage({
    container: 'container',
    width: width,
    height: height
  });

  // Calculate pixels per inch (44x60 inch table)
  const pxPerInchWidth = width / 44;
  const pxPerInchHeight = height / 60;

  // Table center in pixels
  const centerX = width / 2;
  const centerY = height / 2;

  // Remove Later
  console.log('Viewport:', { width: window.innerWidth, height: window.innerHeight });
  console.log('Container rect:', { width: containerRect.width, height: containerRect.height });
  console.log('Stage dimensions:', { width, height, pxPerInchWidth, pxPerInchHeight });
  console.log('Stage position:', { x: stage.x(), y: stage.y() });

  // Layers
  const terrainLayer = new Konva.Layer();
  const objectiveLayer = new Konva.Layer();
  const zoneLayer = new Konva.Layer();
  const unitLayer = new Konva.Layer();
  stage.add(terrainLayer, objectiveLayer, zoneLayer, unitLayer);

  // Add terrain image
  const terrain = new Konva.Image({
    image: terrainImage,
    x: 0,
    y: 0,
    width: width,
    height: height
  });
  terrainLayer.add(terrain);
  console.log('Terrain image position:', { x: terrain.x(), y: terrain.y(), width: terrain.width(), height: terrain.height() });

  // Unit list
  const units = [
    { name: 'Character', shape: 'circle', radius: 1, color: 'purple', modelCount: 1 },
    { name: 'Infantry', shape: 'circle', radius: 0.65, color: 'blue', modelCount: 10 },
    { name: 'Mounted', shape: 'ellipse', radiusX: 1.5, radiusY: 0.85, color: 'green', modelCount: 5 },
    { name: 'Tank', shape: 'rectangle', width: 5, height: 3, color: 'red', modelCount: 1 }
  ];

  // Unit dropdown
  const unitSelect = document.getElementById('unit-select');
  units.forEach(unit => {
    const option = document.createElement('option');
    option.value = unit.name;
    option.textContent = unit.name;
    unitSelect.appendChild(option);
  });

  // Track drag mode
  let groupDragMode = true;
  let activeRotatingGroup = null;
  let activeRotatingShape = null;

  // Update drag mode
  function updateDragMode(isGroupMode) {
    console.log('Updating drag mode:', isGroupMode ? 'Group' : 'Model');
    groupDragMode = isGroupMode;
    unitLayer.getChildren(group => group instanceof Konva.Group).forEach(group => {
      group.draggable(false); // Disable default dragging
      group.getChildren(node => node instanceof Konva.Circle || node instanceof Konva.Ellipse || node instanceof Konva.Rect).forEach(shape => {
        shape.draggable(!isGroupMode);
      });
    });
    unitLayer.draw();
    document.getElementById('toggle-drag-mode').textContent = groupDragMode ? 'Move Group' : 'Move Models';
  }

  // Get bounding box for a shape (handles rotation)
  function getShapeBounds(shape) {
    const rect = shape.getClientRect({ relativeTo: shape.getParent() });
    return {
      left: rect.x,
      right: rect.x + rect.width,
      top: rect.y,
      bottom: rect.y + rect.height
    };
  }

  // Snap shape to edges
  function snapToEdge(draggedShape, group) {
    const boundsA = getShapeBounds(draggedShape);
    let minDist = Infinity;
    let bestPos = { x: draggedShape.x(), y: draggedShape.y() };

    group.getChildren(node => node !== draggedShape && (node instanceof Konva.Circle || node instanceof Konva.Ellipse || node instanceof Konva.Rect)).forEach(other => {
      const boundsB = getShapeBounds(other);

      // Check for overlap using AABB
      if (boundsA.left < boundsB.right && boundsA.right > boundsB.left && boundsA.top < boundsB.bottom && boundsA.bottom > boundsB.top) {
        // Calculate translations to resolve overlap
        const translations = [
          { x: boundsB.right - boundsA.left, y: 0 }, // Move right
          { x: boundsB.left - boundsA.right, y: 0 }, // Move left
          { x: 0, y: boundsB.bottom - boundsA.top }, // Move down
          { x: 0, y: boundsB.top - boundsA.bottom } // Move up
        ];

        // Find smallest translation
        translations.forEach(t => {
          const dist = Math.hypot(t.x, t.y);
          if (dist < minDist) {
            minDist = dist;
            bestPos = { x: draggedShape.x() + t.x, y: draggedShape.y() + t.y };
          }
        });
      }
    });

    draggedShape.position(bestPos);
    console.log('Snapped shape to:', bestPos);
  }

  // Add unit to canvas
  function addUnit(unitName) {
    const unitData = units.find(u => u.name === unitName);
    if (!unitData) return;

    // Create group
    const group = new Konva.Group({
      x: 100,
      y: 100,
      draggable: false,
      rotation: 0
    });

    const modelCount = unitData.modelCount;
    const cols = Math.ceil(Math.sqrt(modelCount));
    const spacing = 0.1;
    let index = 0;
    const shapePositions = []; // Store absolute positions for centroid

    // Create shapes and track absolute positions
    for (let i = 0; i < modelCount; i++) {
      const row = Math.floor(index / cols);
      const col = index % cols;

      let shapeWidth = (unitData.shape === 'rectangle' ? unitData.width : unitData.shape === 'ellipse' ? unitData.radiusX * 2 : unitData.radius * 2) || 1;
      let shapeHeight = (unitData.shape === 'rectangle' ? unitData.height : unitData.shape === 'ellipse' ? unitData.radiusY * 2 : unitData.radius * 2) || 1;
      const offsetX = (col - (cols - 1) / 2) * (shapeWidth + spacing) * pxPerInchWidth;
      const offsetY = (row - (Math.ceil(modelCount / cols) - 1) / 2) * (shapeHeight + spacing) * pxPerInchHeight;

      let shape;
      switch (unitData.shape) {
        case 'circle':
          shape = new Konva.Circle({
            x: offsetX,
            y: offsetY,
            radius: unitData.radius * pxPerInchWidth,
            fill: unitData.color,
            fillEnabled: true,
            stroke: 'black',
            strokeWidth: 2,
            opacity: 0.8,
            draggable: !groupDragMode
          });
          break;
        case 'ellipse':
          shape = new Konva.Ellipse({
            x: offsetX,
            y: offsetY,
            radiusX: unitData.radiusX * pxPerInchWidth,
            radiusY: unitData.radiusY * pxPerInchHeight,
            fill: unitData.color,
            fillEnabled: true,
            stroke: 'black',
            strokeWidth: 2,
            opacity: 0.8,
            draggable: !groupDragMode,
            rotation: 0
          });
          break;
        case 'rectangle':
          shape = new Konva.Rect({
            x: offsetX,
            y: offsetY,
            width: unitData.width * pxPerInchWidth,
            height: unitData.height * pxPerInchHeight,
            offsetX: (unitData.width * pxPerInchWidth) / 2,
            offsetY: (unitData.height * pxPerInchHeight) / 2,
            fill: unitData.color,
            fillEnabled: true,
            stroke: 'black',
            strokeWidth: 2,
            opacity: 0.8,
            draggable: !groupDragMode,
            rotation: 0
          });
          break;
      }

      if (shape) {
        // Store absolute position (accounting for shape's offset)
        const absPos = {
          x: offsetX - (shape.offsetX() || 0),
          y: offsetY - (shape.offsetY() || 0)
        };
        shapePositions.push(absPos);

        // Dragging
        shape.on('dragstart', () => {
          console.log('Dragging model:', shape);
          shape.opacity(0.5);
          unitLayer.draw();
        });
        shape.on('dragend', () => {
          console.log('Model drag ended:', shape);
          shape.opacity(0.8);
          if (!groupDragMode) snapToEdge(shape, group);
          unitLayer.draw();
        });

        // Handle group dragging and shape rotation (desktop)
        shape.on('mousedown', e => {
          if (groupDragMode && e.evt.button === 0 && !activeRotatingGroup) { // Left-click in Group Drag Mode to drag group
            console.log('Left-click on shape in Group Drag Mode, dragging group:', group);
            group.startDrag();
          } else if (!groupDragMode && (unitData.shape === 'ellipse' || unitData.shape === 'rectangle') && e.evt.button === 2 && e.evt.shiftKey) { // Shift + right-click in Model Drag Mode
            e.evt.preventDefault();
            shape.rotation(shape.rotation() + 5);
            console.log('Rotated shape by 5 degrees, new angle:', shape.rotation());
            if (!groupDragMode) snapToEdge(shape, group);
            unitLayer.draw();
          }
        });

        // Mobile rotation for ellipses and rectangles in Model Drag Mode
        if (unitData.shape === 'ellipse' || unitData.shape === 'rectangle') {
          shape.on('dbltap', e => {
            e.evt.preventDefault();
            if (activeRotatingShape === shape) {
              // Exit rotation mode for this shape
              shape.opacity(0.8);
              activeRotatingShape = null;
              console.log('Mobile shape rotation ended:', shape);
              snapToEdge(shape, group);
            } else {
              // Exit rotation mode for previous shape, if any
              if (activeRotatingShape) {
                activeRotatingShape.opacity(0.8);
                snapToEdge(activeRotatingShape, activeRotatingShape.getParent());
                console.log('Mobile shape rotation switched from:', activeRotatingShape);
              }
              // Enter rotation mode for this shape
              activeRotatingShape = shape;
              shape.opacity(0.7);
              shape.draggable(false); // Disable dragging
              console.log('Mobile shape rotation started:', shape);
            }
            unitLayer.draw();
          });
        }

        group.add(shape);
      }
      index++;
    }

    // Calculate group centroid
    const centroid = shapePositions.reduce(
      (acc, pos) => ({
        x: acc.x + pos.x / shapePositions.length,
        y: acc.y + pos.y / shapePositions.length
      }),
      { x: 0, y: 0 }
    );

    // Adjust shape positions relative to centroid
    group.getChildren().forEach(shape => {
      shape.x(shape.x() - centroid.x);
      shape.y(shape.y() - centroid.y);
    });

    // Set group offset to centroid
    group.offsetX(centroid.x);
    group.offsetY(centroid.y);
    console.log('Group centroid offset:', { offsetX: centroid.x, offsetY: centroid.y });

    // Group rotation and dragging in Group Drag Mode (desktop)
    group.on('mousedown', e => {
      if (groupDragMode && !e.evt.shiftKey && e.evt.button === 0 && !activeRotatingGroup) { // Left-click without Shift to drag
        console.log('Left-click on group, starting drag:', group);
        group.startDrag();
      } else if (groupDragMode && e.evt.button === 2 && e.evt.shiftKey) { // Shift + right-click to rotate
        e.evt.preventDefault();
        group.rotation(group.rotation() + 5);
        console.log('Rotated group by 5 degrees, new angle:', group.rotation());
        group.getChildren(node => node instanceof Konva.Circle || node instanceof Konva.Ellipse || node instanceof Konva.Rect).forEach(shape => {
          snapToEdge(shape, group);
        });
        unitLayer.draw();
      }
    });

    // Mobile rotation for group (double-tap + tap)
    group.on('dbltap', e => {
      e.evt.preventDefault();
      console.log('Double-tap on group:', group);
      if (activeRotatingGroup === group) {
        // Exit rotation mode for this group
        group.opacity(1.0);
        activeRotatingGroup = null;
        console.log('Mobile group rotation ended:', group);
        group.getChildren(node => node instanceof Konva.Circle || node instanceof Konva.Ellipse || node instanceof Konva.Rect).forEach(shape => {
          snapToEdge(shape, group);
        });
      } else {
        // Exit rotation mode for previous group, if any
        if (activeRotatingGroup) {
          activeRotatingGroup.opacity(1.0);
          activeRotatingGroup.getChildren(node => node instanceof Konva.Circle || node instanceof Konva.Ellipse || node instanceof Konva.Rect).forEach(shape => {
            snapToEdge(shape, activeRotatingGroup);
          });
          console.log('Mobile group rotation switched from:', activeRotatingGroup);
        }
        // Enter rotation mode for this group
        activeRotatingGroup = group;
        group.opacity(0.7);
        group.draggable(false); // Disable dragging
        console.log('Mobile group rotation started:', group);
      }
      unitLayer.draw();
    });

    group.on('touchstart', e => {
      if (groupDragMode && e.evt.touches.length === 1 && !activeRotatingGroup) { // Single touch to drag, only if no group is rotating
        console.log('Single touch on group, starting drag:', group);
        group.draggable(true); // Enable dragging
        group.startDrag();
      }
    });

    group.on('dragstart', () => {
      if (!activeRotatingGroup) { // Only log drag if no group is rotating
        console.log('Dragging group:', group);
        group.opacity(0.6);
        unitLayer.draw();
      }
    });

    group.on('dragend', () => {
      if (!activeRotatingGroup) { // Only reset opacity if no group is rotating
        console.log('Group drag ended:', group);
        group.opacity(1.0);
        group.draggable(false); // Reset draggable state
        unitLayer.draw();
      }
    });

    unitLayer.add(group);
    unitLayer.draw();
  }

  // Handle single tap for rotation
  stage.on('tap', e => {
    console.log('Stage tap detected, groupDragMode:', groupDragMode, 'activeRotatingGroup:', activeRotatingGroup, 'activeRotatingShape:', activeRotatingShape);
    if (groupDragMode && activeRotatingGroup) {
      activeRotatingGroup.rotation(activeRotatingGroup.rotation() + 5);
      console.log('Mobile group rotated by 5 degrees, angle:', activeRotatingGroup.rotation());
      unitLayer.draw();
    } else if (!groupDragMode && activeRotatingShape) {
      activeRotatingShape.rotation(activeRotatingShape.rotation() + 5);
      console.log('Mobile shape rotated by 5 degrees, angle:', activeRotatingShape.rotation());
      snapToEdge(activeRotatingShape, activeRotatingShape.getParent());
      unitLayer.draw();
    }
  });

  // Add unit button click
  document.getElementById('add-unit').addEventListener('click', () => {
    const selectedUnit = unitSelect.value;
    if (selectedUnit) {
      addUnit(selectedUnit);
    }
  });

  // Toggle drag mode button click
  document.getElementById('toggle-drag-mode').addEventListener('click', () => {
    updateDragMode(!groupDragMode);
  });

  // Prevent default context menu on right-click
  stage.container().addEventListener('contextmenu', e => e.preventDefault());

  // Define deployment zones
  const deploymentZones = [
    {
      name: 'DZ 1',
      lines: [
        { points: [0, 12 * pxPerInchHeight, width, 12 * pxPerInchHeight], stroke: 'blue', strokeWidth: 4 },
        { points: [0, height - 12 * pxPerInchHeight, width, height - 12 * pxPerInchHeight], stroke: 'red', strokeWidth: 4 }
      ]
    },
    {
      name: 'DZ 2',
      lines: [
        { points: [10 * pxPerInchWidth, 0, 10 * pxPerInchWidth, height], stroke: 'blue', strokeWidth: 4 },
        { points: [34 * pxPerInchWidth, 0, 34 * pxPerInchWidth, height], stroke: 'red', strokeWidth: 4 }
      ]
    },
    {
      name: 'DZ 3',
      lines: [
        { points: [0, 0, centerX, centerY], stroke: 'blue', strokeWidth: 4 },
        { points: [width, 0, centerX, centerY], stroke: 'red', strokeWidth: 4 },
        { points: [0, height, centerX, centerY], stroke: 'green', strokeWidth: 4 },
        { points: [width, height, centerX, centerY], stroke: 'yellow', strokeWidth: 4 }
      ]
    }
  ];

  // Remove Later
  console.log('Deployment zones:', deploymentZones.map(zone => ({
    name: zone.name,
    lines: zone.lines.map(line => ({
      points: line.points,
      stroke: line.stroke
    }))
  })));

  // Define objective layouts
  const objectiveLayouts = [
    {
      name: 'Obj 1',
      objectives: [
        { x: 22, y: 30, radius: 3 },
        { x: 12, y: 12, radius: 3 },
        { x: 32, y: 12, shape: 'circle', radius: 3 },
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

  let currentZoneIndex = 0;
  let currentObjectiveIndex = 0;

  // Draw deployment zone
  function drawDeploymentZone() {
    zoneLayer.removeChildren();
    const zone = deploymentZones[currentZoneIndex];
    zone.lines.forEach(line => {
      const konvaLine = new Konva.Line({
        points: line.points,
        stroke: line.stroke,
        strokeWidth: line.strokeWidth,
        lineCap: 'round',
        lineJoin: 'round'
      });
      zoneLayer.add(konvaLine);
    });
    zoneLayer.draw();
    document.getElementById('cycle-zones').textContent = `Zone: ${zone.name}`;
    console.log('Drawing deployment zone:', zone.name, 'Lines:', zone.lines);
  }

  // Draw objective layout
  function drawObjectiveLayout() {
    objectiveLayer.removeChildren();
    const layout = objectiveLayouts[currentObjectiveIndex];
    layout.objectives.forEach(obj => {
      const radiusCircle = new Konva.Circle({
        x: obj.x * pxPerInchWidth,
        y: obj.y * pxPerInchHeight,
        radius: obj.radius * pxPerInchWidth,
        stroke: 'orange',
        strokeWidth: 2,
        fill: 'rgba(255, 165, 0, 0.2)'
      });
      const markerCircle = new Konva.Circle({
        x: obj.x * pxPerInchWidth,
        y: obj.y * pxPerInchHeight,
        radius: 0.5 * pxPerInchWidth,
        fill: 'orange'
      });
      objectiveLayer.add(radiusCircle, markerCircle);
    });
    objectiveLayer.draw();
    document.getElementById('cycle-objectives').textContent = `Objectives: ${layout.name}`;
    console.log('Drawing objective layout:', layout.name);
  }

  // Initial draws
  console.log('Drawing layers:', { width, height, centerX, centerY });
  drawObjectiveLayout();
  drawDeploymentZone();
  terrainLayer.draw();
  unitLayer.draw();

  // Cycle deployment zones
  document.getElementById('cycle-zones').addEventListener('click', () => {
    currentZoneIndex = (currentZoneIndex + 1) % deploymentZones.length;
    console.log('Cycling deployment zone to:', deploymentZones[currentZoneIndex].name);
    drawDeploymentZone();
  });

  // Cycle objectives
  document.getElementById('cycle-objectives').addEventListener('click', () => {
    currentObjectiveIndex = (currentObjectiveIndex + 1) % objectiveLayouts.length;
    console.log('Cycling objectives to:', objectiveLayouts[currentObjectiveIndex].name);
    drawObjectiveLayout();
  });

  // Initialize drag mode
  updateDragMode(true);
};
terrainImage.src = 'assets/terrain.png';
