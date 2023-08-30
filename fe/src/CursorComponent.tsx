import React from 'react';

const cursorStyle = {
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  backgroundColor: 'blue',
};

function CursorComponent({ x, y, id }: { x: number, y: number, id: string }) {
  return <div style={{ ...cursorStyle, position: 'absolute', left: x, top: y }} />;
}

export default CursorComponent;