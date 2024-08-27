export interface UserProfile {
	user_id: number;
	nickname: string;
	avatar?: string;
	intra_avatar?: string;
	online_status: boolean;
	preferred_language: string;
}
