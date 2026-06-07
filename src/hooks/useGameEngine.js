import { useState, useEffect, useCallback, useRef } from "react";
import soundSynth from "../utils/soundSynth";

// Lunar Phases metadata
export const PHASES = [
  { id: 0, name: "New Moon", icon: "🌑", lit: 0.0, side: "none" },
  { id: 1, name: "Waxing Crescent", icon: "🌒", lit: 0.25, side: "right" },
  { id: 2, name: "First Quarter", icon: "🌓", lit: 0.5, side: "right" },
  { id: 3, name: "Waxing Gibbous", icon: "🌔", lit: 0.75, side: "right" },
  { id: 4, name: "Full Moon", icon: "🌕", lit: 1.0, side: "both" },
  { id: 5, name: "Waning Gibbous", icon: "🌖", lit: 0.75, side: "left" },
  { id: 6, name: "Last Quarter", icon: "🌗", lit: 0.5, side: "left" },
  { id: 7, name: "Waning Crescent", icon: "🌘", lit: 0.25, side: "left" }
];

export const WILDCARDS = [
  { type: "equinox", name: "Equinox", description: "Swap scores with the Half Moon", icon: "☯️" },
  { type: "supermoon", name: "Supermoon", description: "Doubles combo scores this turn", icon: "🌟" },
  { type: "eclipse", name: "Solar Eclipse", description: "Flips all adjacent cards to your color", icon: "☀️" },
  { type: "meteor", name: "Meteor Shower", description: "Removes any card from the board", icon: "☄️" }
];

// Helper to generate board cells based on level
function generateGrid(level) {
  let grid = [];
  if (level === 1) {
    // 3x3 Grid (9 playable cells)
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        grid.push({ id: `cell-${r}-${c}`, row: r, col: c, isBlocked: false, card: null });
      }
    }
  } else if (level === 2) {
    // 4x4 Grid with corner blocks (12 playable cells)
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const isCorner = (r === 0 || r === 3) && (c === 0 || c === 3);
        grid.push({ id: `cell-${r}-${c}`, row: r, col: c, isBlocked: isCorner, card: null });
      }
    }
  } else if (level === 3) {
    // 5x5 Grid with custom cross block pattern (16 playable cells)
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const isCorner = (r === 0 || r === 4) && (c === 0 || c === 4);
        const isCenter = r === 2 && c === 2;
        const isInnerCorner = (r === 1 || r === 3) && (c === 1 || c === 3); // creates a hollow ring
        const isBlocked = isCorner || isCenter || isInnerCorner;
        grid.push({ id: `cell-${r}-${c}`, row: r, col: c, isBlocked, card: null });
      }
    }
  }
  return grid;
}

