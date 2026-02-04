import {
    GameState,
    PieceType,
    PlayerSide,
    getAllValidMoves,
    isMoveValid,
    generateCaptureChains,
    countTigerMobility,
    countGoatMobility,
    getEmptyNeighborsAroundTigers,
    countVulnerableGoats,
    getPositionHash,
    initializeZobrist,
    makeMove,
    undoMove,
    cloneGameState,
    GameStatus,
    Position,
} from './baghchal';
import { GuestModeAI } from './guestAI';
import { AIDifficulty } from './aiTypes';

/**
 * Test suite for Baghchal game logic and AI
 */

// Helper to create a test state
function createTestState(
    board: number[][],
    currentPlayer: PlayerSide = 'Goat',
    phase: 'placement' | 'movement' = 'placement',
    goatsPlaced: number = 0,
    goatsCaptured: number = 0
): GameState {
    return {
        board: board as PieceType[][],
        currentPlayer,
        phase,
        goatsCaptured,
        goatsPlaced,
        status: GameStatus.IN_PROGRESS,
        selectedPosition: null,
        movesSinceCaptureOrPlacement: 0,
        lastMove: null,
    };
}

// Test 1: Board connectivity validation
console.log('=== Test 1: Board Connectivity ===');
const initialBoard = [
    [1, 0, 0, 0, 1],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [1, 0, 0, 0, 1],
];
const state1 = createTestState(initialBoard, 'Goat');
const moves1 = getAllValidMoves(state1);
console.log(`✓ Initial goat placements available: ${moves1.length} (expected 21)`);
console.assert(moves1.length === 21, 'Should have 21 empty squares');

// Test 2: Tiger move generation
console.log('\n=== Test 2: Tiger Move Generation ===');
const state2 = createTestState(initialBoard, 'Tiger', 'movement', 20);
const tigerMoves = getAllValidMoves(state2);
console.log(`✓ Tiger moves from corners: ${tigerMoves.length}`);
console.assert(tigerMoves.length > 0, 'Tigers should have valid moves');

