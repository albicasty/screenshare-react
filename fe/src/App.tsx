import './App.css'
import { Layer, Line, Stage, Rect } from 'react-konva'
import { KonvaEventObject } from 'konva/lib/Node';
import { useState, useRef, useEffect } from 'react';
import { address,port } from './constants';
import { socket } from './SocketService';
import { generateId } from './util';


function App() {

  const [points, setPoints] = useState<number[]>();
  const [isDrawing, setisDrawing] = useState<boolean>(false);
  const stageRef = useRef<Stage>(null);

  const handleMouseDown = () => {
    setisDrawing(true);
  }

  const handleMouseUp = () => {
    setisDrawing(false);
  }

  const handleLeave = () => {
    setisDrawing(false);
  }

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (isDrawing && stageRef.current) {
      const pointer = stageRef.current.getPointerPosition();
      const newPoints = points ? [...points, pointer.x, pointer.y] : [pointer.x, pointer.y];
      setPoints(newPoints);
      sendCursor(pointer);
    }
  };


  const [id, setId] = useState<string>(generateId());

  const [positions, setPositions] = useState<IPosID[]>([]);

  const sendCursor = (pos: IPosID) => {
    if (socket.connected) {
      socket.emit("cursor", { pos: pos, id: id });
    }
  }

  useEffect(() => {
    fetch(`${address}:${port}`).then(rx => console.log(rx));

    socket.on('cursor-update', (posId: IPosID[]) => {
      setPositions(posId);
    });

    return () => {
      socket.off('cursor-update');
    }

  });



  return (
    <>
      <Stage
        ref={stageRef}
        width={1024} height={1024}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleLeave}
        onMouseUp={handleMouseUp}
      >

        <Layer
          width={1024}
          height={1024}
        >

          <Rect
            x={100}
            y={100}
            width={100}
            height={100}
            fill={'blue'}
          />

          {points &&

            <Line
              points={points}
              stroke={'red'}
              strokeWidth={10}
              lineJoin='round'
              lineCap='round'
            />
          }



        </Layer>

      </Stage>
    </>
  )
}

export default App
