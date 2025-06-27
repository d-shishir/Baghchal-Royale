import numpy as np
from typing import List, Tuple, Dict, Optional
from enum import Enum

class Player(Enum):
    TIGER = 1
    GOAT = 2

class GamePhase(Enum):
    PLACEMENT = 1  # Goats are being placed
    MOVEMENT = 2   # Both tigers and goats can move

class PieceType(Enum):
    EMPTY = 0
    TIGER = 1
    GOAT = 2

class BaghchalEnv:
    """
    Baghchal (Tigers and Goats) game environment.
    
    Rules:
    - 5x5 board with specific movement patterns
    - 4 Tigers vs 20 Goats
    - Phase 1: Goats are placed one by one on empty intersections
    - Phase 2: Tigers and goats can move to adjacent intersections
    - Tigers win by capturing 5 goats
    - Goats win by blocking all tiger movements
    """
    
    def __init__(self):
        self.board_size = 5
        self.num_tigers = 4
        self.num_goats = 20
        self.goats_to_capture_for_tiger_win = 5
        
        # Initialize the game state
        self.reset()
        
        # Define valid connections on the board (which positions are connected)
        self._init_board_connections()
    
    def _init_board_connections(self):
        """Initialize the valid connections between board positions based on traditional Baghchal board."""
        self.connections = set()
        
        # Horizontal connections (all rows)
        for row in range(self.board_size):
            for col in range(self.board_size - 1):
                pos1 = (row, col)
                pos2 = (row, col + 1)
                self.connections.add((pos1, pos2))
                self.connections.add((pos2, pos1))
        
        # Vertical connections (all columns)
        for row in range(self.board_size - 1):
            for col in range(self.board_size):
                pos1 = (row, col)
                pos2 = (row + 1, col)
                self.connections.add((pos1, pos2))
                self.connections.add((pos2, pos1))
        
        # Diagonal connections - Two main diagonals (cross) + inner slanted square
        # Based on traditional Baghchal board layout
        
        # Main diagonal: top-left to bottom-right (full board)
        for i in range(self.board_size):
            if i < self.board_size - 1:
                pos1 = (i, i)
                pos2 = (i + 1, i + 1)
                self.connections.add((pos1, pos2))
                self.connections.add((pos2, pos1))
        
        # Anti-diagonal: top-right to bottom-left (full board)
        for i in range(self.board_size):
            if i < self.board_size - 1:
                pos1 = (i, self.board_size - 1 - i)
                pos2 = (i + 1, self.board_size - 2 - i)
                self.connections.add((pos1, pos2))
                self.connections.add((pos2, pos1))
        
        # Inner slanted square (diamond) connecting middle points of each side
        # Top middle to right middle
        self.connections.add(((0, 2), (2, 4)))
        self.connections.add(((2, 4), (0, 2)))
        
        # Right middle to bottom middle
        self.connections.add(((2, 4), (4, 2)))
        self.connections.add(((4, 2), (2, 4)))
        
        # Bottom middle to left middle
        self.connections.add(((4, 2), (2, 0)))
        self.connections.add(((2, 0), (4, 2)))
        
        # Left middle to top middle (completing the diamond)
        self.connections.add(((2, 0), (0, 2)))
        self.connections.add(((0, 2), (2, 0)))
    
    def reset(self):
        """Reset the game to initial state."""
        # Initialize empty board
        self.board = np.zeros((self.board_size, self.board_size), dtype=int)
        
        # Place tigers in corners
        tiger_positions = [(0, 0), (0, 4), (4, 0), (4, 4)]
        for pos in tiger_positions:
            self.board[pos] = PieceType.TIGER.value
        
        # Game state
        self.phase = GamePhase.PLACEMENT
        self.current_player = Player.GOAT  # Goats start by placing
        self.goats_placed = 0
        self.goats_captured = 0
        self.game_over = False
        self.winner = None
        
        return self.get_state()
    
    def get_state(self) -> Dict:
        """Get current game state."""
        return {
            'board': self.board.copy(),
            'phase': self.phase,
            'current_player': self.current_player,
            'goats_placed': self.goats_placed,
            'goats_captured': self.goats_captured,
            'game_over': self.game_over,
            'winner': self.winner
        }
    
    def get_valid_actions(self, player: Player) -> List[Tuple]:
        """Get list of valid actions for the given player."""
        if self.game_over:
            return []
        
        valid_actions = []
        
        if self.phase == GamePhase.PLACEMENT:
            if player == Player.GOAT:
                # During placement phase, goats can only place on empty positions
                for row in range(self.board_size):
                    for col in range(self.board_size):
                        if self.board[row, col] == PieceType.EMPTY.value:
                            valid_actions.append(('place', row, col))
            elif player == Player.TIGER:
                # During placement phase, tigers can move (but not place)
                for row in range(self.board_size):
                    for col in range(self.board_size):
                        if self.board[row, col] == PieceType.TIGER.value:
                            # Find valid moves for this tiger
                            moves = self._get_valid_moves_for_piece((row, col), player)
                            for move in moves:
                                valid_actions.append(('move', row, col, move[0], move[1]))
        
        elif self.phase == GamePhase.MOVEMENT:
            # During movement phase, get moves for the current player's pieces
            piece_type = PieceType.TIGER if player == Player.TIGER else PieceType.GOAT
            
            for row in range(self.board_size):
                for col in range(self.board_size):
                    if self.board[row, col] == piece_type.value:
                        # Find valid moves for this piece
                        moves = self._get_valid_moves_for_piece((row, col), player)
                        for move in moves:
                            valid_actions.append(('move', row, col, move[0], move[1]))
        
        return valid_actions
    
    def _get_valid_moves_for_piece(self, position: Tuple[int, int], player: Player) -> List[Tuple[int, int]]:
        """Get valid moves for a piece at the given position."""
        valid_moves = []
        
        if player == Player.TIGER:
            # Tigers can move to directly connected empty positions or capture goats
            # Check all directly connected positions first (one step moves)
            for (pos1, pos2) in self.connections:
                if pos1 == position:
                    target_pos = pos2
                    if self.board[target_pos] == PieceType.EMPTY.value:
                        valid_moves.append(target_pos)
            
            # Check for capture moves (jumping over goats)
            # For each directly connected position that has a goat,
            # check if we can jump over it to an empty position
            for (pos1, pos2) in self.connections:
                if pos1 == position and self.board[pos2] == PieceType.GOAT.value:
                    # Found a goat adjacent to tiger, check if we can jump over it
                    jump_targets = self._get_jump_targets(position, pos2)
                    for target in jump_targets:
                        if (0 <= target[0] < self.board_size and 
                            0 <= target[1] < self.board_size and
                            self.board[target] == PieceType.EMPTY.value):
                            valid_moves.append(target)
        
        elif player == Player.GOAT:
            # Goats can only move to directly connected empty positions
            for (pos1, pos2) in self.connections:
                if pos1 == position:
                    target_pos = pos2
                    if self.board[target_pos] == PieceType.EMPTY.value:
                        valid_moves.append(target_pos)
        
        return valid_moves
    
    def _get_jump_targets(self, tiger_pos: Tuple[int, int], goat_pos: Tuple[int, int]) -> List[Tuple[int, int]]:
        """Get possible jump targets when a tiger captures a goat."""
        jump_targets = []
        
        # Calculate direction vector from tiger to goat
        dr = goat_pos[0] - tiger_pos[0]
        dc = goat_pos[1] - tiger_pos[1]
        
        # The jump target is one more step in the same direction
        target_row = goat_pos[0] + dr
        target_col = goat_pos[1] + dc
        target_pos = (target_row, target_col)
        
        # Verify that the jump path is valid (goat_pos to target_pos must be connected)
        if (goat_pos, target_pos) in self.connections:
            jump_targets.append(target_pos)
        
        return jump_targets
    
    def _is_valid_tiger_move(self, from_pos: Tuple[int, int], to_pos: Tuple[int, int]) -> bool:
        """Check if a tiger move is valid (simplified - main logic is in _get_valid_moves_for_piece)."""
        if from_pos == to_pos:
            return False
        
        # Check if it's a simple adjacent move
        if self._are_positions_connected(from_pos, to_pos):
            return self.board[to_pos] == PieceType.EMPTY.value
        
        # Check if it's a valid capture move
        return self._is_valid_capture_move(from_pos, to_pos)
    
    def _is_valid_goat_move(self, from_pos: Tuple[int, int], to_pos: Tuple[int, int]) -> bool:
        """Check if a goat move is valid (simplified - main logic is in _get_valid_moves_for_piece)."""
        if from_pos == to_pos:
            return False
        
        # Goats can only move to directly connected empty positions
        return (self._are_positions_connected(from_pos, to_pos) and 
                self.board[to_pos] == PieceType.EMPTY.value)
    
    def _is_valid_capture_move(self, from_pos: Tuple[int, int], to_pos: Tuple[int, int]) -> bool:
        """Check if a tiger can capture a goat by jumping along valid board connections."""
        # Find potential goat positions between from_pos and to_pos
        # The goat must be directly connected to the tiger,
        # and the target must be directly connected to the goat
        
        for (pos1, pos2) in self.connections:
            if pos1 == from_pos:
                # Found a position connected to tiger
                potential_goat_pos = pos2
                
                # Check if this position has a goat
                if self.board[potential_goat_pos] == PieceType.GOAT.value:
                    # Check if the target is connected to the goat
                    if (potential_goat_pos, to_pos) in self.connections:
                        # Check if target is empty
                        if self.board[to_pos] == PieceType.EMPTY.value:
                            return True
        
        return False
    
    def _are_positions_connected(self, pos1: Tuple[int, int], pos2: Tuple[int, int]) -> bool:
        """Check if two positions are directly connected on the board."""
        return (pos1, pos2) in self.connections
    
    def step(self, action: Tuple) -> Tuple[Dict, float, bool, Dict]:
        """
        Execute an action and return new state, reward, done flag, and info.
        
        Args:
            action: Tuple describing the action
                   - For placement: ('place', row, col)
                   - For movement: ('move', from_row, from_col, to_row, to_col)
        
        Returns:
            state: New game state
            reward: Reward for the action
            done: Whether game is over
            info: Additional information
        """
        if self.game_over:
            return self.get_state(), 0, True, {'error': 'Game is already over'}
        
        reward = 0
        info = {}
        
        try:
            if action[0] == 'place':
                reward = self._execute_placement(action)
            elif action[0] == 'move':
                reward = self._execute_movement(action)
            else:
                info['error'] = f'Invalid action type: {action[0]}'
                return self.get_state(), -1, self.game_over, info
        
        except Exception as e:
            info['error'] = str(e)
            return self.get_state(), -1, self.game_over, info
        
        # Check for game over conditions
        self._check_game_over()
        
        # Switch players
        if not self.game_over:
            self._switch_player()
        
        return self.get_state(), reward, self.game_over, info
    
    def _execute_placement(self, action: Tuple) -> float:
        """Execute a goat placement action."""
        _, row, col = action
        
        if self.phase != GamePhase.PLACEMENT:
            raise ValueError("Cannot place goats during movement phase")
        
        if self.current_player != Player.GOAT:
            raise ValueError("Only goats can place during placement phase")
        
        if self.board[row, col] != PieceType.EMPTY.value:
            raise ValueError(f"Position ({row}, {col}) is not empty")
        
        # Place the goat
        self.board[row, col] = PieceType.GOAT.value
        self.goats_placed += 1
        
        # Check if all goats are placed
        if self.goats_placed >= self.num_goats:
            self.phase = GamePhase.MOVEMENT
            # Don't switch player here - let _switch_player handle it
            # Tigers should move first in movement phase
        
        return 0.1  # Small reward for successful placement
    
    def _execute_movement(self, action: Tuple) -> float:
        """Execute a movement action."""
        _, from_row, from_col, to_row, to_col = action
        
        # Tigers can move during both placement and movement phases
        # Goats can only move during movement phase
        if self.phase == GamePhase.PLACEMENT and self.current_player != Player.TIGER:
            raise ValueError("Only tigers can move during placement phase")
        
        from_pos = (from_row, from_col)
        to_pos = (to_row, to_col)
        
        # Validate the move
        piece_type = PieceType.TIGER if self.current_player == Player.TIGER else PieceType.GOAT
        if self.board[from_pos] != piece_type.value:
            raise ValueError(f"No {self.current_player.name.lower()} at position {from_pos}")
        
        if not self._is_valid_move(from_pos, to_pos, self.current_player):
            raise ValueError(f"Invalid move from {from_pos} to {to_pos}")
        
        reward = 0
        
        # Execute the move
        self.board[from_pos] = PieceType.EMPTY.value
        self.board[to_pos] = piece_type.value
        
        # Check for capture (only tigers can capture)
        if self.current_player == Player.TIGER:
            captured_pos = self._get_captured_position(from_pos, to_pos)
            if captured_pos:
                self.board[captured_pos] = PieceType.EMPTY.value
                self.goats_captured += 1
                reward = 10  # High reward for capturing a goat
            else:
                reward = 0.1  # Small reward for moving
        else:
            reward = 0.1  # Small reward for goat movement
        
        return reward
    
    def _is_valid_move(self, from_pos: Tuple[int, int], to_pos: Tuple[int, int], player: Player) -> bool:
        """Check if a move is valid for the given player."""
        if player == Player.TIGER:
            return self._is_valid_tiger_move(from_pos, to_pos)
        else:
            return self._is_valid_goat_move(from_pos, to_pos)
    
    def _get_captured_position(self, from_pos: Tuple[int, int], to_pos: Tuple[int, int]) -> Optional[Tuple[int, int]]:
        """Get the position of captured goat if this is a capture move."""
        from_row, from_col = from_pos
        to_row, to_col = to_pos
        
        # Check if this is a jump move
        if abs(to_row - from_row) == 2 or abs(to_col - from_col) == 2:
            mid_row = (from_row + to_row) // 2
            mid_col = (from_col + to_col) // 2
            mid_pos = (mid_row, mid_col)
            
            if self.board[mid_pos] == PieceType.GOAT.value:
                return mid_pos
        
        return None
    
    def _switch_player(self):
        """Switch the current player."""
        if self.phase == GamePhase.PLACEMENT:
            # During placement phase: Goat places, then Tiger moves, repeat
            self.current_player = Player.TIGER if self.current_player == Player.GOAT else Player.GOAT
        else:
            # During movement phase, alternate between tigers and goats
            self.current_player = Player.TIGER if self.current_player == Player.GOAT else Player.GOAT
    
    def _check_game_over(self):
        """Check if the game is over and determine the winner."""
        # Tigers win if they capture enough goats
        if self.goats_captured >= self.goats_to_capture_for_tiger_win:
            self.game_over = True
            self.winner = Player.TIGER
            return
        
        # Goats win if all tigers are blocked (only check during movement phase)
        if self.phase == GamePhase.MOVEMENT:
            tiger_can_move = False
            for row in range(self.board_size):
                for col in range(self.board_size):
                    if self.board[row, col] == PieceType.TIGER.value:
                        if len(self._get_valid_moves_for_piece((row, col), Player.TIGER)) > 0:
                            tiger_can_move = True
                            break
                if tiger_can_move:
                    break
            
            if not tiger_can_move:
                self.game_over = True
                self.winner = Player.GOAT
    
    def is_game_over(self) -> bool:
        """Check if the game is over."""
        return self.game_over
    
    def render(self, mode='text'):
        """Render the current board state."""
        if mode == 'text':
            print("\n" + "="*30)
            print(f"Phase: {self.phase.name}")
            print(f"Current Player: {self.current_player.name}")
            print(f"Goats Placed: {self.goats_placed}/{self.num_goats}")
            print(f"Goats Captured: {self.goats_captured}")
            
            if self.game_over:
                print(f"GAME OVER - Winner: {self.winner.name if self.winner else 'Draw'}")
            
            print("\nBoard:")
            print("   0 1 2 3 4")
            
            for row in range(self.board_size):
                print(f"{row}  ", end="")
                for col in range(self.board_size):
                    piece = self.board[row, col]
                    if piece == PieceType.TIGER.value:
                        print("T", end=" ")
                    elif piece == PieceType.GOAT.value:
                        print("G", end=" ")
                    else:
                        print(".", end=" ")
                print()
            
            print("="*30)
        
        return self.board.copy()

# Test the environment
if __name__ == "__main__":
    env = BaghchalEnv()
    env.render()
    
    # Test some moves
    print("\nTesting goat placement...")
    state, reward, done, info = env.step(('place', 1, 1))
    env.render()
    
    print(f"Reward: {reward}, Done: {done}, Info: {info}") 