// Test 3: Tiger capture detection
console.log('\n=== Test 3: Tiger Captures ===');
const captureBoard = [
    [1, 0, 0, 0, 0],
    [0, 2, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
];
const state3 = createTestState(captureBoard, 'Tiger', 'movement', 20);
const tigerPos: Position = [0, 0];
const chains = generateCaptureChains(tigerPos, state3.board);
console.log(`✓ Capture chains found: ${chains.length}`);
console.assert(chains.length > 0, 'Should find at least one capture chain');
if (chains.length > 0) {
    console.log(`  Chain: ${JSON.stringify(chains[0])}`);
    console.assert(
        chains[0].capturedGoats.length > 0,
        'Chain should capture at least one goat'
    );
}

// Test 4: Multi-capture chains
console.log('\n=== Test 4: Multi-Capture Chains ===');
const multiCaptureBoard = [
    [1, 0, 0, 0, 0],
    [0, 2, 0, 0, 0],
    [0, 0, 0, 2, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
];
const state4 = createTestState(multiCaptureBoard, 'Tiger', 'movement', 20);
const multiChains = generateCaptureChains([0, 0], state4.board);
console.log(`✓ Multi-capture chains found: ${multiChains.length}`);
const hasMultiCapture = multiChains.some(chain => chain.capturedGoats.length > 1);
console.log(`  Found multi-capture: ${hasMultiCapture}`);

// Test 5: Zobrist hashing
console.log('\n=== Test 5: Zobrist Hashing ===');
initializeZobrist();
const hash1 = getPositionHash(state1);
const hash2 = getPositionHash(state2);
console.log(`✓ Hash 1: ${hash1}`);
console.log(`✓ Hash 2: ${hash2}`);
console.assert(hash1 !== hash2, 'Different positions should have different hashes');

const clonedState = cloneGameState(state1);
const hashcloned = getPositionHash(clonedState);
console.assert(hash1 === hashcloned, 'Cloned state should have same hash');
console.log('✓ Cloned state has same hash');

// Test 6: Make/Undo move
console.log('\n=== Test 6: Make/Undo Move ===');
const state6 = createTestState(initialBoard, 'Goat', 'placement', 0);
const originalHash = getPositionHash(state6);
const testMove = { type: 'place' as const, to: [2, 2] as Position };
const undoInfo = makeMove(state6, testMove);
const afterMoveHash = getPositionHash(state6);
console.log(`✓ Hash changed after move: ${originalHash !== afterMoveHash}`);
console.assert(state6.board[2][2] === PieceType.GOAT, 'Goat should be placed');
console.assert(state6.goatsPlaced === 1, 'Goats placed should increment');

undoMove(state6, testMove, undoInfo);
const afterUndoHash = getPositionHash(state6);
console.assert(state6.board[2][2] === PieceType.EMPTY, 'Square should be empty after undo');
console.assert(state6.goatsPlaced === 0, 'Goats placed should be back to 0');
console.assert(originalHash === afterUndoHash, 'Hash should match after undo');
console.log('✓ Undo restored state correctly');

// Test 7: AI Easy difficulty
console.log('\n=== Test 7: AI Easy Difficulty ===');
const ai = new GuestModeAI(AIDifficulty.EASY);
ai.setAISide('Goat');
const startTime = Date.now();
const easyMove = ai.getMove(state1);
const easyTime = Date.now() - startTime;
console.log(`✓ Easy AI returned move in ${easyTime}ms`);
console.assert(easyMove !== null, 'Easy AI should return a move');
console.assert(easyTime < 100, 'Easy AI should be fast (<100ms)');
if (easyMove) {
    console.log(`  Move: ${JSON.stringify(easyMove)}`);
    console.assert(isMoveValid(state1, easyMove), 'AI move should be valid');
}

// Test 8: AI Medium difficulty
console.log('\n=== Test 8: AI Medium Difficulty ===');
ai.setDifficulty(AIDifficulty.MEDIUM);
const medStart = Date.now();
const mediumMove = ai.getMove(state1);
const mediumTime = Date.now() - medStart;
console.log(`✓ Medium AI returned move in ${mediumTime}ms`);
console.assert(mediumMove !== null, 'Medium AI should return a move');
console.assert(mediumTime < 300, 'Medium AI should complete within time budget');
if (mediumMove) {
    console.assert(isMoveValid(state1, mediumMove), 'AI move should be valid');
}

// Test 9: AI Hard difficulty
console.log('\n=== Test 9: AI Hard Difficulty ===');
ai.setDifficulty(AIDifficulty.HARD);
const hardStart = Date.now();
const hardMove = ai.getMove(state1);
const hardTime = Date.now() - hardStart;
console.log(`✓ Hard AI returned move in ${hardTime}ms`);
console.assert(hardMove !== null, 'Hard AI should return a move');
console.assert(hardTime < 1500, 'Hard AI should complete within time budget');
if (hardMove) {
    console.assert(isMoveValid(state1, hardMove), 'AI move should be valid');
}

// Test 10: AI as Tigers (capture behavior)
console.log('\n=== Test 10: AI Tigers Capture Behavior ===');
const captureTestState = createTestState(captureBoard, 'Tiger', 'movement', 20, 0);
ai.setAISide('Tiger');
ai.setDifficulty(AIDifficulty.HARD);
const tigerMove = ai.getMove(captureTestState);
console.log(`✓ Tiger AI move: ${JSON.stringify(tigerMove)}`);
console.assert(tigerMove !== null, 'Tiger AI should find a move');
// Check if AI attempts to capture when possible
if (tigerMove && tigerMove.type === 'move') {
    const dx = Math.abs(tigerMove.from[0] - tigerMove.to[0]);
    const dy = Math.abs(tigerMove.from[1] - tigerMove.to[1]);
    const isCapture = dx > 1 || dy > 1;
    console.log(`  Is capture move: ${isCapture}`);
}

// Test 11: No illegal moves generated
console.log('\n=== Test 11: AI Move Validity (100 iterations) ===');
let validCount = 0;
const testState11 = cloneGameState(state1);
ai.setAISide('Goat');
ai.setDifficulty(AIDifficulty.MEDIUM);

for (let i = 0; i < 100; i++) {
    const testStateClone = cloneGameState(testState11);
    const aiMove = ai.getMove(testStateClone);
    if (aiMove && isMoveValid(testStateClone, aiMove)) {
        validCount++;
    }
}
console.log(`✓ Valid moves: ${validCount}/100`);
console.assert(validCount === 100, 'All AI moves should be valid');

// Test 12: Evaluation functions
console.log('\n=== Test 12: Evaluation Helpers ===');
const tigerMob = countTigerMobility(state2);
console.log(`✓ Tiger mobility: ${tigerMob}`);
console.assert(tigerMob > 0, 'Tigers should have mobility from corners');

const goatMob = countGoatMobility(state1);
console.log(`✓ Goat mobility (placement): ${goatMob}`);
console.assert(goatMob === 21, 'Goats should have 21 placement options');

const emptyAround = getEmptyNeighborsAroundTigers(state1);
console.log(`✓ Empty neighbors around tigers: ${emptyAround}`);
console.assert(emptyAround.length === 4, 'Should track all 4 tigers');

const vulnerable = countVulnerableGoats(state3);
console.log(`✓ Vulnerable goats: ${vulnerable}`);

// Test 13: Performance test (AI time budgets)
console.log('\n=== Test 13: Performance Test ===');
const perfTests = [
    { difficulty: AIDifficulty.EASY, maxTime: 100 },
    { difficulty: AIDifficulty.MEDIUM, maxTime: 300 },
    { difficulty: AIDifficulty.HARD, maxTime: 1500 },
];

for (const test of perfTests) {
    ai.setDifficulty(test.difficulty);
    const times: number[] = [];
    
    for (let i = 0; i < 5; i++) {
        const start = Date.now();
        ai.getMove(state1);
        times.push(Date.now() - start);
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    console.log(`✓ ${test.difficulty.toUpperCase()}: avg ${avgTime.toFixed(0)}ms, max ${maxTime}ms (budget: ${test.maxTime}ms)`);
    console.assert(maxTime < test.maxTime * 1.2, `${test.difficulty} should respect time budget`);
}

console.log('\n=== All Tests Completed ===');
console.log('✅ Baghchal AI implementation verified!');
