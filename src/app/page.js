"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useGameEngine, PHASES, WILDCARDS } from "../hooks/useGameEngine";
import soundSynth from "../utils/soundSynth";

const orbitNames = {
  1: "Orbit I: Crescent",
  2: "Orbit II: Gibbous",
  3: "Orbit III: Eclipse"
};

// High-fidelity SVG Moon Phase renderer
function MoonSvg({ phaseId, size = 60, glowColor = "rgba(249, 226, 175, 0.4)" }) {
  const r = 18;
  const c = 20;

  // Render different path data based on phase index
  const renderPhasePath = () => {
    switch (phaseId) {
      case 0: // New Moon
        return null;
      case 1: // Waxing Crescent (sliver on right)
        return <path d={`M 20 2 A 18 18 0 0 1 20 38 A 11 18 0 0 0 20 2 Z`} fill="#f9e2af" filter="url(#glow)" />;
      case 2: // First Quarter (right half lit)
        return <path d={`M 20 2 A 18 18 0 0 1 20 38 Z`} fill="#f9e2af" filter="url(#glow)" />;
      case 3: // Waxing Gibbous (mostly lit on right)
        return <path d={`M 20 2 A 18 18 0 0 1 20 38 A 11 18 0 0 1 20 2 Z`} fill="#f9e2af" filter="url(#glow)" />;
      case 4: // Full Moon
        return <circle cx={c} cy={c} r={r} fill="#f9e2af" filter="url(#glow)" />;
      case 5: // Waning Gibbous (mostly lit on left)
        return <path d={`M 20 2 A 18 18 0 0 0 20 38 A 11 18 0 0 0 20 2 Z`} fill="#f9e2af" filter="url(#glow)" />;
      case 6: // Last Quarter (left half lit)
        return <path d={`M 20 2 A 18 18 0 0 0 20 38 Z`} fill="#f9e2af" filter="url(#glow)" />;
      case 7: // Waning Crescent (sliver on left)
        return <path d={`M 20 2 A 18 18 0 0 0 20 38 A 11 18 0 0 1 20 2 Z`} fill="#f9e2af" filter="url(#glow)" />;
      default:
        return null;
    }
  };

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className="moon-svg-render">
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Background shadow disk of moon */}
      <circle cx={c} cy={c} r={r} fill="#1e1e2e" stroke="#45475a" strokeWidth="0.8" />
      {/* Lit Overlay */}
      {renderPhasePath()}
    </svg>
  );
}

