export function setupStage(terrainImage, containerId = 'container') {
  const container = document.getElementById(containerId);
  const containerRect = container.getBoundingClientRect();
  let width = containerRect.width;
  let height = containerRect.height;

  const targetAspect = 44 / 60;
  if (width / height > targetAspect) {
    width = height * targetAspect;
  } else {
    height = width / targetAspect;
  }

  const stage = new Konva.Stage({
    container: containerId,
    width: width,
    height: height
  });

  const pxPerInchWidth = width / 44;
  const pxPerInchHeight = height / 60;
  const centerX = width / 2;
  const centerY = height / 2;

  const terrainLayer = new Konva.Layer();
  const objectiveLayer = new Konva.Layer();
  const zoneLayer = new Konva.Layer();
  const unitLayer = new Konva.Layer();
  stage.add(terrainLayer, objectiveLayer, zoneLayer, unitLayer);

  if (terrainImage) {
    const terrain = new Konva.Image({
      image: terrainImage,
      x: 0,
      y: 0,
      width: width,
      height: height
    });
    terrainLayer.add(terrain);
  } else {
    console.warn('No terrain image provided, skipping terrain layer image');
  }

  return { stage, terrainLayer, objectiveLayer, zoneLayer, unitLayer, width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY };
}