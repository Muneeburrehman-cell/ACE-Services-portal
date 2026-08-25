'use client';
import { useEffect, useRef } from 'react';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Edge {
  from: number;
  to: number;
  color?: string;
  width?: number;
}

export function Construction3DCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let lastFrame = 0;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);

    const setCanvasSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    setCanvasSize();

    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0.35;
    let targetRotY = 0.65;
    let currentRotX = 0.35;
    let currentRotY = 0.65;
    let scanY = -250;

    const handleResize = () => {
      if (!canvas) return;
      setCanvasSize();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / width - 0.5) * 0.4;
      mouseY = (e.clientY / height - 0.5) * 0.4;
      targetRotX = 0.35 + mouseY;
      targetRotY = 0.65 + mouseX;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // ── Build 3D Architectural Structure (Multi-Story Steel Framework) ──
    const nodes: Point3D[] = [];
    const edges: Edge[] = [];

    const gridSize = 4;
    const floors = 3;
    const spacing = 90;
    const floorHeight = 85;

    // Generate column and floor nodes
    for (let f = 0; f <= floors; f++) {
      const y = -f * floorHeight + 100;
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const x = (i - (gridSize - 1) / 2) * spacing;
          const z = (j - (gridSize - 1) / 2) * spacing;
          nodes.push({ x, y, z });
        }
      }
    }

    const getIndex = (f: number, i: number, j: number) => f * (gridSize * gridSize) + i * gridSize + j;

    // Connect floor beams and vertical columns
    for (let f = 0; f <= floors; f++) {
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const current = getIndex(f, i, j);

          // Horizontal beams (X)
          if (i < gridSize - 1) {
            edges.push({ from: current, to: getIndex(f, i + 1, j), color: 'rgba(234, 179, 8, 0.45)', width: 1.2 });
          }
          // Horizontal beams (Z)
          if (j < gridSize - 1) {
            edges.push({ from: current, to: getIndex(f, i, j + 1), color: 'rgba(59, 130, 246, 0.45)', width: 1.2 });
          }
          // Vertical columns (Y)
          if (f < floors) {
            edges.push({ from: current, to: getIndex(f + 1, i, j), color: 'rgba(250, 204, 21, 0.65)', width: 1.8 });
            // Diagonal structural cross-bracing on outer perimeter
            if (i === 0 && j < gridSize - 1) {
              edges.push({ from: current, to: getIndex(f + 1, i, j + 1), color: 'rgba(147, 197, 253, 0.25)', width: 0.8 });
            }
            if (j === 0 && i < gridSize - 1) {
              edges.push({ from: current, to: getIndex(f + 1, i + 1, j), color: 'rgba(147, 197, 253, 0.25)', width: 0.8 });
            }
          }
        }
      }
    }

    // Ambient floating particles
    const particles = Array.from({ length: 45 }).map(() => ({
      x: (Math.random() - 0.5) * 600,
      y: (Math.random() - 0.5) * 500,
      z: (Math.random() - 0.5) * 600,
      speedY: 0.2 + Math.random() * 0.4,
      size: 1.5 + Math.random() * 2,
    }));

    // ── 3D Projection Math ──
    const project = (p: Point3D, rotX: number, rotY: number, cx: number, cy: number, scale = 1.15) => {
      // Rotate around Y
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const x1 = p.x * cosY + p.z * sinY;
      const z1 = -p.x * sinY + p.z * cosY;

      // Rotate around X
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const y2 = p.y * cosX - z1 * sinX;
      const z2 = p.y * sinX + z1 * cosX;

      const fov = 750;
      const perspective = fov / (fov + z2);

      return {
        x: cx + x1 * perspective * scale,
        y: cy + y2 * perspective * scale,
        z: z2,
        scale: perspective,
      };
    };

    let autoAngle = 0;

    const render = (timestamp: number) => {
      if (timestamp - lastFrame < 33) {
        animId = requestAnimationFrame(render);
        return;
      }
      lastFrame = timestamp;
      ctx.clearRect(0, 0, width, height);

      // Smooth interpolation for mouse follow + slow ambient rotation
      autoAngle += 0.002;
      currentRotX += (targetRotX - currentRotX) * 0.05;
      currentRotY += (targetRotY + autoAngle - currentRotY) * 0.05;

      const cx = width * 0.5;
      const cy = height * 0.52;

      // Update scan laser
      scanY += 1.2;
      if (scanY > 200) scanY = -250;

      // ── Draw Ground Isometric Blueprint Grid ──
      const gridSpan = 6;
      const gridStep = 75;
      ctx.strokeStyle = 'rgba(39, 39, 42, 0.4)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (let i = -gridSpan; i <= gridSpan; i++) {
        const start = project({ x: i * gridStep, y: 100, z: -gridSpan * gridStep }, currentRotX, currentRotY, cx, cy);
        const end = project({ x: i * gridStep, y: 100, z: gridSpan * gridStep }, currentRotX, currentRotY, cx, cy);
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);

        const startZ = project({ x: -gridSpan * gridStep, y: 100, z: i * gridStep }, currentRotX, currentRotY, cx, cy);
        const endZ = project({ x: gridSpan * gridStep, y: 100, z: i * gridStep }, currentRotX, currentRotY, cx, cy);
        ctx.moveTo(startZ.x, startZ.y);
        ctx.lineTo(endZ.x, endZ.y);
      }
      ctx.stroke();

      // ── Project Structure Nodes ──
      const projectedNodes = nodes.map(n => project(n, currentRotX, currentRotY, cx, cy));

      // ── Draw Structural Edges ──
      for (const edge of edges) {
        const p1 = projectedNodes[edge.from];
        const p2 = projectedNodes[edge.to];

        ctx.strokeStyle = edge.color || 'rgba(234, 179, 8, 0.4)';
        ctx.lineWidth = (edge.width || 1) * p1.scale;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // ── Draw Glowing Vertex Nodes & Elevation Measurement Indicators ──
      for (let idx = 0; idx < projectedNodes.length; idx++) {
        const p = projectedNodes[idx];
        const originalNode = nodes[idx];

        // Draw node dot
        ctx.fillStyle = originalNode.y === 100 ? '#eab308' : '#60a5fa';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5 * p.scale, 0, Math.PI * 2);
        ctx.fill();

        // Selective elevation ticks on corners
        if (originalNode.x === 135 && originalNode.z === 135) {
          ctx.fillStyle = 'rgba(250, 204, 21, 0.7)';
          ctx.font = `${Math.max(9, Math.floor(10 * p.scale))}px monospace`;
          ctx.fillText(`+${Math.abs(Math.floor((100 - originalNode.y) / 8.5))}m`, p.x + 8, p.y + 3);
        }
      }

      // ── Draw Scanning Laser Plane ──
      const laser1 = project({ x: -200, y: scanY, z: -200 }, currentRotX, currentRotY, cx, cy);
      const laser2 = project({ x: 200, y: scanY, z: -200 }, currentRotX, currentRotY, cx, cy);
      const laser3 = project({ x: 200, y: scanY, z: 200 }, currentRotX, currentRotY, cx, cy);
      const laser4 = project({ x: -200, y: scanY, z: 200 }, currentRotX, currentRotY, cx, cy);

      ctx.fillStyle = 'rgba(234, 179, 8, 0.04)';
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(laser1.x, laser1.y);
      ctx.lineTo(laser2.x, laser2.y);
      ctx.lineTo(laser3.x, laser3.y);
      ctx.lineTo(laser4.x, laser4.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // ── Draw Ambient Floating Dust Particles ──
      for (const pt of particles) {
        pt.y -= pt.speedY;
        if (pt.y < -300) pt.y = 250;
        const pProj = project(pt, currentRotX, currentRotY, cx, cy);
        ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
        ctx.beginPath();
        ctx.arc(pProj.x, pProj.y, pt.size * pProj.scale, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-60 transition-opacity duration-1000"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
