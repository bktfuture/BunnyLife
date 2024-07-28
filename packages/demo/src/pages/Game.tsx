import React, { useState, useEffect, useRef } from 'react';

const Game = () => {
  const [playerPosition, setPlayerPosition] = useState(400);
  const [playerCount, setPlayerCount] = useState(10);
  const [enemies, setEnemies] = useState([]);
  const [bullets, setBullets] = useState([]);
  const [barriers, setBarriers] = useState([]);
  const [score, setScore] = useState(0);
  
  const gameLoopRef = useRef();
  const gameAreaRef = useRef();

  useEffect(() => {
    gameLoopRef.current = setInterval(() => {
      updateGameState();
    }, 50);

    return () => clearInterval(gameLoopRef.current);
  }, []);

  const updateGameState = () => {
    // Automatically shoot bullets
    if (Math.random() < 0.3) {  // 30% chance to shoot each frame
      setBullets(prev => [...prev, { x: playerPosition + 25, y: 550 }]);
    }

    // Move bullets
    setBullets(prev => prev.map(bullet => ({ ...bullet, y: bullet.y - 5 })).filter(bullet => bullet.y > 0));

    // Move enemies
    setEnemies(prev => {
      const updatedEnemies = prev.map(enemy => ({ ...enemy, y: enemy.y + 2 }));
      if (Math.random() < 0.05) {
        updatedEnemies.push({ x: Math.random() * 800, y: 0 });
      }
      return updatedEnemies.filter(enemy => enemy.y < 600);
    });

    // Check collisions
    setBullets(prev => {
      const newBullets = [...prev];
      setEnemies(enemies => enemies.filter(enemy => {
        const hitByBullet = newBullets.findIndex(bullet =>
          Math.abs(bullet.x - enemy.x) < 20 && Math.abs(bullet.y - enemy.y) < 20
        );
        if (hitByBullet !== -1) {
          newBullets.splice(hitByBullet, 1);
          setScore(s => s + 10);
          return false;
        }
        return true;
      }));
      return newBullets;
    });

    // Update score
    setScore(prev => prev + 1);

    // Spawn barriers
    if (Math.random() < 0.02) {
      const changeAmount = Math.floor(Math.random() * 5) + 1;
      setBarriers(prev => [...prev, {
        x: Math.random() * 750,
        y: 0,
        type: Math.random() < 0.5 ? 'increase' : 'decrease',
        amount: changeAmount
      }]);
    }

    // Move barriers
    setBarriers(prev => prev.map(barrier => ({ ...barrier, y: barrier.y + 2 }))
      .filter(barrier => barrier.y < 600));

    // Check barrier collisions
    setBarriers(prev => {
      const collidedBarrier = prev.find(barrier => 
        Math.abs(barrier.x - playerPosition) < 50 && barrier.y > 550
      );
      if (collidedBarrier) {
        setPlayerCount(count => 
          collidedBarrier.type === 'increase' 
            ? count + collidedBarrier.amount 
            : Math.max(1, count - collidedBarrier.amount)
        );
        return prev.filter(barrier => barrier !== collidedBarrier);
      }
      return prev;
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      setPlayerPosition(prev => Math.max(0, prev - 20));
    } else if (e.key === 'ArrowRight') {
      setPlayerPosition(prev => Math.min(750, prev + 20));
    }
  };

  useEffect(() => {
    gameAreaRef.current.focus();
  }, []);

  return (
    <div ref={gameAreaRef} tabIndex="0" onKeyDown={handleKeyDown} style={{ outline: 'none' }}>
      <svg width="800" height="600" style={{ background: '#eee' }}>
        {/* Player */}
        {Array.from({ length: playerCount }).map((_, i) => (
          <rect key={i} x={playerPosition + i * 5} y={580} width="10" height="10" fill="blue" />
        ))}

        {/* Bullets */}
        {bullets.map((bullet, i) => (
          <circle key={i} cx={bullet.x} cy={bullet.y} r="3" fill="red" />
        ))}

        {/* Enemies */}
        {enemies.map((enemy, i) => (
          <rect key={i} x={enemy.x} y={enemy.y} width="20" height="20" fill="green" />
        ))}

        {/* Barriers */}
        {barriers.map((barrier, i) => (
          <g key={i}>
            <rect x={barrier.x} y={barrier.y} width="50" height="20" 
                  fill={barrier.type === 'increase' ? 'yellow' : 'orange'} />
            <text x={barrier.x + 25} y={barrier.y + 15} fontSize="12" textAnchor="middle" fill="black">
              {barrier.type === 'increase' ? `+${barrier.amount}` : `-${barrier.amount}`}
            </text>
          </g>
        ))}

        {/* Score */}
        <text x="10" y="30" fontSize="20">{`Score: ${score}`}</text>
      </svg>
    </div>
  );
};

export default Game;