// Helper to generate a shuffled deck
function createDeck() {
  let deck = [];
  let cardId = 0;
  // 4 cards of each phase = 32 cards total
  for (let i = 0; i < 4; i++) {
    PHASES.forEach((phase) => {
      deck.push({
        id: `card-${cardId++}`,
        phase: phase.id,
        owner: null,
        isWild: false,
        name: phase.name,
        icon: phase.icon
      });
    });
  }
  // Shuffle using Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function useGameEngine() {
  const [gameStage, setGameStage] = useState("menu"); // menu, tutorial, level-select, playing, round-end, game-over
  const [level, setLevel] = useState(1);
  const [deck, setDeck] = useState([]);
  const [board, setBoard] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [aiHand, setAiHand] = useState([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [turn, setTurn] = useState("player"); // player, ai
  const [playerWilds, setPlayerWilds] = useState(["equinox"]); // Start with one Equinox wildcard
  const [selectedHandCard, setSelectedHandCard] = useState(null); // card object or wildcard object
  const [recentCombos, setRecentCombos] = useState([]); // tracks active matches for animations
  const [aiFace, setAiFace] = useState("sleeping"); // neutral, happy, sad, shocked, thinking, sleeping
  const [activeWildEffect, setActiveWildEffect] = useState(null); // tracking active wildcard placement (e.g. meteor)
  const [muteSound, setMuteSound] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const aiTurnInProgress = useRef(false);

  // Sound toggling
  const handleToggleMute = useCallback(() => {
    const isMuted = soundSynth.toggleMute();
    setMuteSound(isMuted);
  }, []);

  // Initialize a new round/level
  const startLevel = useCallback((selectedLevel) => {
    soundSynth.resume();
    soundSynth.playClick();
    
    setLevel(selectedLevel);
    const newDeck = createDeck();
    const newGrid = generateGrid(selectedLevel);
    
    // Draw 3 cards each
    const pHand = newDeck.splice(0, 3).map(c => ({ ...c, owner: "player" }));
    const aHand = newDeck.splice(0, 3).map(c => ({ ...c, owner: "ai" }));
    
    setDeck(newDeck);
    setBoard(newGrid);
    setPlayerHand(pHand);
    setAiHand(aHand);
    setPlayerScore(0);
    setAiScore(0);
    setTurn("player");
    setSelectedHandCard(null);
    setRecentCombos([]);
    setAiFace("sleeping");
    setActiveWildEffect(null);
    setGameStage("playing");

    soundSynth.startAmbient();
  }, []);

  // Go to main menu
  const goToMenu = useCallback(() => {
    soundSynth.playClick();
    setGameStage("menu");
    soundSynth.stopAmbient();
  }, []);

  // Go to level select
  const goToLevelSelect = useCallback(() => {
    soundSynth.playClick();
    setGameStage("level-select");
  }, []);

  // Go to tutorial
  const goToTutorial = useCallback(() => {
    soundSynth.playClick();
    setGameStage("tutorial");
  }, []);

  // Helper to check if two phase indices form a Full Moon (complementary)
  const checkIsFullMoonPair = useCallback((p1, p2) => {
    if (p1 === 4 && p2 === 4) return true; // Full Moon + Full Moon
    if ((p1 === 0 && p2 === 4) || (p1 === 4 && p2 === 0)) return true; // New Moon + Full Moon
    
    const phase1 = PHASES[p1];
    const phase2 = PHASES[p2];
    
    // Complementary sizes (lit percentages sum to 1.0) and opposite lit sides (or one is both/none)
    const matchesLit = Math.abs((phase1.lit + phase2.lit) - 1.0) < 0.01;
    const oppositeSides = 
      (phase1.side === "right" && phase2.side === "left") ||
      (phase1.side === "left" && phase2.side === "right") ||
      (phase1.side === "none" && phase2.side === "both") ||
      (phase1.side === "both" && phase2.side === "none");
      
    return matchesLit && oppositeSides;
  }, []);

  // Helper to check if phase values are consecutive in cycle
  const isConsecutive = useCallback((v1, v2) => {
    const diff = (v2 - v1 + 8) % 8;
    return diff === 1 || diff === 7; // 1 means next phase, 7 means previous phase
  }, []);

  // Search board for combos triggered by a card placement
  const evaluateBoardCombos = useCallback((tempBoard, placedRow, placedCol, placedCardOwner, isSupermoon = false) => {
    let combos = [];
    let cardsToFlip = new Set();
    let comboScore = 0;



    // Helpers to add combos
    const registerCombo = (type, cells, points) => {
      const actualPoints = isSupermoon ? points * 2 : points;
      comboScore += actualPoints;
      combos.push({ type, cells: cells.map(c => c.id), score: actualPoints });
      cells.forEach(c => cardsToFlip.add(c.id));
    };

    // 1. Check Pairs & Full Moons in Cardinal Directions (Up, Down, Left, Right)
    const directions = [
      { r: -1, c: 0 }, // Up
      { r: 1, c: 0 },  // Down
      { r: 0, c: -1 }, // Left
      { r: 0, c: 1 }   // Right
    ];

    const currentCell = tempBoard.find(cell => cell.row === placedRow && cell.col === placedCol);
    if (!currentCell || !currentCell.card) return { combos: [], score: 0, cardsToFlip: [] };
    const placedCard = currentCell.card;

    directions.forEach(dir => {
      const neighborCell = tempBoard.find(cell => cell.row === placedRow + dir.r && cell.col === placedCol + dir.c && !cell.isBlocked);
      if (neighborCell && neighborCell.card) {
        const neighborCard = neighborCell.card;
        
        // Check Phase Pair (Identical phases)
        if (placedCard.phase === neighborCard.phase) {
          registerCombo("pair", [currentCell, neighborCell], 1);
        }
        
        // Check Full Moon Pair (Complementary phases)
        if (checkIsFullMoonPair(placedCard.phase, neighborCard.phase)) {
          registerCombo("full-moon", [currentCell, neighborCell], 2);
        }
      }
    });

    // 2. Check Cycles (Lines of 3 or more consecutive phases containing the placed card)
    // Horizontal Line search (same row)
    const rowCells = tempBoard.filter(cell => cell.row === placedRow && !cell.isBlocked).sort((a, b) => a.col - b.col);
    checkCyclesInLine(rowCells, currentCell);

    // Vertical Line search (same column)
    const colCells = tempBoard.filter(cell => cell.col === placedCol && !cell.isBlocked).sort((a, b) => a.row - b.row);
    checkCyclesInLine(colCells, currentCell);

    function checkCyclesInLine(lineCells, centerCell) {
      const centerIndex = lineCells.findIndex(cell => cell.id === centerCell.id);
      if (centerIndex === -1) return;

      const isAdjacentOnBoard = (cellA, cellB) => 
        Math.abs(cellA.row - cellB.row) + Math.abs(cellA.col - cellB.col) === 1;

      // Find the largest contiguous block of cells with cards around centerIndex
      let startIdx = centerIndex;
      while (startIdx > 0 && lineCells[startIdx - 1].card && isAdjacentOnBoard(lineCells[startIdx], lineCells[startIdx - 1])) {
        startIdx--;
      }
      let endIdx = centerIndex;
      while (endIdx < lineCells.length - 1 && lineCells[endIdx + 1].card && isAdjacentOnBoard(lineCells[endIdx], lineCells[endIdx + 1])) {
        endIdx++;
      }

      const block = lineCells.slice(startIdx, endIdx + 1);
      if (block.length < 3) return;

      // Now look for consecutive runs of length >= 3 in this block that contain the centerCell
      // Since it's a small board, we can check all subsegments containing centerCell
      const centerInBlockIdx = block.findIndex(cell => cell.id === centerCell.id);
      let longestRun = [];

      for (let i = 0; i <= centerInBlockIdx; i++) {
        for (let j = centerInBlockIdx; j < block.length; j++) {
          const runLength = j - i + 1;
          if (runLength >= 3) {
            const sub = block.slice(i, j + 1);
            
            // Check if sub is consecutive forward or backward
            let isForward = true;
            let isBackward = true;
            
            for (let k = 0; k < sub.length - 1; k++) {
              const p1 = sub[k].card.phase;
              const p2 = sub[k+1].card.phase;
              
              // Forward direction test (e.g. 0 -> 1 -> 2)
              if ((p1 + 1) % 8 !== p2) isForward = false;
              // Backward direction test (e.g. 2 -> 1 -> 0)
              if ((p1 - 1 + 8) % 8 !== p2) isBackward = false;
            }

            if ((isForward || isBackward) && runLength > longestRun.length) {
              longestRun = sub;
            }
          }
        }
      }

      if (longestRun.length >= 3) {
        // Score is 1 point per card in sequence
        registerCombo("cycle", longestRun, longestRun.length);
      }
    }

    return {
      combos,
      score: comboScore,
      cardsToFlip: Array.from(cardsToFlip)
    };
  }, [checkIsFullMoonPair]);

  // Execute AI turn
  const runAiTurn = useCallback((currentBoard, currentDeck, currentAiHand, currentAiScore, currentPlayerScore) => {
    if (aiTurnInProgress.current) return;
    aiTurnInProgress.current = true;

    setAiFace("thinking");

    // Helper to evaluate a potential move
    const evaluateMove = (handCardIndex, cellId) => {
      const card = currentAiHand[handCardIndex];
      const targetCell = currentBoard.find(c => c.id === cellId);
      
      // Simulate Board
      const testBoard = currentBoard.map(c => {
        if (c.id === cellId) {
          return { ...c, card: { ...card, owner: "ai" } };
        }
        return c;
      });

      const { score: scoreGained, cardsToFlip } = evaluateBoardCombos(testBoard, targetCell.row, targetCell.col, "ai");
      
      // Calculate how many player cards are flipped to AI
      let flippedPlayerCardsCount = 0;
      cardsToFlip.forEach(fid => {
        const boardCell = currentBoard.find(bc => bc.id === fid);
        if (boardCell && boardCell.card && boardCell.card.owner === "player") {
          flippedPlayerCardsCount++;
        }
      });

      // Total weight
      let weight = scoreGained * 3 + flippedPlayerCardsCount * 2;

      // Strategic padding: place near existing cards if no combos to build sequences
      if (scoreGained === 0) {
        const directions = [
          { r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 }
        ];
        let nearAiCard = false;
        let nearPlayerCard = false;
        directions.forEach(dir => {
          const neighbor = currentBoard.find(bc => bc.row === targetCell.row + dir.r && bc.col === targetCell.col + dir.c && !bc.isBlocked);
          if (neighbor && neighbor.card) {
            if (neighbor.card.owner === "ai") nearAiCard = true;
            if (neighbor.card.owner === "player") nearPlayerCard = true;
          }
        });
        if (nearAiCard) weight += 0.5; // build cycle
        if (nearPlayerCard) weight += 0.2; // block player
      }

      return { handCardIndex, cellId, weight, scoreGained, cardsToFlip };
    };

    // Find all empty playable cells
    const emptyCells = currentBoard.filter(c => !c.isBlocked && !c.card);
    
    // AI has no moves (board full) -> handoff
    if (emptyCells.length === 0 || currentAiHand.length === 0) {
      aiTurnInProgress.current = false;
      return;
    }

    // Collect all valid moves
    let possibleMoves = [];
    for (let i = 0; i < currentAiHand.length; i++) {
      emptyCells.forEach(cell => {
        possibleMoves.push(evaluateMove(i, cell.id));
      });
    }

    // Sort moves by weight descending
    possibleMoves.sort((a, b) => b.weight - a.weight);

    // Pick best move (or add slight randomness so it's not robotic)
    let chosenMove = possibleMoves[0];
    if (possibleMoves.length > 1 && Math.random() < 0.15) {
      // Pick second best if weight difference is small
      if (possibleMoves[0].weight - possibleMoves[1].weight <= 1) {
        chosenMove = possibleMoves[1];
      }
    }

    // Fallback if no moves
    if (!chosenMove) {
      aiTurnInProgress.current = false;
      return;
    }

    // Apply move after a simulated thinking delay
    setTimeout(() => {
      const cardToPlace = currentAiHand[chosenMove.handCardIndex];
      const targetCell = currentBoard.find(c => c.id === chosenMove.cellId);

      setIsAnimating(true);

      // 1. Place the card immediately
      setBoard(prevBoard => prevBoard.map(c => {
        if (c.id === chosenMove.cellId) {
          return { ...c, card: { ...cardToPlace, owner: "ai" } };
        }
        return c;
      }));

      // Remove card from AI hand
      setAiHand(prevHand => {
        const nextHand = prevHand.filter((_, idx) => idx !== chosenMove.handCardIndex);
        let nextDeck = [...currentDeck];
        if (nextDeck.length > 0) {
          const newCard = { ...nextDeck.shift(), owner: "ai" };
          setDeck(nextDeck);
          return [...nextHand, newCard];
        }
        return nextHand;
      });

      // 2. Evaluate combos on simulated board state
      const nextBoardState = currentBoard.map(c => {
        if (c.id === chosenMove.cellId) {
          return { ...c, card: { ...cardToPlace, owner: "ai" } };
        }
        return c;
      });
      const { combos, score: scoreGained, cardsToFlip } = evaluateBoardCombos(nextBoardState, targetCell.row, targetCell.col, "ai");

      if (scoreGained > 0) {
        // Highlight combos immediately
        setRecentCombos(combos);
        setAiFace("happy");

        // Flip after 500ms
        setTimeout(() => {
          setBoard(prev => prev.map(c => {
            if (cardsToFlip.includes(c.id) && c.card) {
              return { 
                ...c, 
                card: { ...c.card, owner: "ai" },
                isFlipping: true
              };
            }
            return c;
          }));
          soundSynth.playFlip();

          setTimeout(() => {
            setBoard(prev => prev.map(c => c.isFlipping ? { ...c, isFlipping: false } : c));
          }, 600);
        }, 500);

        // Add score after 1100ms
        setTimeout(() => {
          setAiScore(prev => prev + scoreGained);
          soundSynth.playScore();
        }, 1100);

        // Clean highlights and hand turn back to player after 1800ms
        setTimeout(() => {
          setRecentCombos([]);
          setAiFace("neutral");
          setIsAnimating(false);
          setTurn("player");
          aiTurnInProgress.current = false; // Turn complete
        }, 1800);

      } else {
        // No combos
        soundSynth.playClick();
        setAiFace("neutral");
        setTimeout(() => {
          setIsAnimating(false);
          setTurn("player");
          aiTurnInProgress.current = false; // Turn complete
        }, 800);
      }
    }, 1200); // 1.2s thinking time
  }, [evaluateBoardCombos]);

  // Trigger AI turn when it changes to AI
  useEffect(() => {
    if (gameStage !== "playing") return;

    // Check if board is full (round end)
    const isBoardFull = board.length > 0 && board.filter(c => !c.isBlocked && !c.card).length === 0;
    if (isBoardFull) {
      handleRoundEnd();
      return;
    }

    if (turn === "ai") {
      runAiTurn(board, deck, aiHand, aiScore, playerScore);
    } else {
      setAiFace("sleeping");
    }
  }, [turn, gameStage, board]);

  // Score the final cards on board and transition to round-end stage
  const handleRoundEnd = () => {
    soundSynth.stopAmbient();

    // End-of-round points: +1 for each card owned
    let playerBoardPoints = 0;
    let aiBoardPoints = 0;

    board.forEach(c => {
      if (c.card && !c.isBlocked) {
        if (c.card.owner === "player") playerBoardPoints++;
        if (c.card.owner === "ai") aiBoardPoints++;
      }
    });

    const finalPlayerScore = playerScore + playerBoardPoints;
    const finalAiScore = aiScore + aiBoardPoints;

    setPlayerScore(finalPlayerScore);
    setAiScore(finalAiScore);

    // Determine level success
    const win = finalPlayerScore >= finalAiScore;

    setTimeout(() => {
      if (win) {
        soundSynth.playWin();
        setAiFace("sad");
        
        // Grant a random wildcard on winning a level
        const randomWild = WILDCARDS[Math.floor(Math.random() * WILDCARDS.length)];
        setPlayerWilds(prev => [...prev, randomWild.type]);
      } else {
        soundSynth.playLose();
        setAiFace("happy");
      }
      setGameStage("round-end");
    }, 800);
  };

  // Play a wildcard
  const handlePlayWildcard = (wildType) => {
    if (turn !== "player" || gameStage !== "playing" || isAnimating) return;

    soundSynth.playClick();

    if (wildType === "equinox") {
      // Swap scores
      const p = playerScore;
      setPlayerScore(aiScore);
      setAiScore(p);
      setRecentCombos([{ type: "wildcard", cells: [], score: 0 }]);
      setTimeout(() => setRecentCombos([]), 1000);
      
      // Consume wildcard
      setPlayerWilds(prev => {
        const idx = prev.indexOf("equinox");
        return prev.filter((_, i) => i !== idx);
      });
      setSelectedHandCard(null);
      setAiFace("shocked");
    } else if (wildType === "supermoon") {
      // Double score of next combo this turn
      setActiveWildEffect("supermoon");
      setPlayerWilds(prev => {
        const idx = prev.indexOf("supermoon");
        return prev.filter((_, i) => i !== idx);
      });
      setSelectedHandCard(null);
    } else if (wildType === "eclipse") {
      // Flip adjacent cards upon placement
      setActiveWildEffect("eclipse");
      setPlayerWilds(prev => {
        const idx = prev.indexOf("eclipse");
        return prev.filter((_, i) => i !== idx);
      });
      setSelectedHandCard(null);
    } else if (wildType === "meteor") {
      // Set active effect to meteor (enables clicking placed cards to remove them)
      setActiveWildEffect("meteor");
      setPlayerWilds(prev => {
        const idx = prev.indexOf("meteor");
        return prev.filter((_, i) => i !== idx);
      });
      setSelectedHandCard(null);
      setAiFace("shocked");
    }
  };

  // Click handler for board cells (supports click-to-place and drop events)
  const handleCellClick = (cellId, cardToPlay = null) => {
    if (turn !== "player" || gameStage !== "playing" || isAnimating) return;

    const card = cardToPlay || selectedHandCard;

    // Handle Meteor wildcard effect (remove clicked card)
    if (activeWildEffect === "meteor") {
      const targetCell = board.find(c => c.id === cellId);
      if (targetCell && targetCell.card) {
        setIsAnimating(true);
        soundSynth.playFlip();
        setBoard(prev => prev.map(c => c.id === cellId ? { ...c, card: null } : c));
        setActiveWildEffect(null);
        setTimeout(() => setIsAnimating(false), 500);
        return;
      }
    }

    if (!card || card.isWildcard) return;

    const targetCell = board.find(c => c.id === cellId);
    // Cell must not be blocked and must be empty
    if (!targetCell || targetCell.isBlocked || targetCell.card) return;

    setIsAnimating(true);
    soundSynth.playClick();

    // 1. Place card immediately on board
    setBoard(prevBoard => prevBoard.map(c => {
      if (c.id === cellId) {
        return { ...c, card: { ...card, owner: "player" } };
      }
      return c;
    }));

    // Remove from player hand and draw new one
    setPlayerHand(prevHand => {
      const nextHand = prevHand.filter(c => c.id !== card.id);
      let nextDeck = [...deck];
      if (nextDeck.length > 0) {
        const newCard = { ...nextDeck.shift(), owner: "player" };
        setDeck(nextDeck);
        setTimeout(() => soundSynth.playDraw(), 300);
        return [...nextHand, newCard];
      }
      return nextHand;
    });

    // 2. Evaluate combos on simulated board state
    const nextBoardState = board.map(c => {
      if (c.id === cellId) {
        return { ...c, card: { ...card, owner: "player" } };
      }
      return c;
    });

    // Special Solar Eclipse Wildcard effect (flip all adjacent cards to player color)
    if (activeWildEffect === "eclipse") {
      const directions = [
        { r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 }
      ];
      directions.forEach(dir => {
        const adj = nextBoardState.find(bc => bc.row === targetCell.row + dir.r && bc.col === targetCell.col + dir.c && !bc.isBlocked);
        if (adj && adj.card) {
          adj.card.owner = "player";
        }
      });
    }

    const isSupermoon = activeWildEffect === "supermoon";
    const { combos, score: scoreGained, cardsToFlip } = evaluateBoardCombos(nextBoardState, targetCell.row, targetCell.col, "player", isSupermoon);

    if (scoreGained > 0) {
      // Step A: Highlight combos immediately
      setRecentCombos(combos);

      // Step B: Flip cards after 500ms
      setTimeout(() => {
        setBoard(prev => prev.map(c => {
          if (cardsToFlip.includes(c.id) && c.card) {
            return { 
              ...c, 
              card: { ...c.card, owner: "player" },
              isFlipping: true
            };
          }
          return c;
        }));
        soundSynth.playFlip();

        // Clear flipping animation state
        setTimeout(() => {
          setBoard(prev => prev.map(c => c.isFlipping ? { ...c, isFlipping: false } : c));
        }, 600);
      }, 500);

      // Step C: Score and play chime after 1100ms
      setTimeout(() => {
        setPlayerScore(prev => prev + scoreGained);
        soundSynth.playScore();
      }, 1100);

      // Step D: Hand turn to AI after 1800ms
      setTimeout(() => {
        setRecentCombos([]);
        setSelectedHandCard(null);
        setActiveWildEffect(null);
        setIsAnimating(false);
        setTurn("ai");
      }, 1800);

    } else {
      // No combos: simple place card
      if (activeWildEffect === "eclipse") {
        setBoard(prev => prev.map(c => {
          const isAdj = Math.abs(c.row - targetCell.row) + Math.abs(c.col - targetCell.col) === 1;
          if (isAdj && !c.isBlocked && c.card && c.card.owner !== "player") {
            return { ...c, card: { ...c.card, owner: "player" }, isFlipping: true };
          }
          return c;
        }));
        soundSynth.playFlip();
        setTimeout(() => {
          setBoard(prev => prev.map(c => c.isFlipping ? { ...c, isFlipping: false } : c));
        }, 600);
      }

      setTimeout(() => {
        setSelectedHandCard(null);
        setActiveWildEffect(null);
        setIsAnimating(false);
        setTurn("ai");
      }, 800);
    }
  };

  return {
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
    setSelectedHandCard,
    startLevel,
    goToMenu,
    goToLevelSelect,
    goToTutorial,
    handlePlayWildcard,
    handleCellClick,
    handleToggleMute
  };
}
