/* export interface match 
{
    Tournament_id?: number;
    Match_id: number;
    user_id: number;
    user_nickName: string; //should I use it here or fetch it
    opponent_id: number;
    opponent_username: string; // should I use it here or fetch it later
} */

/* 
export interface match {
    id: number;
    player1: string;
    player2: string | null;
    is_played: boolean;
    tree_level: number;
    tree_node: number;
    winner: string | null;
    player1Score?: number;
    player2Score?: number;
  } */
// post the data in the tournament and to fetch the new update of the matches

export interface match {
    tournament_id: number;
    match_id: number;
    player1_Score: number;
    player2_Score: number;
}