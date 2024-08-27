
export interface player
{
    user_id: number;
    nickname: string;
    avatar: string; // or URL?
    intra_avatar: string;
}


export interface match {
    id: number;
    player_1: player | null;
    player_2: player | null;
    player_1_score: number | null;
    player_2_score: number | null;
    end_time: string | null;
    is_bye: boolean | null;
    is_played: boolean;
    tournament: URL;
    tree_level: number;
    tree_node: number;
    winner: player | null;
}