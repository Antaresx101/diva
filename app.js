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

  // Layers
  const terrainLayer = new Konva.Layer();
  const objectiveLayer = new Konva.Layer();
  const zoneLayer = new Konva.Layer();
  const unitLayer = new Konva.Layer();
  stage.add(terrainLayer, objectiveLayer, zoneLayer, unitLayer);

  // Terrain image
  const terrain = new Konva.Image({
    image: terrainImage,
    x: 0,
    y: 0,
    width: width,
    height: height
  });
  terrainLayer.add(terrain);

  // Unit list with roster data
  const units = [
    { name: 'Captain', shape: 'circle', radius: 1, color: 'purple', modelCount: 1, baseSize: '40mm' },
    { name: 'Marines', shape: 'circle', radius: 0.65, color: 'blue', modelCount: 10, baseSize: '32mm' },
    { name: 'Bikers', shape: 'ellipse', radiusX: 1.5, radiusY: 0.85, color: 'green', modelCount: 5, baseSize: '75x42mm' },
    { name: 'Tank', shape: 'rectangle', width: 5, height: 3, color: 'red', modelCount: 1, baseSize: '60mm' }
  ];

  // Populate roster
  const rosterList = document.getElementById('roster-list');
  let selectedUnitName = units[0].name;
  units.forEach(unit => {
    const li = document.createElement('li');
    li.className = 'roster-item';
    li.draggable = true;
    li.dataset.unitName = unit.name;
    li.textContent = `${unit.name} (${unit.modelCount} models, ${unit.baseSize})`;
    if (unit.name === selectedUnitName) {
      li.classList.add('selected');
    }
    rosterList.appendChild(li);
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
      group.draggable(isGroupMode);
      group.getChildren(node => node instanceof Konva.Circle || node instanceof Konva.Ellipse || node instanceof Konva.Rect).forEach(shape => {
        shape.draggable(!isGroupMode);
      });
    });
    unitLayer.draw();
    document.getElementById('toggle-drag-mode').textContent = groupDragMode ? 'Move Group' : 'Move Models';
  }

  // Get bounding box for shape (rotation)
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

      // Check for overlap with AABB
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
  function addUnit(unitName, x = 100, y = 100) {
    const unitData = units.find(u => u.name === unitName);
    if (!unitData) {
      console.warn(`Unit not found: ${unitName}`);
      return;
    }

    // Clamp position to stage boundaries
    const padding = 10; // Small padding to keep units fully visible
    x = Math.max(padding, Math.min(x, width - padding));
    y = Math.max(padding, Math.min(y, height - padding));

    // Create group
    const group = new Konva.Group({
      x: x,
      y: y,
      draggable: groupDragMode,
      rotation: 0
    });

    const modelCount = unitData.modelCount;
    const cols = Math.ceil(Math.sqrt(modelCount));
    const spacing = 0.1;
    let index = 0;
    const shapePositions = [];

    // Create shapes
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
        // Store absolute position (accounting for shape offset)
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
          if (groupDragMode && e.evt.button === 0 && !activeRotatingGroup) {
            console.log('Left-click on shape in Group Drag Mode, dragging group:', group);
            group.startDrag();
          } else if (!groupDragMode && (unitData.shape === 'ellipse' || unitData.shape === 'rectangle') && e.evt.button === 2 && e.evt.shiftKey) {
            e.evt.preventDefault();
            shape.rotation(shape.rotation() + 5);
            console.log('Rotated shape by 5 degrees, new angle:', shape.rotation());
            if (!groupDragMode) snapToEdge(shape, group);
            unitLayer.draw();
          }
        });

        // Mobile rotation for ellipses and rectangles
        if (unitData.shape === 'ellipse' || unitData.shape === 'rectangle') {
          shape.on('dbltap', e => {
            e.evt.preventDefault();
            if (activeRotatingShape === shape) {
              shape.opacity(0.8);
              activeRotatingShape = null;
              shape.draggable(!groupDragMode);
              console.log('Mobile shape rotation ended:', shape);
              snapToEdge(shape, group);
            } else {
              if (activeRotatingShape) {
                activeRotatingShape.opacity(0.8);
                activeRotatingShape.draggable(!groupDragMode);
                snapToEdge(activeRotatingShape, activeRotatingShape.getParent());
                console.log('Mobile shape rotation switched from:', activeRotatingShape);
              }
              if (activeRotatingGroup) {
                activeRotatingGroup.opacity(1.0);
                activeRotatingGroup.draggable(groupDragMode);
                activeRotatingGroup.getChildren(node => node instanceof Konva.Circle || node instanceof Konva.Ellipse || node instanceof Konva.Rect).forEach(s => {
                  snapToEdge(s, activeRotatingGroup);
                });
                console.log('Mobile group rotation switched from:', activeRotatingGroup);
                activeRotatingGroup = null;
              }
              activeRotatingShape = shape;
              shape.opacity(0.7);
              shape.draggable(false);
              console.log('Mobile shape rotation started:', shape);
            }
            unitLayer.draw();
          });
        }

        group.add(shape);
      }
      index++;
    }

    // Centroid calculation (skip for single-model units)
    if (modelCount > 1) {
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
    }

    // Group rotation and dragging in Group Drag Mode (desktop)
    group.on('mousedown', e => {
      if (groupDragMode && !e.evt.shiftKey && e.evt.button === 0 && !activeRotatingGroup) {
        console.log('Left-click on group, starting drag:', group);
        group.startDrag();
      } else if (groupDragMode && e.evt.button === 2 && e.evt.shiftKey) {
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
        group.opacity(1.0);
        activeRotatingGroup = null;
        group.draggable(groupDragMode);
        console.log('Mobile group rotation ended:', group);
        group.getChildren(node => node instanceof Konva.Circle || node instanceof Konva.Ellipse || node instanceof Konva.Rect).forEach(shape => {
          snapToEdge(shape, group);
        });
      } else {
        if (activeRotatingGroup) {
          activeRotatingGroup.opacity(1.0);
          activeRotatingGroup.draggable(groupDragMode);
          activeRotatingGroup.getChildren(node => node instanceof Konva.Circle || node instanceof Konva.Ellipse || node instanceof Konva.Rect).forEach(shape => {
            snapToEdge(shape, activeRotatingGroup);
          });
          console.log('Mobile group rotation switched from:', activeRotatingGroup);
        }
        if (activeRotatingShape) {
          activeRotatingShape.opacity(0.8);
          activeRotatingShape.draggable(!groupDragMode);
          snapToEdge(activeRotatingShape, activeRotatingShape.getParent());
          console.log('Mobile shape rotation switched from:', activeRotatingShape);
          activeRotatingShape = null;
        }
        activeRotatingGroup = group;
        group.opacity(0.7);
        group.draggable(false);
        console.log('Mobile group rotation started:', group);
      }
      unitLayer.draw();
    });

    group.on('touchstart', e => {
      if (groupDragMode && e.evt.touches.length === 1 && !activeRotatingGroup) {
        console.log('Single touch on group, starting drag:', group);
        group.draggable(true);
        group.startDrag();
      }
    });

    group.on('dragstart', () => {
      if (!activeRotatingGroup) {
        console.log('Dragging group:', group);
        group.opacity(0.6);
        unitLayer.draw();
      }
    });

    group.on('dragend', () => {
      if (!activeRotatingGroup) {
        console.log('Group drag ended:', group);
        group.opacity(1.0);
        group.draggable(groupDragMode); // Respect groupDragMode
        unitLayer.draw();
      }
    });

    unitLayer.add(group);
    unitLayer.draw();
  }

  // Handle single tap for rotation and double-tap on stage to cancel
  stage.on('tap', e => {
    console.log('Stage tap detected, groupDragMode:', groupDragMode, 'activeRotatingGroup:', activeRotatingGroup, 'activeRotatingShape:', activeRotatingShape);
    if (groupDragMode && activeRotatingGroup) {
      activeRotatingGroup.rotation(activeRotatingGroup.rotation() + 5);
      console.log('Mobile group rotated by 5 degrees, angle:', activeRotatingGroup.rotation());
      activeRotatingGroup.getChildren(node => node instanceof Konva.Circle || node instanceof Konva.Ellipse || node instanceof Konva.Rect).forEach(shape => {
        snapToEdge(shape, activeRotatingGroup);
      });
      unitLayer.draw();
    } else if (!groupDragMode && activeRotatingShape) {
      activeRotatingShape.rotation(activeRotatingShape.rotation() + 5);
      console.log('Mobile shape rotated by 5 degrees, angle:', activeRotatingShape.rotation());
      snapToEdge(activeRotatingShape, activeRotatingShape.getParent());
      unitLayer.draw();
    }
  });

  stage.on('dbltap', e => {
    if (e.target === stage) {
      if (activeRotatingGroup) {
        activeRotatingGroup.opacity(1.0);
        activeRotatingGroup.draggable(groupDragMode);
        activeRotatingGroup.getChildren(node => node instanceof Konva.Circle || node instanceof Konva.Ellipse || node instanceof Konva.Rect).forEach(shape => {
          snapToEdge(shape, activeRotatingGroup);
        });
        console.log('Mobile group rotation canceled via stage double-tap:', activeRotatingGroup);
        activeRotatingGroup = null;
      }
      if (activeRotatingShape) {
        activeRotatingShape.opacity(0.8);
        activeRotatingShape.draggable(!groupDragMode);
        snapToEdge(activeRotatingShape, activeRotatingShape.getParent());
        console.log('Mobile shape rotation canceled via stage double-tap:', activeRotatingShape);
        activeRotatingShape = null;
      }
      unitLayer.draw();
    }
  });

  // Toggle drag mode button click
  document.getElementById('toggle-drag-mode').addEventListener('click', () => {
    updateDragMode(!groupDragMode);
  });

  // Toggle sidebar
  const sidebar = document.getElementById('sidebar');
  document.getElementById('toggle-sidebar').addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Handle roster selection
  rosterList.addEventListener('click', e => {
    if (e.target.classList.contains('roster-item')) {
      document.querySelectorAll('.roster-item').forEach(item => item.classList.remove('selected'));
      e.target.classList.add('selected');
      selectedUnitName = e.target.dataset.unitName;
      console.log('Selected roster unit:', selectedUnitName);
    }
  });

  // Handle roster drag and drop
  let draggedUnit = null;
  rosterList.addEventListener('dragstart', e => {
    if (e.target.classList.contains('roster-item')) {
      draggedUnit = e.target.dataset.unitName;
      e.target.classList.add('dragging');
      console.log('Dragging roster item:', draggedUnit);
    }
  });

  rosterList.addEventListener('dragend', e => {
    if (e.target.classList.contains('roster-item')) {
      e.target.classList.remove('dragging');
      draggedUnit = null;
    }
  });

  stage.container().addEventListener('dragover', e => {
    e.preventDefault();
  });

  stage.container().addEventListener('drop', e => {
    e.preventDefault();
    if (draggedUnit) {
      const rect = stage.container().getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      console.log('Dropped unit:', draggedUnit, 'at position:', { x, y });
      addUnit(draggedUnit, x, y);
      draggedUnit = null;
    }
  });

  // Spawn unit button click
  document.getElementById('spawn-unit').addEventListener('click', () => {
    if (selectedUnitName) {
      console.log('Spawning unit from button:', selectedUnitName);
      addUnit(selectedUnitName);
    } else {
      console.warn('No unit selected for spawning');
    }
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

  // Define objective layouts
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
