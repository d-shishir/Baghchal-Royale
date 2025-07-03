"""
ELO Rating Calculation
"""

def calculate_elo(rating1: int, rating2: int, result: float, k: int = 32) -> tuple[int, int]:
    """
    Calculates the new ELO ratings for two players based on the game outcome.

    :param rating1: ELO rating of player 1.
    :param rating2: ELO rating of player 2.
    :param result: Game result from player 1's perspective (1 for win, 0.5 for draw, 0 for loss).
    :param k: K-factor, determines how much ratings change.
    :return: A tuple containing the new ELO ratings for player 1 and player 2.
    """
    expected1 = 1 / (1 + 10 ** ((rating2 - rating1) / 400))
    expected2 = 1 / (1 + 10 ** ((rating1 - rating2) / 400))

    new_rating1 = round(rating1 + k * (result - expected1))
    new_rating2 = round(rating2 + k * ((1 - result) - expected2))

    return new_rating1, new_rating2 