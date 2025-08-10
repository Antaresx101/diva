export function setupUnits(stage, unitLayer, units, pxPerInchWidth, pxPerInchHeight, width, height) {
  let groupDragMode = true;
  let hoveredGroup = null;
  let hoveredShape = null;
  let selectedUnitId = units[0]?.id || null;
  let lastSelectedGroup = null;
  let lastSelectedShape = null;
  let unitIdCounter = 0;
  const colors = ['gray', 'yellow', 'orange', 'red', 'brown', 'green', 'cyan', 'blue', 'magenta', 'purple'];
  const unitInstances = new Map(); // Key by unit ID

  function populateRoster() {
    const rosterList = document.getElementById('roster-list');
    rosterList.innerHTML = ''; // Clear existing roster
    units.forEach(unit => {
      const li = document.createElement('li');
      const mc = unit.modelCount > 1 ? `${unit.modelCount}x ` : ``;
      li.className = 'roster-item';
      li.dataset.unitId = unit.id; // Use unit ID
      li.style.whiteSpace = 'pre-wrap';
      const nameSpan = document.createElement('span');
      nameSpan.textContent = `${mc}${unit.name}\n(${unit.baseSize})`;
      li.appendChild(nameSpan);
      if (unit.id === selectedUnitId) {
        li.classList.add('selected');
      }

      // Create instanceDiv with buttons
      const instanceDiv = document.createElement('div');
      instanceDiv.dataset.unitId = ''; // Refers to Konva group ID, not unit.id
      instanceDiv.dataset.deleted = 'true'; // Initially no unit deployed

      const colorBtn = document.createElement('button');
      colorBtn.className = 'color-btn';
      colorBtn.style.backgroundColor = unit.color || colors[0]; // Default to unit color or first color
      colorBtn.addEventListener('click', () => {
        const groupId = instanceDiv.dataset.unitId;
        const groupToColor = unitLayer.findOne('#' + groupId);
        const currentColorIndex = colors.indexOf(colorBtn.style.backgroundColor) !== -1 ? colors.indexOf(colorBtn.style.backgroundColor) : 0;
        const newColorIndex = (currentColorIndex + 1) % colors.length;
        const newColor = colors[newColorIndex];
        colorBtn.style.backgroundColor = newColor;
        if (groupToColor) {
          groupToColor.colorIndex = newColorIndex;
          groupToColor.getChildren().forEach(shape => shape.fill(newColor));
          unitLayer.draw();
          console.log(`Changed color for unit ${groupId} to: ${newColor}`);
        } else {
          console.log(`Color changed to ${newColor} for unit ${unit.name} (not deployed)`);
        }
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'delete-btn';
      deleteBtn.disabled = true; // Disabled until unit is deployed
      deleteBtn.style.backgroundColor = 'transparent';

      instanceDiv.appendChild(colorBtn);
      instanceDiv.appendChild(deleteBtn);
      li.appendChild(instanceDiv);

      // Check if unit is deployed
      const isDeployed = unitInstances.has(unit.id) && unitInstances.get(unit.id).some(instance => !instance.deleted);
      if (isDeployed) {
        li.classList.add('deployed');
        li.draggable = false;
        li.style.cursor = 'default';
      } else {
        li.draggable = true;
        li.style.cursor = 'pointer';
      }

      unitInstances.set(unit.id, []); // Initialize empty array for this unit ID
      rosterList.appendChild(li);
    });
  }

  populateRoster();

  function getShapeBounds(shape) {
    const rect = shape.getClientRect({ relativeTo: shape.getParent() });
    return {
      left: rect.x,
      right: rect.x + rect.width,
      top: rect.y,
      bottom: rect.y + rect.height
    };
  }

  function snapToEdge(draggedShape, group) {
    const boundsA = getShapeBounds(draggedShape);
    let minDist = Infinity;
    let bestPos = { x: draggedShape.x(), y: draggedShape.y() };

    group.getChildren(node => node !== draggedShape && (node instanceof Konva.Circle || node instanceof Konva.Ellipse || node instanceof Konva.Rect)).forEach(other => {
      const boundsB = getShapeBounds(other);
      if (boundsA.left < boundsB.right && boundsA.right > boundsB.left && boundsA.top < boundsB.bottom && boundsA.bottom > boundsB.top) {
        const translations = [
          { x: boundsB.right - boundsA.left, y: 0 },
          { x: boundsB.left - boundsA.right, y: 0 },
          { x: 0, y: boundsB.bottom - boundsA.top },
          { x: 0, y: boundsB.top - boundsA.bottom }
        ];
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

  function addUnit(unitId, x = width / 2, y = height / 2) {
    const unitData = units.find(u => u.id === unitId); // Find by ID
    if (!unitData) {
      console.warn(`Unit not found: ${unitId}`);
      return;
    }

    const padding = 10;
    const spawnX = (typeof x === 'number' && !isNaN(x)) ? Math.max(padding, Math.min(x, width - padding)) : width / 2;
    const spawnY = (typeof y === 'number' && !isNaN(y)) ? Math.max(padding, Math.min(y, height - padding)) : height / 2;

    const group = new Konva.Group({
      x: spawnX,
      y: spawnY,
      draggable: groupDragMode,
      rotation: 0
    });

    group.id('unit-' + unitIdCounter);
    unitIdCounter++;

    // Get the selected color from the roster's color button
    const rosterItem = Array.from(document.getElementById('roster-list').children).find(li => li.dataset.unitId === unitId);
    const colorBtn = rosterItem?.querySelector('.color-btn');
    const selectedColor = colorBtn?.style.backgroundColor || colors[0];
    group.colorIndex = colors.indexOf(selectedColor) !== -1 ? colors.indexOf(selectedColor) : colors.indexOf(unitData.color || colors[0]);

    const modelCount = unitData.modelCount;
    const cols = Math.ceil(Math.sqrt(modelCount));
    const spacing = 0.1;
    let index = 0;
    const shapePositions = [];

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
            fill: colors[group.colorIndex],
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
            fill: colors[group.colorIndex],
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
            fill: colors[group.colorIndex],
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
        const absPos = {
          x: offsetX - (shape.offsetX() || 0),
          y: offsetY - (shape.offsetY() || 0)
        };
        shapePositions.push(absPos);

        shape.on('dragstart', () => {
          console.log('Dragging model:', shape);
          shape.opacity(0.5);
          if (!groupDragMode) {
            lastSelectedShape = shape;
            console.log('Selected shape for rotation:', lastSelectedShape);
          }
          unitLayer.draw();
        });

        shape.on('dragend', () => {
          console.log('Model drag ended:', shape);
          shape.opacity(0.8);
          if (!groupDragMode) snapToEdge(shape, group);
          unitLayer.draw();
        });

        shape.on('mouseover', () => {
          if (!groupDragMode) {
            hoveredShape = shape;
            console.log('Hovering over shape:', shape);
          }
        });

        shape.on('mouseout', () => {
          if (!groupDragMode && hoveredShape === shape) {
            hoveredShape = null;
            console.log('Stopped hovering over shape:', shape);
          }
        });

        shape.on('mousedown', e => {
          if (groupDragMode && e.evt.button === 0) {
            console.log('Left-click on shape in Group Drag Mode, dragging group:', group);
            group.startDrag();
          }
        });

        shape.on('tap', () => {
          if (!groupDragMode && (shape instanceof Konva.Ellipse || shape instanceof Konva.Rect)) {
            const parentGroup = shape.getParent();
            if (lastSelectedGroup === parentGroup) {
              lastSelectedGroup = null;
              lastSelectedShape = null;
              console.log('Tapped shape in same group, deselected');
            } else {
              lastSelectedShape = shape;
              lastSelectedGroup = parentGroup;
              console.log('Tapped shape, selected for rotation:', lastSelectedShape);
            }
          }
        });

        shape.on('touchstart', e => {
          if (groupDragMode && e.evt.touches.length === 1) {
            console.log('Single touch on shape in Group Drag Mode, dragging group:', group);
            group.startDrag();
          }
        });

        group.add(shape);
      }
      index++;
    }

    if (modelCount > 1) {
      const centroid = shapePositions.reduce(
        (acc, pos) => ({
          x: acc.x + pos.x / shapePositions.length,
          y: acc.y + pos.y / shapePositions.length
        }),
        { x: 0, y: 0 }
      );

      group.getChildren().forEach(shape => {
        shape.x(shape.x() - centroid.x);
        shape.y(shape.y() - centroid.y);
      });

      group.offsetX(centroid.x);
      group.offsetY(centroid.y);
      console.log('Group centroid offset:', { offsetX: centroid.x, offsetY: centroid.y });
    }

    group.on('mouseover', () => {
      if (groupDragMode) {
        hoveredGroup = group;
        console.log('Hovering over group:', group);
      }
    });

    group.on('mouseout', () => {
      if (groupDragMode && hoveredGroup === group) {
        hoveredGroup = null;
        console.log('Stopped hovering over group:', group);
      }
    });

    group.on('mousedown', e => {
      if (groupDragMode && e.evt.button === 0) {
        console.log('Left-click on group, starting drag:', group);
        group.startDrag();
      }
    });

    group.on('touchstart', e => {
      if (groupDragMode && e.evt.touches.length === 1) {
        console.log('Single touch on group, starting drag:', group);
        group.draggable(true);
        group.startDrag();
      }
    });

    group.on('tap', () => {
      if (groupDragMode) {
        if (lastSelectedGroup === group) {
          lastSelectedGroup = null;
          console.log('Tapped same group, deselected');
        } else {
          lastSelectedGroup = group;
          console.log('Tapped group, selected for rotation:', lastSelectedGroup);
        }
      }
    });

    group.on('dragstart', () => {
      console.log('Dragging group:', group);
      group.opacity(0.6);
      if (groupDragMode) {
        lastSelectedGroup = group;
        console.log('Selected group for rotation:', lastSelectedGroup);
      }
      unitLayer.draw();
    });

    group.on('dragend', () => {
      console.log('Group drag ended:', group);
      group.opacity(1.0);
      group.draggable(groupDragMode);
      unitLayer.draw();
    });

    unitLayer.add(group);
    unitLayer.draw();
    addUnitInstanceToRoster(group, unitId);
    if (groupDragMode) {
      lastSelectedGroup = group;
      console.log('New unit added, selected group for rotation:', lastSelectedGroup);
    }
  }

  function addUnitInstanceToRoster(group, unitId) {
    const rosterItem = Array.from(document.getElementById('roster-list').children).find(li => li.dataset.unitId === unitId);
    if (!rosterItem) {
      console.warn(`Roster item not found for unit ID: ${unitId}`);
      return;
    }

    const instanceDiv = rosterItem.querySelector('div');
    instanceDiv.dataset.unitId = group.id();
    instanceDiv.dataset.deleted = 'false';

    const deleteBtn = instanceDiv.querySelector('.delete-btn');
    deleteBtn.disabled = false;
    deleteBtn.style.backgroundColor = 'red';
    deleteBtn.style.color = 'white';
    deleteBtn.addEventListener('click', () => {
      const groupId = instanceDiv.dataset.unitId;
      const groupToRemove = unitLayer.findOne('#' + groupId);
      if (groupToRemove) {
        groupToRemove.destroy();
        unitLayer.draw();
        instanceDiv.dataset.deleted = 'true';
        deleteBtn.style.backgroundColor = 'transparent';
        deleteBtn.style.color = 'transparent';
        deleteBtn.disabled = true;
        const instance = unitInstances.get(unitId).find(i => i.id === groupId);
        if (instance) instance.deleted = true;
        rosterItem.classList.remove('deployed');
        rosterItem.draggable = true;
        rosterItem.style.cursor = 'pointer';
        console.log(`Deleted unit instance: ${groupId}`);
      }
    });

    const colorBtn = instanceDiv.querySelector('.color-btn');
    colorBtn.style.backgroundColor = colors[group.colorIndex];

    rosterItem.classList.add('deployed');
    rosterItem.draggable = false;
    rosterItem.style.cursor = 'default';
    unitInstances.get(unitId).push({ id: group.id(), group, deleted: false });
  }

  function getUnitInstances() {
    const instances = [];
    unitInstances.forEach((instanceList, unitId) => {
      instanceList.forEach(instance => {
        if (!instance.deleted) {
          const group = instance.group;
          const shapes = group.getChildren(node => node instanceof Konva.Circle || node instanceof Konva.Ellipse || node instanceof Konva.Rect).map((shape, index) => ({
            index,
            rotation: shape.rotation()
          }));
          instances.push({
            unitId, // Save unit ID instead of name
            unitName: units.find(u => u.id === unitId)?.name || 'Unknown', // Include name for compatibility
            x: group.x(),
            y: group.y(),
            rotation: group.rotation(),
            colorIndex: group.colorIndex,
            shapes
          });
        }
      });
    });
    return instances;
  }

  function loadUnitInstances(instances) {
    unitLayer.removeChildren();
    unitInstances.clear();
    populateRoster();
    instances.forEach(instance => {
      const unitData = units.find(u => u.id === instance.unitId);
      if (unitData) {
        addUnit(instance.unitId, instance.x, instance.y);
        const group = unitLayer.findOne(`#unit-${unitIdCounter - 1}`);
        if (group) {
          group.rotation(instance.rotation);
          group.colorIndex = instance.colorIndex;
          group.getChildren().forEach(shape => shape.fill(colors[instance.colorIndex]));
          if (instance.shapes) {
            group.getChildren(node => node instanceof Konva.Circle || node instanceof Konva.Ellipse || node instanceof Konva.Rect).forEach((shape, index) => {
              const savedShape = instance.shapes.find(s => s.index === index);
              if (savedShape) {
                shape.rotation(savedShape.rotation);
                console.log(`Restored rotation ${savedShape.rotation} for shape ${index} in unit ${instance.unitId}`);
              }
            });
          }
        }
      } else {
        console.warn(`Unit not found for saved instance: ${instance.unitId}`);
      }
    });
    unitLayer.draw();
  }

  function refreshRoster(newUnits) {
    units.length = 0;
    newUnits.forEach(unit => units.push(unit));
    selectedUnitId = units[0]?.id || null;
    unitInstances.clear();
    populateRoster();
    console.log('Roster refreshed with units:', units);
  }

  document.addEventListener('keydown', e => {
    if (e.key === '1' || e.keyCode === 49) {
      if (groupDragMode && hoveredGroup) {
        hoveredGroup.rotation(hoveredGroup.rotation() + 7.5);
        console.log('Key 1: Rotated group by +7.5 degrees, new angle:', hoveredGroup.rotation());
        hoveredGroup.getChildren(node => node instanceof Konva.Circle || node instanceof Konva.Ellipse || node instanceof Konva.Rect).forEach(shape => {
          snapToEdge(shape, hoveredGroup);
        });
        unitLayer.draw();
      } else if (!groupDragMode && hoveredShape && (hoveredShape instanceof Konva.Ellipse || hoveredShape instanceof Konva.Rect)) {
        hoveredShape.rotation(hoveredShape.rotation() + 7.5);
        console.log('Key 1: Rotated shape by +7.5 degrees, new angle:', hoveredShape.rotation());
        snapToEdge(hoveredShape, hoveredShape.getParent());
        unitLayer.draw();
      }
    } else if (e.key === '2' || e.keyCode === 50) {
      if (groupDragMode && hoveredGroup) {
        hoveredGroup.rotation(hoveredGroup.rotation() - 7.5);
        console.log('Key 2: Rotated group by -7.5 degrees, new angle:', hoveredGroup.rotation());
        hoveredGroup.getChildren(node => node instanceof Konva.Circle || node instanceof Konva.Ellipse || node instanceof Konva.Rect).forEach(shape => {
          snapToEdge(shape, hoveredGroup);
        });
        unitLayer.draw();
      } else if (!groupDragMode && hoveredShape && (hoveredShape instanceof Konva.Ellipse || hoveredShape instanceof Konva.Rect)) {
        hoveredShape.rotation(hoveredShape.rotation() - 7.5);
        console.log('Key 2: Rotated shape by -7.5 degrees, new angle:', hoveredShape.rotation());
        snapToEdge(hoveredShape, hoveredShape.getParent());
        unitLayer.draw();
      }
    }
  });

  stage.on('tap', () => {
    console.log('Stage tap detected, groupDragMode:', groupDragMode);
    if (groupDragMode && lastSelectedGroup) {
      lastSelectedGroup.rotation(lastSelectedGroup.rotation() + 7.5);
      console.log('Mobile tap: Rotated last selected group by +7.5 degrees, new angle:', lastSelectedGroup.rotation());
      lastSelectedGroup.getChildren(node => node instanceof Konva.Circle || node instanceof Konva.Ellipse || node instanceof Konva.Rect).forEach(shape => {
        snapToEdge(shape, lastSelectedGroup);
      });
      unitLayer.draw();
    } else if (!groupDragMode && lastSelectedShape && (lastSelectedShape instanceof Konva.Ellipse || lastSelectedShape instanceof Konva.Rect)) {
      lastSelectedShape.rotation(lastSelectedShape.rotation() + 7.5);
      console.log('Mobile tap: Rotated last selected shape by +7.5 degrees, new angle:', lastSelectedShape.rotation());
      snapToEdge(lastSelectedShape, lastSelectedShape.getParent());
      unitLayer.draw();
    } else {
      console.log('Mobile tap: No valid group or shape selected for rotation');
    }
  });

  function updateDragMode(isGroupMode) {
    console.log('Updating drag mode:', isGroupMode ? 'Group' : 'Model');
    groupDragMode = isGroupMode;
    hoveredGroup = null;
    hoveredShape = null;
    unitLayer.getChildren(group => group instanceof Konva.Group).forEach(group => {
      group.draggable(isGroupMode);
      group.getChildren(node => node instanceof Konva.Circle || node instanceof Konva.Ellipse || node instanceof Konva.Rect).forEach(shape => {
        shape.draggable(!isGroupMode);
      });
    });
    unitLayer.draw();
    document.getElementById('toggle-drag-mode').textContent = isGroupMode ? 'Move Group' : 'Move Models';
  }

  return { 
    addUnit, 
    updateDragMode, 
    refreshRoster,
    getUnitInstances,
    loadUnitInstances,
    getSelectedUnitName: () => selectedUnitId, // Return unit ID
    setSelectedUnitName: (id) => { 
      selectedUnitId = id;
      document.querySelectorAll('.roster-item').forEach(item => {
        item.classList.toggle('selected', item.dataset.unitId === id);
      });
      console.log('Selected unit ID:', selectedUnitId);
    } 
  };
}