// AI Reaction Emote Renderer
function AiFace({ face, active }) {
  const getEyes = () => {
    switch (face) {
      case "happy":
        return (
          <>
            <path d="M12,18 Q16,14 20,18" stroke="#a6e3a1" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M28,18 Q32,14 36,18" stroke="#a6e3a1" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        );
      case "sad":
        return (
          <>
            <path d="M12,18 Q16,21 20,18" stroke="#89b4fa" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M28,18 Q32,21 36,18" stroke="#89b4fa" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        );
      case "shocked":
        return (
          <>
            <circle cx="16" cy="18" r="3" fill="#f38ba8" />
            <circle cx="32" cy="18" r="3" fill="#f38ba8" />
          </>
        );
      case "thinking":
        return (
          <>
            <line x1="12" y1="17" x2="20" y2="17" stroke="#cba6f7" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M28,18 Q32,15 36,18" stroke="#cba6f7" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        );
      case "sleeping":
        return (
          <>
            <path d="M12,19 Q16,22 20,19" stroke="#94e2d5" strokeWidth="2" fill="none" />
            <path d="M28,19 Q32,22 36,19" stroke="#94e2d5" strokeWidth="2" fill="none" />
          </>
        );
      default: // neutral
        return (
          <>
            <circle cx="16" cy="18" r="2" fill="#cdd6f4" />
            <circle cx="32" cy="18" r="2" fill="#cdd6f4" />
          </>
        );
    }
  };

  const getMouth = () => {
    switch (face) {
      case "happy":
        return <path d="M18,26 Q24,32 30,26" stroke="#a6e3a1" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
      case "sad":
        return <path d="M18,29 Q24,24 30,29" stroke="#89b4fa" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
      case "shocked":
        return <circle cx="24" cy="27" r="3" stroke="#f38ba8" strokeWidth="2" fill="none" />;
      case "thinking":
        return <line x1="20" y1="27" x2="28" y2="27" stroke="#cba6f7" strokeWidth="2.5" strokeLinecap="round" />;
      case "sleeping":
        return <path d="M22,27 Q24,29 26,27" stroke="#94e2d5" strokeWidth="1.5" fill="none" />;
      default: // neutral
        return <line x1="20" y1="27" x2="28" y2="27" stroke="#cdd6f4" strokeWidth="2" strokeLinecap="round" />;
    }
  };

  return (
    <div className={`ai-avatar ${active ? "active" : ""} ${face}`}>
      <svg width="80" height="80" viewBox="0 0 48 48">
        <defs>
          <filter id="glow-ai" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {/* Main Face Moon */}
        <circle cx="24" cy="24" r="20" fill="url(#ai-face-grad)" stroke="#cba6f7" strokeWidth="1.5" filter="url(#glow-ai)" />
        <linearGradient id="ai-face-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e1e2e" />
          <stop offset="100%" stopColor="#313244" />
        </linearGradient>
        {/* Face marks (craters) */}
        <circle cx="12" cy="12" r="2" fill="#45475a" opacity="0.3" />
        <circle cx="36" cy="34" r="3" fill="#45475a" opacity="0.3" />
        <circle cx="10" cy="30" r="1.5" fill="#45475a" opacity="0.2" />
        {/* Eyes & Mouth */}
        {getEyes()}
        {getMouth()}
      </svg>
    </div>
  );
}

export default function Home() {
  const {
    gameStage,
    level,
    board,
    playerHand,
    aiHand,
    playerScore,
    aiScore,
    turn,
    playerWilds,
    selectedHandCard,
    recentCombos,
    aiFace,
    activeWildEffect,
    muteSound,
    isAnimating,
    gamesWon,
    playerBonus,
    aiBonus,
    setSelectedHandCard,
    startNewLevelProgression,
    startNextGame,
    goToMenu,
    goToTutorial,
    handlePlayWildcard,
    handleCellClick,
    handleToggleMute
  } = useGameEngine();

  const renderProgressDots = (count) => {
    return (
      <div className="progress-dots" title={`${count} of 3 games won at this level`}>
        {[1, 2, 3].map((dotIndex) => (
          <span 
            key={dotIndex} 
            className={`progress-dot ${dotIndex <= count ? "filled" : ""}`}
          />
        ))}
      </div>
    );
  };

  const gridRef = useRef(null);
  const [cellCenters, setCellCenters] = useState({});

  const updateCellCenters = useCallback(() => {
    if (!gridRef.current) return;
    const containerRect = gridRef.current.getBoundingClientRect();
    const centers = {};
    
    board.forEach(cell => {
      const cellEl = document.getElementById(cell.id);
      if (cellEl) {
        const cellRect = cellEl.getBoundingClientRect();
        centers[cell.id] = {
          x: cellRect.left - containerRect.left + cellRect.width / 2,
          y: cellRect.top - containerRect.top + cellRect.height / 2,
          width: cellRect.width,
          height: cellRect.height
        };
      }
    });
    setCellCenters(centers);
  }, [board]);

  useEffect(() => {
    updateCellCenters();
    const timer = setTimeout(updateCellCenters, 100);
    window.addEventListener("resize", updateCellCenters);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateCellCenters);
    };
  }, [updateCellCenters, gameStage, level]);

  const getBoardLinks = () => {
    let links = [];
    const N = level === 1 ? 3 : level === 2 ? 4 : 5;
    
    // Create a 2D map of cells for quick lookup
    const cellMap = {};
    board.forEach(cell => {
      cellMap[`${cell.row}-${cell.col}`] = cell;
    });

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const current = cellMap[`${r}-${c}`];
        if (!current || current.isBlocked) continue;

        // Check horizontal neighbor (right)
        const right = cellMap[`${r}-${c + 1}`];
        if (right && !right.isBlocked) {
          links.push({ cellA: current, cellB: right });
        }

        // Check vertical neighbor (down)
        const down = cellMap[`${r + 1}-${c}`];
        if (down && !down.isBlocked) {
          links.push({ cellA: current, cellB: down });
        }
      }
    }
    return links;
  };

  const [hoveredCellId, setHoveredCellId] = useState(null);

  // Drag and Drop handlers
  const handleDragStart = (e, card) => {
    if (turn !== "player" || isAnimating) {
      e.preventDefault();
      return;
    }
    setSelectedHandCard(card);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setSelectedHandCard(null);
  };

  const handleDropOnCell = (e, cellId) => {
    e.preventDefault();
    setHoveredCellId(null);
    if (turn !== "player" || isAnimating) return;
    handleCellClick(cellId, selectedHandCard);
  };

  // Helper to check if a cell is highlighted in the current combo
  const isCellInCombo = (cellId) => {
    return recentCombos.some(combo => combo.cells.includes(cellId));
  };

  // Get combo description for banner
  const getComboBannerText = () => {
    if (recentCombos.length === 0) return null;
    const items = recentCombos.map(c => {
      if (c.type === "pair") return `Pair (+${c.score} pts)`;
      if (c.type === "full-moon") return `Full Moon (+${c.score} pts)`;
      if (c.type === "cycle") return `Lunar Cycle (+${c.score} pts)`;
      if (c.type === "wildcard") return `Wildcard Spell!`;
      return "Combo!";
    });
    return items.join(" & ");
  };

  // Get AI quote based on face reaction
  const getAiSpeechBubble = () => {
    switch (aiFace) {
      case "thinking":
        return "Let's see... what orbital phase fits here?";
      case "happy":
        return "A match! The moon alignments favor my side.";
      case "sad":
        return "Ouch, you broke my lunar cycle sequence!";
      case "shocked":
        return "Celestial anomalies! What a wildcard!";
      case "sleeping":
        return "Zzz... take your turn, child of the stars.";
      default:
        return "The tides are shifting. I await your alignment.";
    }
  };

  return (
    <div className="game-container">
      {/* Background Starfield */}
      <div className="starfield">
        <div className="stars-layer-1"></div>
        <div className="stars-layer-2"></div>
        <div className="ambient-nebula"></div>
      </div>

      {/* Header Panel */}
      <header className="game-header">
        <div className="logo-section" onClick={goToMenu}>
          <span className="logo-spark">✨</span>
          <h1>CELESTIAL CYCLES</h1>
        </div>
        <div className="header-controls">
          <button className="icon-btn" onClick={handleToggleMute} title={muteSound ? "Unmute" : "Mute"}>
            {muteSound ? "🔇" : "🔊"}
          </button>
          {gameStage !== "menu" && (
            <button className="menu-btn" onClick={goToMenu}>
              Quit
            </button>
          )}
        </div>
      </header>

      <main className="game-content">
        {/* STAGE: MENU */}
        {gameStage === "menu" && (
          <div className="menu-view glass-panel">
            <div className="menu-title-glow">
              <MoonSvg phaseId={4} size={90} />
            </div>
            <h2>Rise of the Lunar Grid</h2>
            <p className="menu-tagline">
              Strategically place lunar phases, align cosmic cycles, outsmart the Half Moon AI, and command wildcards.
            </p>
            <div className="menu-actions">
              <button className="primary-btn glow-gold-btn" onClick={startNewLevelProgression}>
                <span>Enter Orbit (Play)</span>
              </button>
              <button className="secondary-btn" onClick={goToTutorial}>
                <span>How to Align (Tutorial)</span>
              </button>
            </div>
          </div>
        )}

        {/* STAGE: TUTORIAL */}
        {gameStage === "tutorial" && (
          <div className="tutorial-view glass-panel max-width-container">
            <h2>The Celestial Rules</h2>
            <p className="intro-text">
              Compete against the AI (The Half Moon) by placing cards from your hand onto the cosmic grid. 
              Earn points immediately by forming combinations, and flip the board tiles to your color!
            </p>

            <div className="rules-grid">
              <div className="rule-card">
                <h3>1. Phase Pairs (0.5 Pt)</h3>
                <p>Place two cards of the identical lunar phase side-by-side (horizontally or vertically).</p>
                <div className="rule-visual">
                  <MoonSvg phaseId={2} size={40} />
                  <span className="visual-connector">+</span>
                  <MoonSvg phaseId={2} size={40} />
                </div>
              </div>

              <div className="rule-card">
                <h3>2. Full Moon Pairs (2 Pts)</h3>
                <p>Combine two complementary phases (e.g. Crescent + Gibbous, or Quarter + Quarter) that sum to a Full Moon.</p>
                <div className="rule-visual">
                  <MoonSvg phaseId={1} size={40} />
                  <span className="visual-connector">+</span>
                  <MoonSvg phaseId={5} size={40} />
                </div>
              </div>

              <div className="rule-card">
                <h3>3. Lunar Cycles (1 Pt per card)</h3>
                <p>Align 3 or more phases in consecutive order along any adjacent path (e.g., Crescent ➔ Quarter ➔ Gibbous). Loops around!</p>
                <div className="rule-visual">
                  <MoonSvg phaseId={1} size={35} />
                  <span className="visual-arrow">➔</span>
                  <MoonSvg phaseId={2} size={35} />
                  <span className="visual-arrow">➔</span>
                  <MoonSvg phaseId={3} size={35} />
                </div>
              </div>

              <div className="rule-card">
                <h3>4. Board Ownership</h3>
                <p>When you form a combo, those tiles flip to your color (Gold). At the end of the round when the board is full, get +1 extra point for every tile under your color!</p>
                <div className="rule-visual-spec">
                  <span className="dot player-dot">Player</span>
                  <span className="dot ai-dot">AI</span>
                </div>
            </div>
          </div>

          <div className="lunar-fact-box mt-6">
              <h3>Did You Know? 🌓</h3>
              <p>
                The half moon is scientifically known as the <strong>Quarter moon</strong>. People casually refer to the 
                Quarter moon as half moon because it appears like half the moon is present but, in fact, only a quarter of the moon is illuminated.
              </p>
              <p className="mt-2">
                Following the first Quarter moon, the moon enters its Waxing Gibbous phase, becoming brighter and brighter until the next full moon. And following the last Quarter moon, the moon enters its Waning Crescent phase, darkening into a New moon.
              </p>
            </div>

            <button className="primary-btn mt-6" onClick={goToMenu}>
              Return to Menu
            </button>
          </div>
        )}



        {/* STAGE: PLAYING */}
        {gameStage === "playing" && (
          <div className="playing-layout">
            
            {/* Top Bar: AI Reaction / Speech Bubble */}
            <div className="ai-row glass-panel">
              <AiFace face={aiFace} active={turn === "ai"} />
              <div className="ai-speech">
                <div className="speech-bubble-tail"></div>
                <p>{getAiSpeechBubble()}</p>
              </div>
            </div>

            {/* Middle Section: Scores and Grid */}
            <div className="game-grid-section">
              {/* Score Player */}
              <div className="player-scoreboard glass-panel player-side">
                <h3>YOUR ORBIT</h3>
                <div className="score-value player-glow">{playerScore}</div>
                <div className="turn-indicator">{turn === "player" ? "⚡ YOUR TURN" : "WAITING..."}</div>
                <div className="hand-count">Cards remaining: {playerHand.length}</div>
              </div>

              {/* Board Center Container */}
              <div className="board-center">
                <div className="orbit-header-panel">
                  <span className="orbit-name">{orbitNames[level] || `Orbit ${level}`}</span>
                  {renderProgressDots(gamesWon)}
                </div>

                {/* Active Wildcard Notice banner */}
                {activeWildEffect && (
                  <div className={`wild-banner ${activeWildEffect}`}>
                    <span>🔮 {activeWildEffect.toUpperCase()} ACTIVE:</span> 
                    {activeWildEffect === "meteor" ? "Click any card on the board to vaporize it." : "Click a cell to play a card with active magic!"}
                  </div>
                )}
                {/* Combo Scored Flash banner */}
                {recentCombos.length > 0 && (
                  <div className="combo-flash-banner animate-fade-in">
                    🌟 {getComboBannerText()}!
                  </div>
                )}

                {/* Grid Dynamic Rendering */}
                <div ref={gridRef} className={`board-grid grid-level-${level}`}>
                   {/* Visual connection lines overlay */}
                   <svg className="connection-lines-svg">
                     {getBoardLinks().map((link, idx) => {
                       const posA = cellCenters[link.cellA.id];
                       const posB = cellCenters[link.cellB.id];
                       
                       if (!posA || !posB) return null;

                       // Find if this link is part of an active combo
                       const activeCombo = recentCombos.find(combo => 
                         combo.cells.includes(link.cellA.id) && combo.cells.includes(link.cellB.id)
                       );
                       const isLinked = !!activeCombo;

                       if (!isLinked) return null; // Only draw lines when they are actively linked in a combo
                       
                       // Determine whose link it is (player or AI) to set colors
                       let ownerClass = "";
                       if (isLinked) {
                         const owner = link.cellA.card?.owner || link.cellB.card?.owner;
                         if (owner === "ai") ownerClass = "ai-link";
                       }

                        const cellWidth = posA.width;
                        const cellHeight = posA.height;
                        let x1 = posA.x;
                        let y1 = posA.y;
                        let x2 = posB.x;
                        let y2 = posB.y;

                        // Calculate endpoints at the edges of the cards to avoid crossing through the card contents
                        if (link.cellA.row === link.cellB.row) {
                          const left = posA.x < posB.x ? posA : posB;
                          const right = posA.x < posB.x ? posB : posA;
                          x1 = left.x + cellWidth / 2;
                          y1 = left.y;
                          x2 = right.x - cellWidth / 2;
                          y2 = right.y;
                        } else {
                          const top = posA.y < posB.y ? posA : posB;
                          const bottom = posA.y < posB.y ? posB : posA;
                          x1 = top.x;
                          y1 = top.y + cellHeight / 2;
                          x2 = bottom.x;
                          y2 = bottom.y - cellHeight / 2;
                        }

                        return (
                          <line
                            key={`link-${idx}`}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            className={`connection-line ${isLinked ? "linked" : ""} ${ownerClass}`}
                          />
                        );
                     })}
                   </svg>

                  {board.map((cell) => {
                    if (cell.isBlocked) {
                      return (
                        <div key={cell.id} id={cell.id} className="board-cell cell-blocked">
                          <span className="blocked-star">★</span>
                        </div>
                      );
                    }
                    const hasGhost = !cell.card && selectedHandCard && hoveredCellId === cell.id && turn === "player";
                    return (
                      <div
                        key={cell.id}
                        id={cell.id}
                        onClick={() => handleCellClick(cell.id)}
                        onDragOver={(e) => {
                          if (turn === "player" && !cell.card && !cell.isBlocked) {
                            e.preventDefault();
                          }
                        }}
                        onDragEnter={() => {
                          if (turn === "player" && !cell.card && !cell.isBlocked) {
                            setHoveredCellId(cell.id);
                          }
                        }}
                        onDragLeave={() => setHoveredCellId(null)}
                        onDrop={(e) => handleDropOnCell(e, cell.id)}
                        onMouseEnter={() => {
                          if (turn === "player" && !cell.card && !cell.isBlocked) {
                            setHoveredCellId(cell.id);
                          }
                        }}
                        onMouseLeave={() => setHoveredCellId(null)}
                        className={`board-cell cell-playable ${cell.card ? "has-card" : "cell-empty"} ${
                          isCellInCombo(cell.id) ? "combo-highlight" : ""
                        } ${cell.isFlipping ? "flip-anim" : ""}`}
                      >
                        {cell.card ? (
                          <div className={`placed-card owner-${cell.card.owner}`}>
                            <div className="card-top-mini">
                              <span className="card-num">{cell.card.phase + 1}/8</span>
                            </div>
                            <MoonSvg phaseId={cell.card.phase} size={40} />
                            <span className="placed-card-name">{cell.card.name}</span>
                            <div className="card-glow-overlay"></div>
                          </div>
                        ) : hasGhost ? (
                          <div className="ghost-card">
                            <MoonSvg phaseId={selectedHandCard.phase} size={30} />
                            <span className="ghost-label">{selectedHandCard.name}</span>
                          </div>
                        ) : (
                          <div className="empty-indicator">
                            <span className="coord">{cell.row + 1},{cell.col + 1}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Score AI */}
              <div className="player-scoreboard glass-panel ai-side">
                <h3>HALF MOON</h3>
                <div className="score-value ai-glow">{aiScore}</div>
                <div className="turn-indicator">{turn === "ai" ? "⌛ THINKING..." : "WAITING..."}</div>
                <div className="hand-count">Cards remaining: {aiHand.length}</div>
              </div>
            </div>

            {/* Bottom Bar: Player Hand and Wildcards */}
            <div className="player-controls-row">
              {/* Hand cards */}
              <div className="hand-container glass-panel">
                <h4>YOUR HAND</h4>
                <div className="hand-cards">
                  {playerHand.map((card) => {
                    const isSelected = selectedHandCard && selectedHandCard.id === card.id;
                    return (
                      <div
                        key={card.id}
                        draggable={turn === "player" && !isAnimating}
                        onDragStart={(e) => handleDragStart(e, card)}
                        onDragEnd={handleDragEnd}
                        onClick={() => {
                          if (turn === "player" && !isAnimating) {
                            setSelectedHandCard(isSelected ? null : card);
                            soundSynth.playHover();
                          }
                        }}
                        className={`tarot-card ${isSelected ? "selected-glow" : ""} ${isAnimating ? "disabled-interact" : ""}`}
                      >
                        <div className="card-stars">✨</div>
                        <div className="card-header-idx">{card.phase + 1} / 8</div>
                        <div className="card-body">
                          <MoonSvg phaseId={card.phase} size={50} />
                          <span className="card-name-label">{card.name}</span>
                        </div>
                        <div className="card-border-gold"></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Wildcards panel */}
              <div className="wildcards-container glass-panel">
                <h4>SPELL WILDCARDS</h4>
                {playerWilds.length > 0 ? (
                  <div className="wildcards-list">
                    {playerWilds.map((wildType, idx) => {
                      const wildMeta = WILDCARDS.find(w => w.type === wildType);
                      return (
                        <div
                          key={`${wildType}-${idx}`}
                          className={`wild-card-btn ${isAnimating ? "disabled-interact" : ""}`}
                          onClick={() => { if (!isAnimating) handlePlayWildcard(wildType); }}
                          title={wildMeta.description}
                        >
                          <span className="wild-icon">{wildMeta.icon}</span>
                          <span className="wild-name">{wildMeta.name}</span>
                          <div className="wild-tooltip">{wildMeta.description}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-wilds-message">
                    Win rounds to unlock cosmic wildcards!
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* STAGE: ROUND END */}
        {gameStage === "round-end" && (
          <div className="round-end-view glass-panel">
            {playerScore >= aiScore ? (
              <div className="victory-badge">
                <span className="crown">👑</span>
                <h2>{gamesWon === 3 ? "ORBIT COMPLETED!" : "ROUND WON!"}</h2>
              </div>
            ) : (
              <div className="defeat-badge">
                <span className="skull">💀</span>
                <h2>DEFEATED</h2>
              </div>
            )}

            <div className="round-breakdown">
              <h3>Orbit Alignment Summary</h3>
              <div className="breakdown-table">
                <div className="table-row">
                  <span>Current Orbit:</span>
                  <strong>{orbitNames[level]}</strong>
                </div>
                <div className="table-row">
                  <span>Combo Alignments:</span>
                  <strong>
                    <span className="player-text">{playerScore - playerBonus}</span> vs{" "}
                    <span className="ai-text">{aiScore - aiBonus}</span>
                  </strong>
                </div>
                <div className="table-row">
                  <span>Board Card Bonus:</span>
                  <strong>
                    <span className="player-text">+{playerBonus}</span> vs{" "}
                    <span className="ai-text">+{aiBonus}</span>
                  </strong>
                </div>
                <div className="table-row total-row">
                  <span>Final Scores:</span>
                  <strong>
                    <span className="player-text">{playerScore} pts</span> vs{" "}
                    <span className="ai-text">{aiScore} pts</span>
                  </strong>
                </div>
                <div className="table-row progression-row">
                  <span>Orbit Progress:</span>
                  {renderProgressDots(gamesWon)}
                </div>
              </div>
              
              {playerScore >= aiScore && (
                <div className="unlock-alert">
                  <span>🎁 Unlocked New Wildcard:</span>
                  <strong>
                    {WILDCARDS[playerWilds.length > 0 ? (playerWilds.length - 1) % WILDCARDS.length : 0].name}
                  </strong>
                </div>
              )}
            </div>

            <div className="round-end-actions">
              {playerScore >= aiScore ? (
                <button className="primary-btn glow-gold-btn" onClick={startNextGame}>
                  {gamesWon === 3 ? "Advance to Next Orbit" : "Next Game"}
                </button>
              ) : (
                <button className="primary-btn glow-gold-btn" onClick={startNextGame}>
                  Retry Game
                </button>
              )}
              <button className="secondary-btn" onClick={goToMenu}>
                Main Menu
              </button>
            </div>
          </div>
        )}

        {/* STAGE: GAME VICTORY */}
        {gameStage === "game-victory" && (
          <div className="game-victory-view glass-panel animate-fade-in">
            <div className="victory-badge">
              <span className="trophy">🏆</span>
              <h2>CAMPAIGN COMPLETED!</h2>
            </div>
            <p className="victory-tagline">
              You have outsmarted the Half Moon, aligned all three lunar orbits, and restored cosmic balance!
            </p>
            <div className="victory-summary">
              <h3>Final Campaign Standings</h3>
              <div className="breakdown-table">
                <div className="table-row">
                  <span>Your Score:</span>
                  <strong className="player-text">{playerScore} pts</strong>
                </div>
                <div className="table-row">
                  <span>Half Moon Score:</span>
                  <strong className="ai-text">{aiScore} pts</strong>
                </div>
              </div>
            </div>
            <div className="victory-actions">
              <button className="primary-btn glow-gold-btn" onClick={startNewLevelProgression}>
                <span>Play Campaign Again</span>
              </button>
              <button className="secondary-btn" onClick={goToMenu}>
                <span>Return to Menu</span>
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Footer credits */}
      <footer className="game-footer">
        <p>Created with Celestial Math & HTML5 Web Audio Synthesizer • React Next.js</p>
      </footer>
    </div>
  );
}
