import React, { useState, useRef } from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';
import { Button, Card, Row, Col } from 'antd';
import '../../App.css';

const colors = ['red', 'green', 'blue', 'orange', 'purple'];

interface Part {
  x: number; // The x coordinate of the dividing line
}

interface ProbePanel {
  id: number;
  parts: Part[];
}

const CustomDesign: React.FC = () => {
  const [sequenceLength, setSequenceLength] = useState<number>(100);
  const [parts, setParts] = useState<Part[]>([]);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [panels, setPanels] = useState<ProbePanel[]>([]);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scaleFactor = 5;
  const sequenceHeight = 20;
  const sequenceY = 90;

  // Calculate the X position to center the sequence rectangle
  const calculateSequenceX = () => {
    const sequenceWidth = sequenceLength * scaleFactor;
    return (window.innerWidth - sequenceWidth) / 2;
  };

  const sequenceX = calculateSequenceX(); // Call it once initially for the centered position

  // Generate a unique ID for each panel
  const getNextPanelId = () => {
    return panels.length > 0 ? Math.max(...panels.map(panel => panel.id)) + 1 : 1;
  };

  // Recalculate part labels based on the positions of the dividing lines
  const calculateLabels = (newParts: Part[]) => {
    const sortedParts = [...newParts].sort((a, b) => a.x - b.x);
    const segmentPositions = [0, ...sortedParts.map(part => part.x), sequenceLength];
    return segmentPositions.slice(0, -1).map((pos, index) => ({
      startX: pos,
      endX: segmentPositions[index + 1],
      label: `part${index + 1}`,
      length: segmentPositions[index + 1] - pos, // Calculate segment length
    }));
  };

  // Handle setting the sequence length
  const handleSetLength = (length: number) => {
    setSequenceLength(length);
    setParts([]); // Clear dividing lines when resetting length
  };

  // Handle single click to add a dividing line
  const handleClick = (event: any) => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    clickTimeoutRef.current = setTimeout(() => {
      const stage = event.target.getStage();
      const pointerPosition = stage.getPointerPosition();
      const xPos = pointerPosition.x;
      const yPos = pointerPosition.y;

      if (
        xPos >= sequenceX &&
        xPos <= sequenceX + sequenceLength * scaleFactor &&
        yPos >= sequenceY &&
        yPos <= sequenceY + sequenceHeight
      ) {
        const relativeX = (xPos - sequenceX) / scaleFactor;
        const newPart = { x: relativeX };
        setParts(prevParts => [...prevParts, newPart]);
      }
    }, 300);
  };

  // Handle undoing the most recent dividing line
  const handleUndo = () => {
    setParts(parts.slice(0, -1));
  };

  // Handle mouse move to show coordinates
  const handleMouseMove = (event: any) => {
    const stage = event.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    const xPos = pointerPosition.x;
    const yPos = pointerPosition.y;

    if (
      xPos >= sequenceX &&
      xPos <= sequenceX + sequenceLength * scaleFactor &&
      yPos >= sequenceY &&
      yPos <= sequenceY + sequenceHeight
    ) {
      setHoverX(xPos);
    } else {
      setHoverX(null);
    }
  };

  // Handle dragging to move the dividing line, locking y-axis
  const handleDragMove = (index: number, event: any) => {
    const newParts = [...parts];
    const newX = (event.target.x() - sequenceX) / scaleFactor;
    if (newX >= 0 && newX <= sequenceLength) {
      newParts[index].x = newX;
      setParts(newParts);
    }
    event.target.y(sequenceY); // Lock y-axis
  };

  // Handle double-click to remove a dividing line
  const handleDoubleClick = (index: number) => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    const newParts = parts.filter((_, i) => i !== index);
    setParts(newParts);
  };

  // Save dividing lines to local storage
  const handleSaveDesign = () => {
    const designData = JSON.stringify(parts);
    localStorage.setItem('designData', designData);
    alert('Design saved');
  };

  // Load dividing lines from local storage
  const handleLoadDesign = () => {
    const savedData = localStorage.getItem('designData');
    if (savedData) {
      setParts(JSON.parse(savedData));
      alert('Design loaded');
    } else {
      alert('No saved design found');
    }
  };

  // Add a new panel for designing probe details
  const handleAddPanel = () => {
    const newPanel: ProbePanel = { id: getNextPanelId(), parts: [] };
    setPanels([...panels, newPanel]);
  };

  // Delete a panel
  const handleDeletePanel = (id: number) => {
    setPanels(panels.filter(panel => panel.id !== id));
  };

  const labeledParts = calculateLabels(parts);

  return (
    <div className='probe-container'>
      <h1>Custom Probe Design</h1>
      {/* First panel for target sequence */}
      <Card title="Target Sequence" style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label>Set target sequence length: </label>
          <input
            type="number"
            value={sequenceLength}
            onChange={(e) => handleSetLength(Number(e.target.value))}
          />
          <Button onClick={handleUndo} style={{ marginLeft: '10px' }}>
            Undo dividing line
          </Button>
          <Button onClick={handleSaveDesign} style={{ marginLeft: '10px' }}>
            Save design
          </Button>
          <Button onClick={handleLoadDesign} style={{ marginLeft: '10px' }}>
            Load design
          </Button>
        </div>

        <Stage
          width={window.innerWidth}
          height={300}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
        >
          <Layer>
            {/* Sequence rectangle */}
            <Rect
              x={sequenceX}
              y={sequenceY}
              width={sequenceLength * scaleFactor}
              height={sequenceHeight}
              fill="lightblue"
              stroke="black"
              strokeWidth={2}
            />

            {/* Parts based on dividing lines */}
            {labeledParts.map((segment, index) => (
              <React.Fragment key={index}>
                <Rect
                  x={segment.startX * scaleFactor + sequenceX}
                  y={sequenceY}
                  width={(segment.endX - segment.startX) * scaleFactor}
                  height={sequenceHeight}
                  fill="transparent"
                  stroke={colors[index % colors.length]}
                  strokeWidth={1}
                />
                {/* Labels */}
                <Text
                  x={(segment.startX + segment.endX) / 2 * scaleFactor + sequenceX - 15}
                  y={sequenceY - 20}
                  text={segment.label}
                  fontSize={12}
                  fill="blue"
                />
                {/* Segment length display */}
                <Text
                  x={(segment.startX + segment.endX) / 2 * scaleFactor + sequenceX - 15}
                  y={sequenceY + sequenceHeight + 15}
                  text={`Length: ${Math.round(segment.length)}`}
                  fontSize={12}
                  fill="black"
                />
              </React.Fragment>
            ))}

            {/* Dividing lines */}
            {parts.map((part, index) => (
              <React.Fragment key={index}>
                <Rect
                  x={part.x * scaleFactor + sequenceX - 2}
                  y={sequenceY}
                  width={4}
                  height={sequenceHeight}
                  fill={colors[index % colors.length]}
                  draggable
                  onDragMove={(event) => handleDragMove(index, event)}
                  onDblClick={() => handleDoubleClick(index)}
                />
                {/* Display dividing line's x-coordinate */}
                <Text
                  x={part.x * scaleFactor + sequenceX - 15}
                  y={sequenceY + sequenceHeight + 30}
                  text={`x: ${Math.round(part.x)}`}
                  fontSize={12}
                  fill="black"
                />
              </React.Fragment>
            ))}

            {/* Hover coordinates */}
            {hoverX && (
              <Text
                x={hoverX - 15}
                y={sequenceY + sequenceHeight + 50}
                text={`x: ${Math.round((hoverX - sequenceX) / scaleFactor)}`}
                fontSize={12}
                fill="blue"
              />
            )}
          </Layer>
        </Stage>
      </Card>

      {/* Dynamic panels for probe details */}
      {panels.map(panel => (
        <Card
          key={panel.id}
          title={`Probe Detail ${panel.id}`}
          extra={
            <Button type="text" danger onClick={() => handleDeletePanel(panel.id)}>
              Delete
            </Button>
          }
          style={{ marginBottom: '20px' }}
        >
          {/* Probe design content goes here */}
          <p>Panel content for probe {panel.id}</p>
        </Card>
      ))}

      {/* Add new panel button */}
      <Row justify="center" style={{ marginTop: '20px' }}>
        <Col>
          <Button type="primary" shape="circle" onClick={handleAddPanel}>
            +
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default CustomDesign;
