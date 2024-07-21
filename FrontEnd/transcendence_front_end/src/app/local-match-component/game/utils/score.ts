import GameScene from "../scene/GameScene";

class Score
{
	private _score: number;
	constructor(private newScore: number)
	{
		this._score = newScore;
	}
	
	public incrementScore = () =>
	{
		this._score++;
	}
	getScore(): number
	{
		return this._score;
	}

	post = async () =>
	{
		// await fetch('http://localhost:3000/score', {
		// 	method: 'POST',
		// 	headers: {'Content-Type': 'application/json',},
		// 	body: JSON.stringify({name: this._name, score: this._score}),
		// });
		return ;
	}

	public setScore(score: number) 
	{
		this._score = score;
	}
}

export default Score;