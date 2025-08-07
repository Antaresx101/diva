export function setupUnits(stage, unitLayer, units, pxPerInchWidth, pxPerInchHeight, width, height) {
  let groupDragMode = true;
  let hoveredGroup = null;
  let hoveredShape = null;
  let selectedUnitName = units[0].name;

  const rosterList = document.getElementById('roster-list');
  units.forEach(unit => {
    const li = document.createElement('li');
    const mc = unit.modelCount > 1 ? `${unit.modelCount}x ` : ``;
    li.className = 'roster-item';
    li.draggable = true;
    li.dataset.unitName = unit.name;
    li.style.whiteSpace = 'pre-wrap';
    li.textContent = `${mc}${unit.name}\n(${unit.baseSize})`;
    if (unit.name === selectedUnitName) {
      li.classList.add('selected');
    }
    rosterList.appendChild(li);
  });

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

  function addUnit(unitName, x = width / 2, y = height / 2) {
    const unitData = units.find(u => u.name === unitName);
    if (!unitData) {
      console.warn(`Unit not found: ${unitName}`);
      return;
    }

    const padding = 10;
    // Validate provided coordinates, default to center if invalid
    const spawnX = (typeof x === 'number' && !isNaN(x)) ? Math.max(padding, Math.min(x, width - padding)) : width / 2;
    const spawnY = (typeof y === 'number' && !isNaN(y)) ? Math.max(padding, Math.min(y, height - padding)) : height / 2;

    const group = new Konva.Group({
      x: spawnX,
      y: spawnY,
      draggable: groupDragMode,
      rotation: 0
    });

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
        const absPos = {
          x: offsetX - (shape.offsetX() || 0),
          y: offsetY - (shape.offsetY() || 0)
        };
        shapePositions.push(absPos);

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

    group.on('dragstart', () => {
      console.log('Dragging group:', group);
      group.opacity(0.6);
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

  stage.on('tap', e => {
    console.log('Stage tap detected, groupDragMode:', groupDragMode);
    const touch = e.evt.changedTouches ? e.evt.changedTouches[0] : e.evt;
    const rect = stage.container().getBoundingClientRect();
    const tapY = touch.clientY - rect.top;
    const canvasHeight = rect.height;
    const isUpperHalf = tapY < canvasHeight / 2;
    const rotationAngle = isUpperHalf ? 7.5 : -7.5;

    const pos = { x: touch.clientX - rect.left, y: tapY };
    const target = stage.getIntersection(pos);

    if (target) {
      if (groupDragMode) {
        const group = target.getParent() instanceof Konva.Group ? target.getParent() : null;
        if (group) {
          group.rotation(group.rotation() + rotationAngle);
          console.log(`Mobile tap (${isUpperHalf ? 'upper' : 'lower'} half): Rotated group by ${rotationAngle} degrees, new angle:`, group.rotation());
          group.getChildren(node => node instanceof Konva.Circle || node instanceof Konva.Ellipse || node instanceof Konva.Rect).forEach(shape => {
            snapToEdge(shape, group);
          });
          unitLayer.draw();
        }
      } else if (target instanceof Konva.Ellipse || target instanceof Konva.Rect) {
        target.rotation(target.rotation() + rotationAngle);
        console.log(`Mobile tap (${isUpperHalf ? 'upper' : 'lower'} half): Rotated shape by ${rotationAngle} degrees, new angle:`, target.rotation());
        snapToEdge(target, target.getParent());
        unitLayer.draw();
      }
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
    document.getElementById('toggle-drag-mode').textContent = groupDragMode ? 'Move Group' : 'Move Models';
  }

  return { 
    addUnit, 
    updateDragMode, 
    getSelectedUnitName: () => selectedUnitName, 
    setSelectedUnitName: (name) => { 
      selectedUnitName = name;
      document.querySelectorAll('.roster-item').forEach(item => {
        item.classList.toggle('selected', item.dataset.unitName === name);
      });
      console.log('Selected unit:', selectedUnitName);
    } 
  };
}